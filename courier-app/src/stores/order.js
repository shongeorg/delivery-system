import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from './auth'

const API_URL = 'http://localhost:3000'

export const useOrderStore = defineStore('orders', () => {
  const orders = ref([])
  const currentOrder = ref(null)
  const loading = ref(false)

  async function fetchOrders() {
    loading.value = true
    try {
      const authStore = useAuthStore()
      const res = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${authStore.accessToken}` }
      })
      orders.value = res.data
      return res.data
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchOrderById(id) {
    loading.value = true
    try {
      const authStore = useAuthStore()
      const res = await axios.get(`${API_URL}/orders/${id}`, {
        headers: { Authorization: `Bearer ${authStore.accessToken}` }
      })
      currentOrder.value = res.data
      return res.data
    } catch (error) {
      console.error('Failed to fetch order:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateStatus(id, status) {
    try {
      const authStore = useAuthStore()
      const res = await axios.patch(
        `${API_URL}/orders/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${authStore.accessToken}` } }
      )
      const index = orders.value.findIndex(o => o.id === id)
      if (index !== -1) {
        orders.value[index].status = status
      }
      if (currentOrder.value?.id === id) {
        currentOrder.value.status = status
      }
      return res.data
    } catch (error) {
      console.error('Failed to update status:', error)
      throw error
    }
  }

  async function acceptOrder(id) {
    return updateStatus(id, 'on_the_way')
  }

  async function completeOrder(id) {
    return updateStatus(id, 'delivered')
  }

  return {
    orders,
    currentOrder,
    loading,
    fetchOrders,
    fetchOrderById,
    updateStatus,
    acceptOrder,
    completeOrder
  }
})
