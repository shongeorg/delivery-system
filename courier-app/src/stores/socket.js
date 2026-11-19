import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { useOrderStore } from './order'

const WS_URL = 'ws://localhost:3000/ws'

export const useSocketStore = defineStore('socket', () => {
  const socket = ref(null)
  const connected = ref(false)

  function connect() {
    const authStore = useAuthStore()
    if (!authStore.accessToken) return

    socket.value = new WebSocket(WS_URL)

    socket.value.onopen = () => {
      connected.value = true
      console.log('WebSocket connected')

      // Authenticate
      socket.value.send(JSON.stringify({
        type: 'auth',
        token: authStore.accessToken
      }))

      // Subscribe to orders channel
      socket.value.send(JSON.stringify({
        type: 'subscribe',
        channel: 'orders'
      }))
    }

    socket.value.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleSocketMessage(data)
    }

    socket.value.onclose = () => {
      connected.value = false
      console.log('WebSocket disconnected')

      // Auto reconnect after 3 seconds
      setTimeout(connect, 3000)
    }

    socket.value.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  function handleSocketMessage(message) {
    const orderStore = useOrderStore()

    switch (message.type) {
      case 'order_updated':
      case 'new_order':
      case 'order_cancelled':
        orderStore.fetchOrders().catch(() => {})
        if (message.type === 'order_updated' && message.data?.id) {
          orderStore.fetchOrderById(message.data.id).catch(() => {})
        }
        break

      case 'new_message':
        break

      default:
        break
    }
  }

  function sendLocationUpdate(orderId, lat, lng) {
    if (socket.value && connected.value) {
      socket.value.send(JSON.stringify({
        type: 'courier_location_update',
        orderId,
        lat,
        lng
      }))
    }
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
    sendLocationUpdate
  }
})
