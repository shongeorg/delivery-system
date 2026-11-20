<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

function useDemo(demoEmail) {
  email.value = demoEmail
  password.value = 'cura123'
  error.value = ''
}

async function handleLogin() {
  loading.value = true
  error.value = ''

  try {
    await authStore.login(email.value, password.value)
    router.push('/orders')
  } catch (err) {
    error.value = typeof err === 'string' ? err : 'Invalid credentials'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
    <div aria-hidden="true" class="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-primary-container opacity-70 blur-3xl"></div>
    <div aria-hidden="true" class="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-secondary-container opacity-60 blur-3xl"></div>

    <main class="relative w-full max-w-md">
      <div class="mb-8 flex flex-col items-center text-center">
        <div class="grid h-16 w-16 place-items-center rounded-3xl bg-primary text-on-primary shadow-m3">
          <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M14 17V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1" />
            <path d="M14 9h4l4 4v3a1 1 0 0 1-1 1h-1" />
            <circle cx="7.5" cy="17.5" r="2.5" />
            <circle cx="17.5" cy="17.5" r="2.5" />
            <path d="M10 17.5h5" />
          </svg>
        </div>
        <h1 class="mt-5 text-3xl font-semibold tracking-tight text-on-surface">Courier</h1>
        <p class="mt-2 text-sm text-on-surface-variant">Sign in to manage your deliveries</p>
      </div>

      <form class="card space-y-5 p-6 sm:p-8" @submit.prevent="handleLogin">
        <div class="space-y-1.5">
          <label for="email" class="field-label">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            inputmode="email"
            required
            class="field"
            placeholder="courier@example.com"
          />
        </div>

        <div class="space-y-1.5">
          <label for="password" class="field-label">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="field"
            placeholder="Enter your password"
          />
        </div>

        <div
          v-if="error"
          role="alert"
          class="flex items-start gap-2 rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container"
        >
          <svg class="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          <span>{{ error }}</span>
        </div>

        <button type="submit" class="btn btn-filled w-full" :disabled="loading">
          <progress v-if="loading" class="spinner spinner-sm" aria-label="Signing in"></progress>
          <span>{{ loading ? 'Signing in…' : 'Sign in' }}</span>
          <svg v-if="!loading" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </form>

      <div class="mt-6 rounded-3xl bg-surface-container-high p-4">
        <p class="section-label mb-3">Demo accounts</p>
        <div class="space-y-2">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 rounded-2xl bg-surface-container px-4 py-3 text-left transition hover:bg-surface-container-highest"
            @click="useDemo('cura1@mail.com')"
          >
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium text-on-surface">cura1@mail.com</span>
              <span class="block text-xs text-on-surface-variant">Password · cura123</span>
            </span>
            <span class="shrink-0 text-xs font-semibold text-primary">Use</span>
          </button>

          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 rounded-2xl bg-surface-container px-4 py-3 text-left transition hover:bg-surface-container-highest"
            @click="useDemo('cura2@mail.com')"
          >
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium text-on-surface">cura2@mail.com</span>
              <span class="block text-xs text-on-surface-variant">Password · cura123</span>
            </span>
            <span class="shrink-0 text-xs font-semibold text-primary">Use</span>
          </button>
        </div>
      </div>

      <p class="mt-6 text-center text-xs text-on-surface-variant">Authorized couriers only</p>
    </main>
  </div>
</template>
