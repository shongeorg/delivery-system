<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const user = computed(() => authStore.user)

function handleLogout() {
  authStore.logout()
  router.push('/')
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
        <h1 class="text-xl font-bold text-gray-800">Profile</h1>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <!-- User Info -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {{ user?.name?.charAt(0) || 'C' }}
          </div>
          <div>
            <h2 class="font-semibold text-gray-800 text-lg">{{ user?.name || 'Courier' }}</h2>
            <p class="text-gray-600 text-sm">{{ user?.email }}</p>
            <span class="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
              {{ user?.role || 'courier' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="bg-white rounded-lg shadow p-4">
        <h3 class="font-semibold text-gray-800 mb-3">Statistics</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center p-3 bg-gray-50 rounded">
            <p class="text-2xl font-bold text-gray-800">0</p>
            <p class="text-sm text-gray-600">Deliveries</p>
          </div>
          <div class="text-center p-3 bg-gray-50 rounded">
            <p class="text-2xl font-bold text-gray-800">0</p>
            <p class="text-sm text-gray-600">Rating</p>
          </div>
        </div>
      </div>

      <!-- Settings -->
      <div class="bg-white rounded-lg shadow p-4">
        <h3 class="font-semibold text-gray-800 mb-3">Settings</h3>
        <div class="space-y-2">
          <button class="w-full text-left px-4 py-3 hover:bg-gray-50 rounded transition">
            <span class="text-gray-700">Notifications</span>
          </button>
          <button class="w-full text-left px-4 py-3 hover:bg-gray-50 rounded transition">
            <span class="text-gray-700">Privacy</span>
          </button>
          <button class="w-full text-left px-4 py-3 hover:bg-gray-50 rounded transition">
            <span class="text-gray-700">Help & Support</span>
          </button>
        </div>
      </div>

      <!-- Logout -->
      <button
        @click="handleLogout"
        class="w-full bg-red-600 text-white py-4 rounded-lg font-semibold hover:bg-red-700 transition"
      >
        Sign Out
      </button>
    </main>

    <!-- Bottom nav -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div class="max-w-4xl mx-auto px-4 py-2 flex justify-around">
        <router-link to="/orders" class="flex flex-col items-center text-gray-600">
          <span class="text-xl">📦</span>
          <span class="text-xs">Orders</span>
        </router-link>
        <router-link to="/map" class="flex flex-col items-center text-gray-600">
          <span class="text-xl">🗺️</span>
          <span class="text-xs">Map</span>
        </router-link>
        <router-link to="/profile" class="flex flex-col items-center text-blue-600">
          <span class="text-xl">👤</span>
          <span class="text-xs">Profile</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>
