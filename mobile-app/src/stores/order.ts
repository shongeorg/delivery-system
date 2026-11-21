import { defineStore } from 'pinia';
import { ref } from 'vue';

import * as api from '@/api/endpoints';
import type { Order, OrderStatus, WsMessage } from '@/api/types';

export const useOrderStore = defineStore('order', () => {
  const staffOrders = ref<Order[]>([]);
  const myOrders = ref<Order[]>([]);
  const current = ref<Order | null>(null);
  const loading = ref(false);

  async function fetchStaffOrders(status?: OrderStatus): Promise<Order[]> {
    loading.value = true;
    try {
      staffOrders.value = await api.listOrders(status);
      return staffOrders.value;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMyOrders(): Promise<Order[]> {
    loading.value = true;
    try {
      myOrders.value = await api.listMyOrders();
      return myOrders.value;
    } finally {
      loading.value = false;
    }
  }

  async function fetchOrder(id: string): Promise<Order> {
    const order = await api.getOrder(id);
    current.value = order;
    return order;
  }

  async function updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await api.updateOrderStatus(id, status);
    applyUpdate(order);
    return order;
  }

  async function cancel(id: string): Promise<Order> {
    const order = await api.cancelOrder(id);
    applyUpdate(order);
    return order;
  }

  function applyUpdate(order: Order): void {
    if (current.value?.id === order.id) current.value = order;
    replaceIn(staffOrders.value, order);
    replaceIn(myOrders.value, order);
  }

  function replaceIn(list: Order[], order: Order): void {
    const idx = list.findIndex((o) => o.id === order.id);
    if (idx !== -1) list[idx] = order;
  }

  async function refreshFromSocket(message: WsMessage): Promise<void> {
    const data = (message.data ?? {}) as Partial<Order>;
    const id = data.id;
    if (!id) return;

    if (message.type === 'order_cancelled') {
      const existing = staffOrders.value.find((o) => o.id === id) ?? myOrders.value.find((o) => o.id === id);
      if (existing) {
        await fetchOrder(id);
      }
      return;
    }

    await fetchOrder(id);
    if (staffOrders.value.length) await fetchStaffOrders();
  }

  function reset(): void {
    staffOrders.value = [];
    myOrders.value = [];
    current.value = null;
  }

  return {
    staffOrders,
    myOrders,
    current,
    loading,
    fetchStaffOrders,
    fetchMyOrders,
    fetchOrder,
    updateStatus,
    cancel,
    applyUpdate,
    refreshFromSocket,
    reset,
  };
});
