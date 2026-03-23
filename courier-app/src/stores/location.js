import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useLocationStore = defineStore('location', () => {
  const latitude = ref(null)
  const longitude = ref(null)
  const watching = ref(false)
  const watchId = ref(null)

  function startTracking() {
    if (watching.value) return

    if ('geolocation' in navigator) {
      watching.value = true
      watchId.value = navigator.geolocation.watchPosition(
        (position) => {
          latitude.value = position.coords.latitude
          longitude.value = position.coords.longitude
          console.log('Location updated:', latitude.value, longitude.value)
        },
        (error) => {
          console.error('Geolocation error:', error)
          watching.value = false
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    }
  }

  function stopTracking() {
    if (watchId.value !== null) {
      navigator.geolocation.clearWatch(watchId.value)
      watchId.value = null
    }
    watching.value = false
  }

  function getPosition() {
    return {
      lat: latitude.value,
      lng: longitude.value
    }
  }

  return {
    latitude,
    longitude,
    watching,
    startTracking,
    stopTracking,
    getPosition
  }
})
