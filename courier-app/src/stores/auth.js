import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_URL = 'http://localhost:3000'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const accessToken = ref(null)
  const refreshToken = ref(null)

  const isAuthenticated = computed(() => !!accessToken.value)
  const isCourier = computed(() => user.value?.role === 'courier')

  async function login(email, password) {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password })
      user.value = res.data.user
      accessToken.value = res.data.accessToken
      refreshToken.value = res.data.refreshToken

      // Store tokens for persistence
      localStorage.setItem('accessToken', accessToken.value)
      localStorage.setItem('refreshToken', refreshToken.value)
      localStorage.setItem('user', JSON.stringify(user.value))

      return res.data
    } catch (error) {
      throw error.response?.data?.error || 'Login failed'
    }
  }

  async function refresh() {
    if (!refreshToken.value) return false

    try {
      const res = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken: refreshToken.value
      })
      accessToken.value = res.data.accessToken
      localStorage.setItem('accessToken', accessToken.value)
      return true
    } catch {
      logout()
      return false
    }
  }

  function logout() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  // Load from localStorage on init
  function init() {
    const storedToken = localStorage.getItem('accessToken')
    const storedRefresh = localStorage.getItem('refreshToken')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedRefresh && storedUser) {
      accessToken.value = storedToken
      refreshToken.value = storedRefresh
      user.value = JSON.parse(storedUser)
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isCourier,
    login,
    logout,
    refresh,
    init
  }
})
