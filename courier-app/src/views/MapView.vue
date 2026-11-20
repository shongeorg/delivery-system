<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLocationStore } from '../stores/location'
import { useOrderStore } from '../stores/order'
import { useSocketStore } from '../stores/socket'
import 'leaflet/dist/leaflet.css'

const router = useRouter()
const locationStore = useLocationStore()
const orderStore = useOrderStore()
const socketStore = useSocketStore()

const mapContainer = ref(null)
const leafletInstance = ref(null)
const courierMarker = ref(null)

const activeOrder = computed(() =>
  orderStore.orders.find(order => order.deliveryType === 'delivery' && order.status === 'on_the_way')
)

onMounted(async () => {
  const L = await import('leaflet')

  if (mapContainer.value) {
    leafletInstance.value = L.map(mapContainer.value, { zoomControl: false }).setView([48.4069, 34.986], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletInstance.value)

    courierMarker.value = L.marker([48.4069, 34.986], {
      icon: L.divIcon({
        className: '',
        html: '<span class="map-marker"></span>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    }).addTo(leafletInstance.value).bindPopup('Your location')

    watch(() => locationStore.latitude, (lat) => {
      if (lat && locationStore.longitude && leafletInstance.value) {
        const newPos = [lat, locationStore.longitude]
        courierMarker.value.setLatLng(newPos)
        leafletInstance.value.setView(newPos, 15)

        if (activeOrder.value) {
          socketStore.sendLocationUpdate(activeOrder.value.id, lat, locationStore.longitude)
        }
      }
    })
  }

  locationStore.startTracking()
})

onUnmounted(() => {
  locationStore.stopTracking()
})
</script>

<template>
  <div class="relative h-dvh overflow-hidden">
    <div ref="mapContainer" class="map-container absolute inset-0"></div>

    <header class="absolute inset-x-0 top-0 z-[900] px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div class="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-3xl border border-outline-variant bg-surface-container/90 px-2 py-2 shadow-m3 backdrop-blur">
        <button type="button" class="icon-btn" aria-label="Back to orders" @click="router.push('/orders')">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-on-surface">Live map</p>
          <p class="truncate text-xs text-on-surface-variant">
            {{ locationStore.watching ? 'Sharing your location' : 'Location tracking is off' }}
          </p>
        </div>
        <span class="chip-online">{{ socketStore.connected ? 'Live' : 'Offline' }}</span>
      </div>
    </header>

    <div class="absolute inset-x-0 bottom-0 z-[900] px-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <div class="mx-auto w-full max-w-2xl rounded-3xl border border-outline-variant bg-surface-container/95 p-4 shadow-m3 backdrop-blur">
        <div class="flex items-start gap-3">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-container text-on-primary-container">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m3 11 19-9-9 19-2-8-8-2Z" />
            </svg>
          </span>
          <div class="min-w-0 flex-1">
            <p class="font-medium text-on-surface">
              {{ activeOrder ? 'Active delivery' : 'No active delivery' }}
            </p>
            <p class="mt-0.5 truncate text-sm text-on-surface-variant">
              {{ activeOrder ? activeOrder.address || 'Pickup at restaurant' : 'Accept an order to start sharing your route.' }}
            </p>
          </div>
          <router-link v-if="activeOrder" :to="`/orders/${activeOrder.id}`" class="btn btn-tonal min-h-10 shrink-0 px-4 py-1.5 text-sm">
            Open
          </router-link>
        </div>
      </div>
    </div>

    <nav class="bottom-nav" aria-label="Primary">
      <router-link to="/orders" class="nav-item">
        <span class="nav-indicator">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 8V6a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 6v12a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 18V8Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
        </span>
        <span>Orders</span>
      </router-link>

      <router-link to="/map" class="nav-item" aria-current="page">
        <span class="nav-indicator">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
            <path d="M9 3v15" />
            <path d="M15 6v15" />
          </svg>
        </span>
        <span>Map</span>
      </router-link>

      <router-link to="/profile" class="nav-item">
        <span class="nav-indicator">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="8" r="5" />
          </svg>
        </span>
        <span>Profile</span>
      </router-link>
    </nav>
  </div>
</template>
