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

  function handleSocketMessage(data) {
    const orderStore = useOrderStore()

    switch (data.event) {
      case 'order_updated':
        // Refresh orders when status changes
        orderStore.fetchOrderById(data.orderId)
        orderStore.fetchOrders()
        console.log('Order updated:', data)
        break

      case 'new_order':
        // New order notification
        console.log('New order available:', data)
        orderStore.fetchOrders()
        break

      case 'order_cancelled':
        // Remove cancelled order
        orderStore.fetchOrders()
        console.log('Order cancelled:', data)
        break

      case 'new_message':
        // New chat message
        console.log('New message:', data)
        break

      default:
        console.log('Unknown event:', data)
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
