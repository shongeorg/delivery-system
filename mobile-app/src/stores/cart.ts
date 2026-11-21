import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import * as api from '@/api/endpoints';
import type { CartLineItem } from '@/api/types';

function parsePrice(value: string | number | undefined | null): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '0'));
  return Number.isFinite(n) ? n : 0;
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartLineItem[]>([]);
  const loading = ref(false);

  const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0));
  const total = computed(() =>
    items.value.reduce((sum, item) => sum + parsePrice(item.product?.price) * item.quantity, 0),
  );
  const isEmpty = computed(() => items.value.length === 0);

  async function fetchCart(): Promise<void> {
    loading.value = true;
    try {
      const data = await api.getCart();
      items.value = data.items ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function add(productId: string, quantity = 1): Promise<void> {
    await api.addCartItem(productId, quantity);
    await fetchCart();
  }

  async function update(itemId: string, quantity: number): Promise<void> {
    if (quantity < 1) {
      await remove(itemId);
      return;
    }
    await api.updateCartItem(itemId, quantity);
    await fetchCart();
  }

  async function remove(itemId: string): Promise<void> {
    await api.removeCartItem(itemId);
    await fetchCart();
  }

  async function clear(): Promise<void> {
    await api.clearCart();
    items.value = [];
  }

  function reset(): void {
    items.value = [];
  }

  return { items, loading, count, total, isEmpty, fetchCart, add, update, remove, clear, reset };
});
