import { defineStore } from 'pinia';
import { ref } from 'vue';

import * as api from '@/api/endpoints';
import type { ChatMessage } from '@/api/types';

export const useChatStore = defineStore('chat', () => {
  const threads = ref<Record<string, ChatMessage[]>>({});
  const loading = ref(false);

  function messagesFor(orderId: string): ChatMessage[] {
    return threads.value[orderId] ?? [];
  }

  async function fetchThread(orderId: string): Promise<void> {
    loading.value = true;
    try {
      const list = await api.getOrderMessages(orderId);
      threads.value[orderId] = list ?? [];
    } finally {
      loading.value = false;
    }
  }

  async function send(orderId: string, text: string): Promise<ChatMessage> {
    const message = await api.sendOrderMessage(orderId, text);
    const existing = threads.value[orderId] ?? [];
    threads.value[orderId] = [...existing, message];
    return message;
  }

  function receive(payload: unknown): void {
    const data = (payload ?? {}) as Record<string, unknown>;
    const orderId = (data.orderId as string) || (data.chatOrderId as string);
    if (!orderId) return;

    const message: ChatMessage = {
      id: (data.id as string) ?? crypto.randomUUID(),
      chatId: data.chatId as string | undefined,
      sender: (data.sender as ChatMessage['sender']) ?? 'admin',
      text: (data.text as string) ?? '',
      createdAt: (data.createdAt as string) ?? new Date().toISOString(),
    };

    const existing = threads.value[orderId] ?? [];
    threads.value[orderId] = [...existing, message];
  }

  function clear(): void {
    threads.value = {};
  }

  return { threads, loading, messagesFor, fetchThread, send, receive, clear };
});
