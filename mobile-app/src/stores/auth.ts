import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import * as api from '@/api/endpoints';
import type { AuthResponse, Role, User } from '@/api/types';
import { tokenStore } from '@/api/client';

function readStoredUser(): User | null {
  const raw = tokenStore.user;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(readStoredUser());
  const accessToken = ref<string | null>(tokenStore.access);
  const refreshToken = ref<string | null>(tokenStore.refresh);
  const loading = ref(false);
  const error = ref('');

  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value));
  const role = computed<Role | null>(() => user.value?.role ?? null);
  const isOwner = computed(() => role.value === 'owner' || role.value === 'admin');
  const isChef = computed(() => role.value === 'chef');
  const isCourier = computed(() => role.value === 'courier');
  const isCustomer = computed(() => role.value === 'customer');

  function persist(data: AuthResponse): void {
    user.value = data.user;
    accessToken.value = data.accessToken;
    refreshToken.value = data.refreshToken;
    tokenStore.set(data.accessToken, data.refreshToken);
    tokenStore.setUser(data.user);
  }

  function applyUser(next: User): void {
    user.value = next;
    tokenStore.setUser(next);
  }

  async function login(email: string, password: string): Promise<User> {
    loading.value = true;
    error.value = '';
    try {
      const data = await api.login(email, password);
      persist(data);
      return data.user;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Login failed';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function register(payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }): Promise<User> {
    loading.value = true;
    error.value = '';
    try {
      const data = await api.register(payload);
      persist(data);
      return data.user;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Registration failed';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMe(): Promise<User | null> {
    if (!accessToken.value) return null;
    const me = await api.getMe();
    applyUser(me);
    return me;
  }

  async function updateProfile(
    payload: Partial<Pick<User, 'name' | 'phone' | 'address' | 'cover'>>,
  ): Promise<User> {
    const me = await api.updateMe(payload);
    applyUser(me);
    return me;
  }

  function setSession(data: AuthResponse): void {
    persist(data);
  }

  function logout(): void {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    tokenStore.clear();
  }

  function homeRoute(): string {
    switch (role.value) {
      case 'owner':
      case 'admin':
        return '/owner';
      case 'chef':
        return '/kitchen';
      case 'courier':
        return '/courier';
      default:
        return '/shop';
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    loading,
    error,
    isAuthenticated,
    role,
    isOwner,
    isChef,
    isCourier,
    isCustomer,
    login,
    register,
    fetchMe,
    updateProfile,
    setSession,
    logout,
    homeRoute,
  };
});
