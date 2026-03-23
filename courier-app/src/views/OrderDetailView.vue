<script setup>
import { ref, onMounted } from 'vue'
import { useOrderStore } from '../stores/order'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()

const order = ref(null)
const loading = ref(true)
const error = ref('')
const updating = ref(false)

onMounted(async () => {
  try {
    await orderStore.fetchOrderById(route.params.id)
    order.value = orderStore.currentOrder
  } catch (err) {
    error.value = 'Failed to load order'
    console.error(err)
  } finally {
    loading.value = false
  }
})

async function updateStatus(newStatus) {
  updating.value = true
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

function getStatusButtons() {
  if (!order.value) return []

  const status = order.value.status

  // Courier can accept orders that are ready or cooking
  if (status === 'created' || status === 'paid' || status === 'cooking' || status === 'ready') {
    return [{ label: 'Accept Order', status: 'on_the_way', class: 'bg-blue-600' }]
  }
  if (status === 'on_the_way') {
    return [{ label: 'Mark Delivered', status: 'delivered', class: 'bg-green-600' }]
  }
  if (status === 'delivered') {
    return []
  }

  return []
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 pb-20">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
        <button
          @click="router.back()"
          class="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
        <h1 class="text-xl font-bold text-gray-800">Order Details</h1>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500">Loading order...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-red-100 text-red-800 p-4 rounded-lg">
        {{ error }}
      </div>

      <!-- Order Details -->
      <div v-else-if="order" class="space-y-4">
        <!-- Status Badge -->
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-gray-600">Status</span>
            <span
              :class="{
                'bg-purple-100 text-purple-800': order.status === 'created',
                'bg-indigo-100 text-indigo-800': order.status === 'paid',
                'bg-yellow-100 text-yellow-800': order.status === 'cooking',
                'bg-green-100 text-green-800': order.status === 'ready',
                'bg-blue-100 text-blue-800': order.status === 'on_the_way',
                'bg-gray-100 text-gray-800': order.status === 'delivered',
                'bg-red-100 text-red-800': order.status === 'cancelled'
              }"
              class="px-3 py-1 rounded-full text-sm font-medium uppercase"
            >
              {{ order.status.replace('_', ' ') }}
            </span>
          </div>
        </div>

        <!-- Delivery Info -->
        <div class="bg-white rounded-lg shadow p-4">
          <h2 class="font-semibold text-gray-800 mb-3">Delivery Information</h2>
          <div class="space-y-2 text-sm">
            <p class="text-gray-600">
              <span class="font-medium">Type:</span> {{ order.deliveryType }}
            </p>
            <p v-if="order.address" class="text-gray-600">
              <span class="font-medium">Address:</span> {{ order.address }}
            </p>
            <p v-if="order.phone" class="text-gray-600">
              <span class="font-medium">Phone:</span> {{ order.phone }}
            </p>
            <p class="text-gray-600">
              <span class="font-medium">Payment:</span> {{ order.paymentType }} ({{ order.paymentStatus }})
            </p>
          </div>
        </div>

        <!-- Order Items -->
        <div class="bg-white rounded-lg shadow p-4">
          <h2 class="font-semibold text-gray-800 mb-3">Order Items</h2>
          <div v-if="order.items && order.items.length" class="space-y-2">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="flex justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div class="text-gray-700">
                <span class="font-medium">x{{ item.quantity }}</span>
                <span class="ml-2">{{ item.product?.name || 'Product' }}</span>
              </div>
              <span class="font-medium">${{ parseFloat(item.price) * item.quantity }}</span>
            </div>
          </div>
          <div v-else class="text-gray-500 text-sm">
            No items data available
          </div>
        </div>

        <!-- Total -->
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex justify-between items-center">
            <span class="font-semibold text-gray-800">Total</span>
            <span class="text-xl font-bold text-gray-900">${{ order.totalPrice }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-2">
          <button
            v-for="btn in getStatusButtons()"
            :key="btn.status"
            @click="updateStatus(btn.status)"
            :disabled="updating"
            :class="btn.class"
            class="w-full text-white py-4 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
          >
            {{ btn.label }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
