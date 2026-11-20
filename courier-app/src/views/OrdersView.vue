<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useOrderStore } from '../stores/order'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const orderStore = useOrderStore()
const authStore = useAuthStore()
const router = useRouter()

const loading = ref(true)
const refreshing = ref(false)
const error = ref('')
const tab = ref('available')
let refreshTimer = null

const deliveryOrders = computed(() =>
  orderStore.orders.filter(o => o.deliveryType === 'delivery')
)

const availableOrders = computed(() =>
  deliveryOrders.value.filter(o => o.status === 'ready')
)

const activeOrders = computed(() =>
  deliveryOrders.value.filter(o => o.status === 'on_the_way')
)

const completedOrders = computed(() =>
  deliveryOrders.value.filter(o => o.status === 'delivered')
)

const tabs = computed(() => [
  { id: 'available', label: 'Available', count: availableOrders.value.length },
  { id: 'active', label: 'Active', count: activeOrders.value.length },
  { id: 'completed', label: 'Completed', count: completedOrders.value.length }
])

const visibleOrders = computed(() => {
  if (tab.value === 'active') return activeOrders.value
  if (tab.value === 'completed') return completedOrders.value
  return availableOrders.value
})

const initial = computed(() => (authStore.user?.name?.charAt(0) || 'C').toUpperCase())

async function loadOrders() {
  refreshing.value = true
  error.value = ''
  try {
    await orderStore.fetchOrders()
  } catch (err) {
    error.value = 'Failed to load orders'
    console.error('Failed to load orders:', err)
  } finally {
    refreshing.value = false
    loading.value = false
  }
}

onMounted(async () => {
  await loadOrders()
  if (availableOrders.value.length === 0 && activeOrders.value.length > 0) {
    tab.value = 'active'
  } else if (availableOrders.value.length === 0 && activeOrders.value.length === 0 && completedOrders.value.length > 0) {
    tab.value = 'completed'
  }
  refreshTimer = setInterval(loadOrders, 15000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

function itemSummary(order) {
  if (!order.items || order.items.length === 0) return ''
  return order.items
    .map(item => `${item.quantity}× ${item.product?.name || 'Item'}`)
    .join(', ')
}

function timeAgo(value) {
  if (!value) return ''
  const minutes = Math.floor(Math.max(0, Date.now() - new Date(value).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.floor(hours / 24)} d ago`
}

function navigateToOrder(id) {
  router.push(`/orders/${id}`)
}
</script>

<template>
  <div class="min-h-dvh">
    <header class="app-bar">
      <div class="app-bar-inner">
        <div class="min-w-0">
          <p class="section-label">Courier</p>
          <h1 class="truncate text-xl font-semibold text-on-surface">Deliveries</h1>
        </div>
        <div class="flex items-center gap-1">
          <span class="chip-online">{{ refreshing ? 'Syncing' : 'Online' }}</span>
          <button type="button" class="icon-btn" aria-label="Refresh orders" :disabled="refreshing" @click="loadOrders">
            <svg class="h-5 w-5" :class="{ 'animate-spin': refreshing }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 3v6h-6" />
            </svg>
          </button>
          <button type="button" class="icon-btn" aria-label="Open profile" @click="router.push('/profile')">
            <span class="grid h-9 w-9 place-items-center rounded-full bg-primary-container text-sm font-semibold text-on-primary-container">
              {{ initial }}
            </span>
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-5xl space-y-5 px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-4">
      <div class="grid grid-cols-3 gap-3">
        <div class="stat-tile">
          <span class="text-2xl font-semibold text-on-surface">{{ availableOrders.length }}</span>
          <span class="text-xs text-on-surface-variant">Available</span>
        </div>
        <div class="stat-tile">
          <span class="text-2xl font-semibold text-primary">{{ activeOrders.length }}</span>
          <span class="text-xs text-on-surface-variant">Active</span>
        </div>
        <div class="stat-tile">
          <span class="text-2xl font-semibold text-on-surface">{{ completedOrders.length }}</span>
          <span class="text-xs text-on-surface-variant">Completed</span>
        </div>
      </div>

      <div role="group" aria-label="Filter orders" class="flex flex-wrap gap-2">
        <button
          v-for="item in tabs"
          :key="item.id"
          type="button"
          class="btn min-h-11 px-4 py-2 text-sm"
          :class="tab === item.id ? 'btn-filled' : 'btn-tonal'"
          :aria-pressed="tab === item.id"
          @click="tab = item.id"
        >
          {{ item.label }}
          <span class="rounded-full px-2 py-0.5 text-xs" :class="tab === item.id ? 'bg-white/20' : 'bg-primary/10'">
            {{ item.count }}
          </span>
        </button>
      </div>

      <div v-if="error" role="alert" class="flex items-start gap-2 rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
        <svg class="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
        <span class="flex-1">{{ error }}</span>
        <button type="button" class="font-semibold underline underline-offset-2" @click="loadOrders">Retry</button>
      </div>

      <div v-if="loading" class="space-y-3">
        <div v-for="n in 3" :key="n" class="card space-y-3 p-5">
          <div class="flex items-center gap-3">
            <div class="skeleton h-11 w-11 rounded-2xl"></div>
            <div class="flex-1 space-y-2">
              <div class="skeleton h-3 w-24"></div>
              <div class="skeleton h-4 w-2/3"></div>
            </div>
          </div>
          <div class="skeleton h-3 w-1/2"></div>
          <div class="skeleton h-4 w-full"></div>
        </div>
      </div>

      <template v-else>
        <div v-if="visibleOrders.length > 0" class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="order in visibleOrders" :key="order.id" class="card overflow-hidden">
            <button type="button" class="w-full p-5 text-left transition active:bg-surface-container-high" @click="navigateToOrder(order.id)">
              <div class="flex items-start justify-between gap-3">
                <div class="flex min-w-0 items-center gap-3">
                  <span
                    class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                    :class="tab === 'completed' ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary-container text-on-primary-container'"
                  >
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M21 8V6a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 6v12a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 18V8Z" />
                      <path d="m3.3 7 8.7 5 8.7-5" />
                      <path d="M12 22V12" />
                    </svg>
                  </span>
                  <div class="min-w-0">
                    <p class="font-mono text-xs text-on-surface-variant">#{{ order.id.slice(-8) }}</p>
                    <p class="line-clamp-2 font-medium text-on-surface">{{ order.address || 'Pickup at restaurant' }}</p>
                  </div>
                </div>
                <span class="status shrink-0" :class="'status-' + order.status">{{ order.status.replaceAll('_', ' ') }}</span>
              </div>

              <p v-if="itemSummary(order)" class="mt-3 line-clamp-1 text-sm text-on-surface-variant">
                {{ itemSummary(order) }}
              </p>

              <div class="mt-4 flex items-center justify-between gap-3 text-sm">
                <span class="inline-flex items-center gap-1.5 text-on-surface-variant">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  {{ timeAgo(order.createdAt) }}
                </span>
                <span class="flex items-center gap-2">
                  <span class="font-semibold text-on-surface">${{ order.totalPrice }}</span>
                  <svg class="h-4 w-4 text-on-surface-variant" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </span>
              </div>
            </button>
          </article>
        </div>

        <div v-else class="card flex flex-col items-center px-6 py-14 text-center">
          <span class="grid h-16 w-16 place-items-center rounded-full bg-surface-container-high text-on-surface-variant">
            <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 8V6a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 6v12a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 18V8Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          </span>
          <h2 class="mt-4 text-lg font-medium text-on-surface">No {{ tab }} orders</h2>
          <p class="mt-1 max-w-xs text-sm text-on-surface-variant">
            New deliveries appear here automatically. You can also refresh manually.
          </p>
          <button type="button" class="btn btn-tonal mt-6" @click="loadOrders">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 3v6h-6" />
            </svg>
            Refresh
          </button>
        </div>
      </template>
    </main>

    <nav class="bottom-nav" aria-label="Primary">
      <router-link to="/orders" class="nav-item" aria-current="page">
        <span class="nav-indicator">
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 8V6a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 6v12a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 18V8Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
        </span>
        <span>Orders</span>
      </router-link>

      <router-link to="/map" class="nav-item">
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
