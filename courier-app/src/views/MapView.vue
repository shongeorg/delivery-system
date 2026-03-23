<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useLocationStore } from '../stores/location'
import { useOrderStore } from '../stores/order'
import { useSocketStore } from '../stores/socket'
import 'leaflet/dist/leaflet.css'

const locationStore = useLocationStore()
const orderStore = useOrderStore()
const socketStore = useSocketStore()

const map = ref(null)
const mapContainer = ref(null)
const leafletInstance = ref(null)
const courierMarker = ref(null)
const destinationMarker = ref(null)

onMounted(async () => {
  // Initialize map
  const L = await import('leaflet')

  if (mapContainer.value) {
    leafletInstance.value = L.map(mapContainer.value).setView([48.4069, 34.986], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletInstance.value)

    // Add courier location marker
    courierMarker.value = L.marker([48.4069, 34.986]).addTo(leafletInstance.value)
      .bindPopup('Your location')

    // Watch for location updates
    watch(() => locationStore.latitude, (lat) => {
      if (lat && locationStore.longitude && leafletInstance.value) {
        const newPos = [lat, locationStore.longitude]
        courierMarker.value.setLatLng(newPos)
        leafletInstance.value.setView(newPos, 15)
        
        // Send location via WebSocket if there's an active order
        const activeOrder = orderStore.orders.find(o => o.status === 'on_the_way')
        if (activeOrder) {
          socketStore.sendLocationUpdate(activeOrder.id, lat, locationStore.longitude)
        }
      }
    })
  }

  // Start location tracking
  locationStore.startTracking()
})

onUnmounted(() => {
  locationStore.stopTracking()
})
</script>

<template>
  <div class="h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow-sm z-10">
      <div class="px-4 py-4 flex items-center gap-4">
        <router-link to="/orders" class="text-gray-600 hover:text-gray-800">
          ← Back
        </router-link>
        <h1 class="text-xl font-bold text-gray-800">Map</h1>
      </div>
    </header>

    <!-- Map -->
    <div ref="mapContainer" class="flex-1 map-container"></div>

    <!-- Bottom nav -->
    <nav class="bg-white border-t border-gray-200">
      <div class="px-4 py-2 flex justify-around">
        <router-link to="/orders" class="flex flex-col items-center text-gray-600">
          <span class="text-xl">📦</span>
          <span class="text-xs">Orders</span>
        </router-link>
        <router-link to="/map" class="flex flex-col items-center text-blue-600">
          <span class="text-xl">🗺️</span>
          <span class="text-xs">Map</span>
        </router-link>
        <router-link to="/profile" class="flex flex-col items-center text-gray-600">
          <span class="text-xl">👤</span>
          <span class="text-xs">Profile</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>
