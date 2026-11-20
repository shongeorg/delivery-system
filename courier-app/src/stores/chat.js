import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api/client'

export const useChatStore = defineStore('chat', () => {
  const messages = ref([])
  const orderId = ref(null)
  const loading = ref(false)
  const sending = ref(false)
  const error = ref('')

  async function load(id) {
    orderId.value = id
    loading.value = true
    error.value = ''
    try {
      const res = await api.get(`/chats/order/${id}/messages`)
      messages.value = res.data
    } catch {
      error.value = 'Could not load messages'
    } finally {
      loading.value = false
    }
  }

  async function send(id, text) {
    sending.value = true
    error.value = ''
    try {
      const res = await api.post(`/chats/order/${id}/messages`, { text })
      receive(res.data)
      return true
    } catch {
      error.value = 'Message was not sent'
      return false
    } finally {
      sending.value = false
    }
  }

  function receive(message) {
    if (!message || !message.id) return
    if (messages.value.some((item) => item.id === message.id)) return
    messages.value = [...messages.value, message]
  }

  function reset() {
    messages.value = []
    orderId.value = null
    error.value = ''
  }

  return { messages, orderId, loading, sending, error, load, send, receive, reset }
})
