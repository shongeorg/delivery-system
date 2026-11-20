<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useOrderStore } from '../stores/order'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const orderStore = useOrderStore()
const router = useRouter()

const user = computed(() => authStore.user)
const initial = computed(() => (user.value?.name?.charAt(0) || 'C').toUpperCase())

const deliveries = computed(() =>
  orderStore.orders.filter(order => order.deliveryType === 'delivery' && order.status === 'delivered').length
)

const activeDeliveries = computed(() =>
  orderStore.orders.filter(order => order.deliveryType === 'delivery' && order.status === 'on_the_way').length
)

onMounted(() => {
  orderStore.fetchOrders().catch(() => {})
})

function handleLogout() {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="min-h-dvh">
    <header class="app-bar">
      <div class="app-bar-inner">
        <div class="flex min-w-0 items-center gap-1">
          <button type="button" class="icon-btn" aria-label="Go back" @click="router.back()">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </button>
          <h1 class="truncate text-xl font-semibold text-on-surface">Profile</h1>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-2xl space-y-4 px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-4">
      <section class="card flex items-center gap-4 p-5">
        <div class="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary text-2xl font-semibold text-on-primary">
          {{ initial }}
        </div>
        <div class="min-w-0">
          <h2 class="truncate text-lg font-semibold text-on-surface">{{ user?.name || 'Courier' }}</h2>
          <p class="truncate text-sm text-on-surface-variant">{{ user?.email }}</p>
          <span class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-container px-2.5 py-1 text-xs font-medium capitalize text-on-primary-container">
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M14 17V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1" />
              <path d="M14 9h4l4 4v3a1 1 0 0 1-1 1h-1" />
              <circle cx="7.5" cy="17.5" r="2.5" />
              <circle cx="17.5" cy="17.5" r="2.5" />
              <path d="M10 17.5h5" />
            </svg>
            {{ user?.role || 'courier' }}
          </span>
        </div>
      </section>

      <section class="grid grid-cols-2 gap-3">
        <div class="stat-tile">
          <span class="text-2xl font-semibold text-on-surface">{{ deliveries }}</span>
          <span class="text-xs text-on-surface-variant">Delivered</span>
        </div>
        <div class="stat-tile">
          <span class="text-2xl font-semibold text-primary">{{ activeDeliveries }}</span>
          <span class="text-xs text-on-surface-variant">On the way</span>
        </div>
      </section>

      <section class="card divide-y divide-outline-variant">
        <div class="flex items-center gap-3 p-4">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface-container-high text-on-surface-variant">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
              <path d="m22 7-10 6L2 7" />
            </svg>
          </span>
          <div class="min-w-0">
            <p class="text-xs text-on-surface-variant">Email</p>
            <p class="truncate font-medium text-on-surface">{{ user?.email || '—' }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3 p-4">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface-container-high text-on-surface-variant">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="4" y="4" width="16" height="16" rx="3" />
              <path d="M9 9h6v6H9z" />
            </svg>
          </span>
          <div class="min-w-0">
            <p class="text-xs text-on-surface-variant">Courier ID</p>
            <p class="truncate font-mono text-sm font-medium text-on-surface">{{ user?.id?.slice(-8) || '—' }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3 p-4">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface-container-high text-on-surface-variant">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 21a8 8 0 0 0-16 0" />
              <circle cx="12" cy="8" r="5" />
            </svg>
          </span>
          <div class="min-w-0">
            <p class="text-xs text-on-surface-variant">Account type</p>
            <p class="font-medium capitalize text-on-surface">{{ user?.role || 'courier' }}</p>
          </div>
        </div>
      </section>

      <button type="button" class="btn btn-outline w-full border-error/40 text-error hover:bg-error-container" @click="handleLogout">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
        Sign out
      </button>

      <p class="text-center text-xs text-on-surface-variant">Delivery Courier · v1.0</p>
    </main>

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

      <router-link to="/profile" class="nav-item" aria-current="page">
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
