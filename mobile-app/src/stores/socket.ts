import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';

import { WS_URL } from '@/api/client';
import type { WsMessage } from '@/api/types';
import { useAuthStore } from './auth';
import { useCallStore } from './call';
import { useChatStore } from './chat';
import { useOrderStore } from './order';

export const useSocketStore = defineStore('socket', () => {
  const socket = shallowRef<WebSocket | null>(null);
  const connected = ref(false);
  const channels = new Set<string>();
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let shouldReconnect = true;

  function send(payload: Record<string, unknown>): void {
    if (socket.value && connected.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(payload));
    }
  }

  function connect(): void {
    const authStore = useAuthStore();
    if (!authStore.accessToken) return;
    if (socket.value && socket.value.readyState <= WebSocket.OPEN) return;

    shouldReconnect = true;
    socket.value = new WebSocket(WS_URL);

    socket.value.onopen = () => {
      connected.value = true;
      send({ type: 'auth', token: authStore.accessToken });
      channels.forEach((channel) => send({ type: 'subscribe', channel }));
      send({ type: 'subscribe', channel: 'orders' });
    };

    socket.value.onmessage = (event: MessageEvent<string>) => {
      try {
        handleSocketMessage(JSON.parse(event.data) as WsMessage);
      } catch {
        /* ignore malformed frames */
      }
    };

    socket.value.onclose = () => {
      connected.value = false;
      if (shouldReconnect) {
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    socket.value.onerror = () => {
      connected.value = false;
    };
  }

  function subscribe(channel: string): void {
    if (channels.has(channel)) return;
    channels.add(channel);
    send({ type: 'subscribe', channel });
  }

  function unsubscribe(channel: string): void {
    channels.delete(channel);
    send({ type: 'unsubscribe', channel });
  }

  function handleSocketMessage(message: WsMessage): void {
    switch (message.type) {
      case 'new_order':
      case 'order_updated':
      case 'order_cancelled': {
        const orderStore = useOrderStore();
        orderStore.refreshFromSocket(message).catch(() => {});
        break;
      }
      case 'chat_message':
        useChatStore().receive(message.data);
        break;
      case 'call_invite':
      case 'call_accepted':
      case 'call_declined':
      case 'call_unavailable':
      case 'call_end':
      case 'call_ringing':
      case 'webrtc_offer':
      case 'webrtc_answer':
      case 'ice_candidate':
        useCallStore().handleMessage(message);
        break;
      default:
        break;
    }
  }

  function sendLocationUpdate(orderId: string, lat: number, lng: number): void {
    send({ type: 'courier_location_update', orderId, lat, lng });
  }

  function disconnect(): void {
    shouldReconnect = false;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
    if (socket.value) {
      socket.value.close();
      socket.value = null;
    }
    connected.value = false;
    channels.clear();
  }

  return {
    socket,
    connected,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send,
    sendLocationUpdate,
  };
});
