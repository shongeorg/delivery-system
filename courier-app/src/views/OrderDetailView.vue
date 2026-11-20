<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useOrderStore } from '../stores/order'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()

const order = ref(null)
const loading = ref(true)
const error = ref('')
const updating = ref(false)
let refreshTimer = null

const steps = [
  { id: 'ready', label: 'Ready' },
  { id: 'on_the_way', label: 'On the way' },
  { id: 'delivered', label: 'Delivered' }
]

const currentStep = computed(() => {
  if (!order.value) return -1
  return steps.findIndex(step => step.id === order.value.status)
})

const action = computed(() => {
  if (!order.value) return null
  if (order.value.status === 'ready') {
    return { status: 'on_the_way', label: 'Accept & pick up', tone: 'btn-filled', icon: 'truck' }
  }
  if (order.value.status === 'on_the_way') {
    return { status: 'delivered', label: 'Mark as delivered', tone: 'btn-success', icon: 'check' }
  }
  return null
})

async function loadOrder() {
  try {
    await orderStore.fetchOrderById(route.params.id)
    order.value = orderStore.currentOrder
  } catch (err) {
    error.value = 'Failed to load order'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadOrder()
  refreshTimer = setInterval(loadOrder, 15000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

async function updateStatus(newStatus) {
  updating.value = true
  error.value = ''
  try {
    await orderStore.updateStatus(order.value.id, newStatus)
    order.value = orderStore.currentOrder
  } catch (err) {
    error.value = 'Failed to update status'
    console.error(err)
  } finally {
    updating.value = false
  }
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
          <div class="min-w-0">
            <p class="section-label">Order</p>
            <h1 class="truncate text-lg font-semibold text-on-surface">
              {{ order ? '#' + order.id.slice(-8) : 'Details' }}
            </h1>
          </div>
        </div>
        <span v-if="order" class="status" :class="'status-' + order.status">{{ order.status.replaceAll('_', ' ') }}</span>
      </div>
    </header>

    <main class="mx-auto w-full max-w-2xl space-y-4 px-4 pb-32 pt-4">
      <div v-if="loading" class="card flex items-center justify-center py-16">
        <progress class="spinner" aria-label="Loading order"></progress>
      </div>

      <div v-else-if="error && !order" role="alert" class="rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
        {{ error }}
      </div>

      <template v-else-if="order">
        <div v-if="order.status === 'delivered'" class="flex items-start gap-3 rounded-3xl bg-success-container px-5 py-4 text-on-success-container">
          <svg class="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1" />
            <path d="m9 11 3 3L22 4" />
          </svg>
          <div>
            <p class="font-medium">Delivered</p>
            <p class="text-sm opacity-80">This order is complete. Great job.</p>
          </div>
        </div>

        <div v-else-if="order.status === 'cancelled'" class="flex items-start gap-3 rounded-3xl bg-error-container px-5 py-4 text-on-error-container">
          <svg class="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
          <div>
            <p class="font-medium">Cancelled</p>
            <p class="text-sm opacity-80">This order was cancelled and needs no delivery.</p>
          </div>
        </div>

        <section v-if="currentStep >= 0" class="card p-5">
          <ol class="grid grid-cols-3 gap-2">
            <li v-for="(step, index) in steps" :key="step.id" class="flex flex-col items-center gap-1.5 text-center">
              <span
                class="grid h-9 w-9 place-items-center rounded-full text-sm font-semibold"
                :class="index <= currentStep ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'"
              >
                <svg v-if="index < currentStep" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="m20 6-11 11-5-5" />
                </svg>
                <template v-else>{{ index + 1 }}</template>
              </span>
              <span class="text-[11px] font-medium leading-tight" :class="index <= currentStep ? 'text-on-surface' : 'text-on-surface-variant'">
                {{ step.label }}
              </span>
            </li>
          </ol>
        </section>

        <section v-else-if="order.status !== 'delivered' && order.status !== 'cancelled'" class="flex items-start gap-3 rounded-3xl bg-surface-container-high px-5 py-4">
          <svg class="mt-0.5 h-5 w-5 shrink-0 text-on-surface-variant" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          <div>
            <p class="font-medium text-on-surface">Waiting for the kitchen</p>
            <p class="text-sm text-on-surface-variant">The order becomes available for pickup once it is marked ready.</p>
          </div>
        </section>

        <section class="card divide-y divide-outline-variant">
          <div class="flex items-start gap-3 p-5">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-container text-on-primary-container">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <div class="min-w-0">
              <p class="text-xs text-on-surface-variant">{{ order.deliveryType === 'delivery' ? 'Deliver to' : 'Pickup point' }}</p>
              <p class="font-medium text-on-surface">{{ order.address || 'Pickup at restaurant' }}</p>
            </div>
          </div>

          <div v-if="order.phone" class="flex items-center gap-3 p-5">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-container text-on-primary-container">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
              </svg>
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-on-surface-variant">Customer phone</p>
              <p class="font-medium text-on-surface">{{ order.phone }}</p>
            </div>
            <a :href="`tel:${order.phone}`" class="btn btn-tonal min-h-11 px-4 py-2 text-sm">Call</a>
          </div>

          <div class="flex items-center gap-3 p-5">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface-container-high text-on-surface-variant">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
                <path d="M16 14h.01" />
                <path d="M2 9V6a2 2 0 0 1 2-2h13" />
              </svg>
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-on-surface-variant">Payment</p>
              <p class="font-medium capitalize text-on-surface">{{ order.paymentType }} · {{ order.paymentStatus }}</p>
            </div>
          </div>
        </section>

        <section class="card overflow-hidden">
          <div class="px-5 pb-2 pt-5">
            <h2 class="text-sm font-semibold text-on-surface">Order items</h2>
          </div>
          <ul v-if="order.items && order.items.length" class="divide-y divide-outline-variant">
            <li v-for="item in order.items" :key="item.id" class="flex items-center justify-between gap-3 px-5 py-3">
              <span class="flex min-w-0 items-center gap-3">
                <span class="grid h-7 min-w-7 place-items-center rounded-lg bg-surface-container-high px-1.5 text-xs font-semibold text-on-surface-variant">
                  ×{{ item.quantity }}
                </span>
                <span class="truncate text-sm text-on-surface">{{ item.product?.name || 'Product' }}</span>
              </span>
              <span class="shrink-0 text-sm font-medium text-on-surface">
                ${{ (parseFloat(item.price) * item.quantity).toFixed(2) }}
              </span>
            </li>
          </ul>
          <p v-else class="px-5 pb-5 text-sm text-on-surface-variant">No items data available.</p>
          <div class="flex items-center justify-between border-t border-outline-variant bg-surface-container-high px-5 py-4">
            <span class="text-sm font-medium text-on-surface-variant">Total</span>
            <span class="text-xl font-semibold text-on-surface">${{ order.totalPrice }}</span>
          </div>
        </section>

        <div v-if="error" role="alert" class="rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
          {{ error }}
        </div>
      </template>
    </main>

    <div v-if="action" class="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant bg-surface/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
      <div class="mx-auto w-full max-w-2xl">
        <button
          type="button"
          class="btn w-full"
          :class="action.tone"
          :disabled="updating"
          @click="updateStatus(action.status)"
        >
          <progress v-if="updating" class="spinner spinner-sm" aria-label="Updating status"></progress>
          <svg v-else-if="action.icon === 'truck'" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M14 17V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1" />
            <path d="M14 9h4l4 4v3a1 1 0 0 1-1 1h-1" />
            <circle cx="7.5" cy="17.5" r="2.5" />
            <circle cx="17.5" cy="17.5" r="2.5" />
            <path d="M10 17.5h5" />
          </svg>
          <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m20 6-11 11-5-5" />
          </svg>
          {{ updating ? 'Updating…' : action.label }}
        </button>
      </div>
    </div>
  </div>
</template>
