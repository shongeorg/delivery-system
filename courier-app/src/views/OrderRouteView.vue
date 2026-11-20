<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/client'
import { useLocationStore } from '../stores/location'
import { useSocketStore } from '../stores/socket'
import 'leaflet/dist/leaflet.css'

const route = useRoute()
const router = useRouter()
const locationStore = useLocationStore()
const socketStore = useSocketStore()

const order = ref(null)
const loading = ref(true)
const error = ref('')
const routeInfo = ref(null)
const routeStatus = ref('')

const mapContainer = ref(null)
let map = null
let courierMarker = null
let clientMarker = null
let routeLine = null
let lastSend = 0

const orderId = computed(() => route.params.id)

const clientPoint = computed(() => {
  const lat = Number(order.value?.lat)
  const lng = Number(order.value?.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !order.value?.lat) return null
  return { lat, lng }
})

const courierPoint = computed(() => {
  if (!locationStore.latitude || !locationStore.longitude) return null
  return { lat: locationStore.latitude, lng: locationStore.longitude }
})

const distanceText = computed(() => {
  if (!routeInfo.value) return ''
  const km = routeInfo.value.distance / 1000
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
})

const etaText = computed(() => {
  if (!routeInfo.value) return ''
  return `${Math.max(1, Math.round(routeInfo.value.duration / 60))} min`
})

function markerIcon(html, size) {
  return window.L.divIcon({
    className: '',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  })
}

async function buildRoute() {
  if (!map || !clientPoint.value || !courierPoint.value) return

  const from = courierPoint.value
  const to = clientPoint.value

  try {
    routeStatus.value = 'Building route…'
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
    const res = await fetch(url)
    const data = await res.json()
    const routeData = data.routes?.[0]

    if (!routeData) throw new Error('No route')

    const points = routeData.geometry.coordinates.map(([lng, lat]) => [lat, lng])
    routeInfo.value = { distance: routeData.distance, duration: routeData.duration }
    routeStatus.value = ''

    if (!routeLine) {
      routeLine = window.L.polyline(points, { color: '#0b57d0', weight: 5, opacity: 0.8 }).addTo(map)
    } else {
      routeLine.setLatLngs(points)
    }
  } catch {
    routeStatus.value = 'Road route unavailable, showing a straight line'
    routeInfo.value = null
    const points = [[from.lat, from.lng], [to.lat, to.lng]]
    if (!routeLine) {
      routeLine = window.L.polyline(points, { color: '#0b57d0', weight: 4, dashArray: '6 8' }).addTo(map)
    } else {
      routeLine.setLatLngs(points)
    }
  }
}

function syncCourierMarker() {
  if (!map || !courierPoint.value) return
  const coords = [courierPoint.value.lat, courierPoint.value.lng]

  if (!courierMarker) {
    courierMarker = window.L.marker(coords, {
      icon: markerIcon('<span class="map-marker"></span>', 20)
    }).addTo(map).bindPopup('You')
  } else {
    courierMarker.setLatLng(coords)
  }
}

function syncClientMarker() {
  if (!map || !clientPoint.value) return
  const coords = [clientPoint.value.lat, clientPoint.value.lng]

  if (!clientMarker) {
    clientMarker = window.L.marker(coords, {
      icon: markerIcon('<span style="display:block;width:18px;height:18px;border-radius:999px;background:#b3261e;border:3px solid #fff;box-shadow:0 0 0 6px rgba(179,38,30,.2)"></span>', 18)
    }).addTo(map).bindPopup('Customer')
  } else {
    clientMarker.setLatLng(coords)
  }
}

function fitBounds() {
  if (!map) return
  const points = []
  if (courierPoint.value) points.push([courierPoint.value.lat, courierPoint.value.lng])
  if (clientPoint.value) points.push([clientPoint.value.lat, clientPoint.value.lng])
  if (points.length === 0) return
  map.fitBounds(points, { padding: [50, 50], maxZoom: 16 })
}

async function shareLocation() {
  if (!courierPoint.value || !order.value) return
  const now = Date.now()
  if (now - lastSend < 8000) return
  lastSend = now

  socketStore.sendLocationUpdate(order.value.id, courierPoint.value.lat, courierPoint.value.lng)

  try {
    await api.put(`/orders/${order.value.id}/location`, {
      lat: courierPoint.value.lat,
      lng: courierPoint.value.lng
    })
  } catch {
    routeStatus.value = routeStatus.value || 'Location saved locally, server is unreachable'
  }
}

onMounted(async () => {
  try {
    const res = await api.get(`/orders/${orderId.value}`)
    order.value = res.data
  } catch {
    error.value = 'Failed to load order'
  } finally {
    loading.value = false
  }

  locationStore.startTracking()
  socketStore.subscribe(`order:${orderId.value}`)

  const L = await import('leaflet')
  window.L = L

  if (mapContainer.value) {
    map = L.map(mapContainer.value, { zoomControl: false }).setView(
      [courierPoint.value?.lat ?? clientPoint.value?.lat ?? 48.4647, courierPoint.value?.lng ?? clientPoint.value?.lng ?? 35.0462],
      14
    )

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    syncCourierMarker()
    syncClientMarker()
    fitBounds()
    buildRoute()
  }
})

watch(courierPoint, async () => {
  syncCourierMarker()
  await buildRoute()
  await shareLocation()
})

watch(clientPoint, () => {
  syncClientMarker()
  fitBounds()
  buildRoute()
})

onUnmounted(() => {
  locationStore.stopTracking()
  socketStore.unsubscribe(`order:${orderId.value}`)
  map?.remove()
  map = null
})
</script>

<template>
  <div class="relative h-dvh overflow-hidden">
    <div ref="mapContainer" class="map-container absolute inset-0"></div>

    <header class="absolute inset-x-0 top-0 z-[900] px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div class="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-3xl border border-outline-variant bg-surface-container/90 px-2 py-2 shadow-m3 backdrop-blur">
        <button type="button" class="icon-btn" aria-label="Back to order" @click="router.push(`/orders/${orderId}`)">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-on-surface">Route to customer</p>
          <p class="truncate text-xs text-on-surface-variant">
            {{ order ? order.address || 'Pickup at restaurant' : 'Loading order…' }}
          </p>
        </div>
        <span v-if="distanceText" class="chip-online">{{ distanceText }} · {{ etaText }}</span>
      </div>
    </header>

    <div class="absolute inset-x-0 bottom-0 z-[900] px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div class="mx-auto w-full max-w-2xl rounded-3xl border border-outline-variant bg-surface-container/95 p-4 shadow-m3 backdrop-blur">
        <p v-if="loading" class="text-sm text-on-surface-variant">Loading route…</p>
        <p v-else-if="error" class="text-sm text-error">{{ error }}</p>
        <template v-else>
          <p v-if="!clientPoint" class="text-sm text-on-surface">
            The customer did not share a map point. Use the text address and phone number.
          </p>
          <template v-else>
            <div class="flex items-start gap-3">
              <span class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-container text-on-primary-container">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <div class="min-w-0 flex-1">
                <p class="font-medium text-on-surface">{{ order?.address || 'Customer address' }}</p>
                <p class="mt-0.5 text-sm text-on-surface-variant">
                  {{ routeInfo ? `${distanceText} · about ${etaText}` : routeStatus || 'Route is being prepared' }}
                </p>
              </div>
              <a v-if="order?.phone" :href="`tel:${order.phone}`" class="btn btn-tonal min-h-10 shrink-0 px-4 py-1.5 text-sm">Call</a>
            </div>
          </template>

          <div class="mt-3 flex gap-2">
            <button type="button" class="btn btn-tonal min-h-11 flex-1 px-4 py-2 text-sm" @click="fitBounds">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
              Fit both
            </button>
            <button type="button" class="btn btn-filled min-h-11 flex-1 px-4 py-2 text-sm" :disabled="!courierPoint" @click="shareLocation">
              Share my location
            </button>
          </div>
        </template>
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
