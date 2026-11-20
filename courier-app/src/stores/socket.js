import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { useOrderStore } from './order'
import { useChatStore } from './chat'

const WS_URL = 'ws://localhost:3000/ws'

export const useSocketStore = defineStore('socket', () => {
  const socket = ref(null)
  const connected = ref(false)
  const channels = new Set()

  function send(payload) {
    if (socket.value && connected.value) {
      socket.value.send(JSON.stringify(payload))
    }
  }

  function connect() {
    const authStore = useAuthStore()
    if (!authStore.accessToken) return

    socket.value = new WebSocket(WS_URL)

    socket.value.onopen = () => {
      connected.value = true
      send({ type: 'auth', token: authStore.accessToken })
      channels.forEach((channel) => send({ type: 'subscribe', channel }))
      send({ type: 'subscribe', channel: 'orders' })
    }

    socket.value.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleSocketMessage(data)
    }

    socket.value.onclose = () => {
      connected.value = false
      setTimeout(connect, 3000)
    }

    socket.value.onerror = () => {
      connected.value = false
    }
  }

  function subscribe(channel) {
    channels.add(channel)
    send({ type: 'subscribe', channel })
  }

  function unsubscribe(channel) {
    channels.delete(channel)
    send({ type: 'unsubscribe', channel })
  }

  function handleSocketMessage(message) {
    const orderStore = useOrderStore()
    const chatStore = useChatStore()

    switch (message.type) {
      case 'order_updated':
      case 'new_order':
      case 'order_cancelled':
        orderStore.fetchOrders().catch(() => {})
        if (message.type === 'order_updated' && message.data?.id) {
          orderStore.fetchOrderById(message.data.id).catch(() => {})
        }
        break

      case 'chat_message':
        chatStore.receive(message.data)
        break

      default:
        break
    }
  }

  function sendLocationUpdate(orderId, lat, lng) {
    send({ type: 'courier_location_update', orderId, lat, lng })
  }

  function disconnect() {
    if (socket.value) {
      socket.value.close()
      socket.value = null
      connected.value = false
    }
  }

  return {
    socket,
    connected,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    sendLocationUpdate
  }
})
