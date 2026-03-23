<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useSocketStore } from './stores/socket'

const authStore = useAuthStore()
const socketStore = useSocketStore()

onMounted(() => {
  // Initialize auth from localStorage
  authStore.init()

  // Connect to WebSocket if authenticated
  if (authStore.isAuthenticated) {
    socketStore.connect()
  }
})
</script>

<template>
  <router-view />
</template>
