import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSocketStore } from './socket'

const ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }]
const CALL_TIMEOUT = 30000

export const useCallStore = defineStore('call', () => {
  const phase = ref('idle')
  const callId = ref('')
  const peerName = ref('')
  const muted = ref(false)
  const notice = ref('')
  const remoteStream = ref(null)

  let pc = null
  let localStream = null
  let timer = null
  let remoteReady = false
  let pendingCandidates = []

  function send(payload) {
    useSocketStore().send(payload)
  }

  function setPhase(next) {
    phase.value = next
  }

  function reset() {
    clearTimeout(timer)
    timer = null

    if (pc) {
      pc.onicecandidate = null
      pc.ontrack = null
      pc.close()
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
    }

    pc = null
    localStream = null
    remoteStream.value = null
    remoteReady = false
    pendingCandidates = []
    callId.value = ''
    peerName.value = ''
    muted.value = false
    setPhase('idle')
  }

  function createPeer() {
    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    pc.onicecandidate = (event) => {
      if (event.candidate && callId.value) {
        send({ type: 'ice_candidate', callId: callId.value, candidate: event.candidate })
      }
    }

    pc.ontrack = (event) => {
      remoteStream.value = event.streams[0]
      setPhase('active')
    }

    pc.onconnectionstatechange = () => {
      if (pc && ['failed', 'closed'].includes(pc.connectionState)) {
        end()
      }
    }

    return pc
  }

  async function attachMic() {
    if (!pc) createPeer()

    if (!localStream) {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream))
    }
  }

  async function addPendingCandidates() {
    for (const candidate of pendingCandidates) {
      try {
        await pc.addIceCandidate(candidate)
      } catch {
        continue
      }
    }
    pendingCandidates = []
  }

  async function start(orderId) {
    if (phase.value !== 'idle') return
    if (!navigator.mediaDevices?.getUserMedia) {
      notice.value = 'This browser cannot make calls'
      return
    }

    callId.value = crypto.randomUUID()
    peerName.value = 'Customer'
    setPhase('outgoing')
    notice.value = ''
    send({ type: 'call_invite', callId: callId.value, orderId, mode: 'order' })

    timer = setTimeout(() => {
      if (phase.value === 'outgoing') {
        notice.value = 'No answer'
        reset()
      }
    }, CALL_TIMEOUT)
  }

  async function accept() {
    if (phase.value !== 'incoming') return

    try {
      await attachMic()
      send({ type: 'call_accept', callId: callId.value })
      remoteReady = false
    } catch {
      notice.value = 'Microphone access is not available'
      decline()
    }
  }

  function decline() {
    if (callId.value) {
      send({ type: 'call_decline', callId: callId.value })
    }
    reset()
  }

  function end() {
    if (callId.value && phase.value !== 'idle') {
      send({ type: 'call_end', callId: callId.value })
    }
    reset()
  }

  function toggleMute() {
    muted.value = !muted.value
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !muted.value
    })
  }

  async function handleOffer(sdp) {
    await attachMic()
    await pc.setRemoteDescription(new RTCSessionDescription(sdp))
    remoteReady = true
    await addPendingCandidates()
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    send({ type: 'webrtc_answer', callId: callId.value, sdp: answer })
    setPhase('active')
  }

  async function handleAnswer(sdp) {
    if (!pc) return
    await pc.setRemoteDescription(new RTCSessionDescription(sdp))
    remoteReady = true
    await addPendingCandidates()
    setPhase('active')
  }

  async function handleCandidate(candidate) {
    if (!candidate) return
    if (!pc || !remoteReady) {
      pendingCandidates.push(candidate)
      return
    }
    try {
      await pc.addIceCandidate(candidate)
    } catch {
      return
    }
  }

  async function handleInvite(data) {
    if (phase.value !== 'idle') {
      send({ type: 'call_decline', callId: data.callId })
      return
    }

    callId.value = data.callId
    peerName.value = data.from?.name || 'Customer'
    notice.value = ''
    setPhase('incoming')
  }

  function handleMessage(message) {
    const data = message.data || {}

    switch (message.type) {
      case 'call_invite':
        handleInvite(data)
        break
      case 'call_accepted':
        beginOutgoing(data)
        break
      case 'call_declined':
        notice.value = 'Call declined'
        reset()
        break
      case 'call_unavailable':
        notice.value = data.reason || 'The other side is unavailable'
        reset()
        break
      case 'call_end':
        notice.value = 'Call ended'
        reset()
        break
      case 'webrtc_offer':
        handleOffer(data.sdp)
        break
      case 'webrtc_answer':
        handleAnswer(data.sdp)
        break
      case 'ice_candidate':
        handleCandidate(data.candidate)
        break
      default:
        break
    }
  }

  async function beginOutgoing(data) {
    if (callId.value !== data.callId) return

    try {
      await attachMic()
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      send({ type: 'webrtc_offer', callId: callId.value, sdp: offer })
    } catch {
      notice.value = 'Could not start the call'
      end()
    }
  }

  return {
    phase,
    peerName,
    muted,
    notice,
    remoteStream,
    start,
    accept,
    decline,
    end,
    toggleMute,
    handleMessage
  }
})