import { defineStore } from 'pinia';
import { ref } from 'vue';

import type { WsMessage } from '@/api/types';
import { useSocketStore } from './socket';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];
const CALL_TIMEOUT = 30000;

export type CallPhase = 'idle' | 'outgoing' | 'incoming' | 'active';

export const useCallStore = defineStore('call', () => {
  const phase = ref<CallPhase>('idle');
  const callId = ref('');
  const peerName = ref('');
  const muted = ref(false);
  const notice = ref('');
  const remoteStream = ref<MediaStream | null>(null);

  let pc: RTCPeerConnection | null = null;
  let localStream: MediaStream | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let remoteReady = false;
  let pendingCandidates: RTCIceCandidateInit[] = [];

  function send(payload: Record<string, unknown>): void {
    useSocketStore().send(payload);
  }

  function setPhase(next: CallPhase): void {
    phase.value = next;
  }

  function reset(): void {
    if (timer) clearTimeout(timer);
    timer = null;

    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.close();
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    pc = null;
    localStream = null;
    remoteStream.value = null;
    remoteReady = false;
    pendingCandidates = [];
    callId.value = '';
    peerName.value = '';
    muted.value = false;
    setPhase('idle');
  }

  function createPeer(): RTCPeerConnection {
    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate && callId.value) {
        send({ type: 'ice_candidate', callId: callId.value, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      remoteStream.value = event.streams[0];
      setPhase('active');
    };

    pc.onconnectionstatechange = () => {
      if (pc && ['failed', 'closed'].includes(pc.connectionState)) {
        end();
      }
    };

    return pc;
  }

  async function attachMic(): Promise<void> {
    if (!pc) createPeer();
    if (!localStream) {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.getTracks().forEach((track) => pc!.addTrack(track, localStream!));
    }
  }

  async function addPendingCandidates(): Promise<void> {
    for (const candidate of pendingCandidates) {
      try {
        await pc!.addIceCandidate(candidate);
      } catch {
        continue;
      }
    }
    pendingCandidates = [];
  }

  async function start(orderId: string): Promise<void> {
    if (phase.value !== 'idle') return;
    if (!navigator.mediaDevices?.getUserMedia) {
      notice.value = 'This browser cannot make calls';
      return;
    }

    callId.value = crypto.randomUUID();
    peerName.value = 'Customer';
    setPhase('outgoing');
    notice.value = '';
    send({ type: 'call_invite', callId: callId.value, orderId, mode: 'order' });

    timer = setTimeout(() => {
      if (phase.value === 'outgoing') {
        notice.value = 'No answer';
        reset();
      }
    }, CALL_TIMEOUT);
  }

  async function accept(): Promise<void> {
    if (phase.value !== 'incoming') return;
    try {
      await attachMic();
      send({ type: 'call_accept', callId: callId.value });
      remoteReady = false;
    } catch {
      notice.value = 'Microphone access is not available';
      decline();
    }
  }

  function decline(): void {
    if (callId.value) send({ type: 'call_decline', callId: callId.value });
    reset();
  }

  function end(): void {
    if (callId.value && phase.value !== 'idle') {
      send({ type: 'call_end', callId: callId.value });
    }
    reset();
  }

  function toggleMute(): void {
    muted.value = !muted.value;
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !muted.value;
    });
  }

  async function handleOffer(sdp: RTCSessionDescriptionInit): Promise<void> {
    await attachMic();
    await pc!.setRemoteDescription(new RTCSessionDescription(sdp));
    remoteReady = true;
    await addPendingCandidates();
    const answer = await pc!.createAnswer();
    await pc!.setLocalDescription(answer);
    send({ type: 'webrtc_answer', callId: callId.value, sdp: answer });
    setPhase('active');
  }

  async function handleAnswer(sdp: RTCSessionDescriptionInit): Promise<void> {
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    remoteReady = true;
    await addPendingCandidates();
    setPhase('active');
  }

  async function handleCandidate(candidate: RTCIceCandidateInit | null): Promise<void> {
    if (!candidate) return;
    if (!pc || !remoteReady) {
      pendingCandidates.push(candidate);
      return;
    }
    try {
      await pc.addIceCandidate(candidate);
    } catch {
      return;
    }
  }

  function handleInvite(data: { callId: string; from?: { name?: string } }): void {
    if (phase.value !== 'idle') {
      send({ type: 'call_decline', callId: data.callId });
      return;
    }
    callId.value = data.callId;
    peerName.value = data.from?.name || 'Customer';
    notice.value = '';
    setPhase('incoming');
  }

  async function beginOutgoing(data: { callId: string }): Promise<void> {
    if (callId.value !== data.callId) return;
    try {
      await attachMic();
      const offer = await pc!.createOffer();
      await pc!.setLocalDescription(offer);
      send({ type: 'webrtc_offer', callId: callId.value, sdp: offer });
    } catch {
      notice.value = 'Could not start the call';
      end();
    }
  }

  function handleMessage(message: WsMessage): void {
    const data = (message.data ?? {}) as Record<string, any>;
    switch (message.type) {
      case 'call_invite':
        handleInvite(data as { callId: string; from?: { name?: string } });
        break;
      case 'call_accepted':
        void beginOutgoing(data as { callId: string });
        break;
      case 'call_declined':
        notice.value = 'Call declined';
        reset();
        break;
      case 'call_unavailable':
        notice.value = (data.reason as string) || 'The other side is unavailable';
        reset();
        break;
      case 'call_end':
        notice.value = 'Call ended';
        reset();
        break;
      case 'webrtc_offer':
        void handleOffer(data.sdp as RTCSessionDescriptionInit);
        break;
      case 'webrtc_answer':
        void handleAnswer(data.sdp as RTCSessionDescriptionInit);
        break;
      case 'ice_candidate':
        void handleCandidate(data.candidate as RTCIceCandidateInit | null);
        break;
      default:
        break;
    }
  }

  return {
    phase,
    callId,
    peerName,
    muted,
    notice,
    remoteStream,
    start,
    accept,
    decline,
    end,
    toggleMute,
    handleMessage,
  };
});
