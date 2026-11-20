import axios from 'axios'
import { useAuthStore } from '../stores/auth'

export const API_URL = 'http://localhost:3000'

const api = axios.create({ baseURL: API_URL })

let refreshInFlight = null

function refreshOnce() {
  const authStore = useAuthStore()
  refreshInFlight ??= authStore.refresh().finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

function isAuthEndpoint(url) {
  return typeof url === 'string' && url.includes('/auth/')
}

api.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config
    const status = error.response?.status

    if (status !== 401 || !config || config.retried || isAuthEndpoint(config.url)) {
      throw error
    }

    config.retried = true
    const refreshed = await refreshOnce()

    if (!refreshed) {
      if (window.location.pathname !== '/') {
        window.location.replace('/')
      }
      throw error
    }

    return api.request(config)
  }
)

export default api
