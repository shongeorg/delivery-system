<script setup>
import { ref, onMounted, computed } from 'vue'
import { useOrderStore } from '../stores/order'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const orderStore = useOrderStore()
const authStore = useAuthStore()
const router = useRouter()

const loading = ref(true)

const availableOrders = computed(() => {
  return orderStore.orders.filter(o =>
    ['ready'].includes(o.status)
  )
})

const activeOrders = computed(() => {
  return orderStore.orders.filter(o =>
    ['on_the_way'].includes(o.status)
  )
})

const completedOrders = computed(() => {
  return orderStore.orders.filter(o =>
    ['delivered'].includes(o.status)
  )
})

onMounted(async () => {
  try {
    await orderStore.fetchOrders()
  } catch (err) {
    console.error('Failed to load orders:', err)
  } finally {
    loading.value = false
  }
})

function navigateToOrder(id) {
  router.push(`/orders/${id}`)
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-xl font-bold text-gray-800">Orders</h1>
        <button
          @click="router.push('/profile')"
          class="text-sm text-gray-600 hover:text-gray-800"
        >
          Profile
        </button>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <!-- Status toggle -->
      <div class="flex gap-2">
        <span
          :class="!loading ? 'bg-blue-600 text-white' : 'bg-gray-300'"
          class="px-3 py-1 rounded-full text-sm font-medium"
        >
          Online
        </span>
      </div>

      <!-- Active Orders -->
      <section v-if="activeOrders.length > 0">
        <h2 class="text-lg font-semibold text-gray-700 mb-3">
          Active Orders ({{ activeOrders.length }})
        </h2>
        <div class="space-y-3">
          <div
            v-for="order in activeOrders"
            :key="order.id"
            @click="navigateToOrder(order.id)"
            class="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="font-semibold text-gray-800">
                Order #{{ order.id.slice(-8) }}
              </span>
              <span
                :class="{
                  'bg-yellow-100 text-yellow-800': order.status === 'cooking',
                  'bg-green-100 text-green-800': order.status === 'ready',
                  'bg-blue-100 text-blue-800': order.status === 'on_the_way'
                }"
                class="px-2 py-1 rounded text-xs font-medium uppercase"
              >
                {{ order.status.replace('_', ' ') }}
              </span>
            </div>
            <p class="text-sm text-gray-600">
              {{ order.deliveryType }} • {{ order.address || 'Pickup' }}
            </p>
            <p class="text-sm font-medium text-gray-800 mt-1">
              ${{ order.totalPrice }}
            </p>
          </div>
        </div>
      </section>

      <!-- Available Orders (Ready for pickup) -->
      <section v-if="availableOrders.length > 0">
        <h2 class="text-lg font-semibold text-gray-700 mb-3">
          Available for Pickup ({{ availableOrders.length }})
        </h2>
        <div class="space-y-3">
          <div
            v-for="order in availableOrders"
            :key="order.id"
            @click="navigateToOrder(order.id)"
            class="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="font-semibold text-gray-800">
                Order #{{ order.id.slice(-8) }}
              </span>
              <span
                :class="{
                  'bg-green-100 text-green-800': order.status === 'ready'
                }"
                class="px-2 py-1 rounded text-xs font-medium uppercase"
              >
                Ready for pickup
              </span>
            </div>
            <p class="text-sm text-gray-600">
              {{ order.deliveryType }} • {{ order.address || 'Pickup' }}
            </p>
            <p class="text-sm font-medium text-gray-800 mt-1">
              ${{ order.totalPrice }}
            </p>
          </div>
        </div>
      </section>

      <!-- Completed Orders -->
      <section v-if="completedOrders.length > 0">
        <h2 class="text-lg font-semibold text-gray-700 mb-3">
          Completed ({{ completedOrders.length }})
        </h2>
        <div class="space-y-3">
          <div
            v-for="order in completedOrders"
            :key="order.id"
            @click="navigateToOrder(order.id)"
            class="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition opacity-75"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="font-semibold text-gray-800">
                Order #{{ order.id.slice(-8) }}
              </span>
              <span class="px-2 py-1 rounded text-xs font-medium uppercase bg-gray-100 text-gray-800">
                Delivered
              </span>
            </div>
            <p class="text-sm text-gray-600">
              {{ order.deliveryType }} • {{ order.address || 'Pickup' }}
            </p>
            <p class="text-sm font-medium text-gray-800 mt-1">
              ${{ order.totalPrice }}
            </p>
          </div>
        </div>
      </section>

      <!-- Empty state -->
      <div v-if="!loading && orderStore.orders.length === 0" class="text-center py-12">
        <p class="text-gray-500">No orders available</p>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500">Loading orders...</p>
      </div>
    </main>

    <!-- Bottom nav -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div class="max-w-4xl mx-auto px-4 py-2 flex justify-around">
        <button
          @click="router.push('/orders')"
          class="flex flex-col items-center text-blue-600"
        >
          <span class="text-xl">📦</span>
          <span class="text-xs">Orders</span>
        </button>
        <button
          @click="router.push('/map')"
          class="flex flex-col items-center text-gray-600"
        >
          <span class="text-xl">🗺️</span>
          <span class="text-xs">Map</span>
        </button>
        <button
          @click="router.push('/profile')"
          class="flex flex-col items-center text-gray-600"
        >
          <span class="text-xl">👤</span>
          <span class="text-xs">Profile</span>
        </button>
      </div>
    </nav>
  </div>
</template>
