<template>
  <ion-page>
    <AppHeader title="Замовлення" back back-href="/orders" />

    <ion-content class="ion-padding">
      <div v-if="loading" class="center">
        <ion-spinner name="crescent" />
      </div>

      <EmptyState v-else-if="!order" tall icon="alert-circle-outline" title="Замовлення не знайдено" />

      <template v-else>
        <div class="top-row">
          <span class="order-id">#{{ order.id.slice(0, 8) }}</span>
          <StatusBadge :status="order.status" />
        </div>
        <p class="meta">{{ formatDate(order.createdAt) }} · {{ formatMoney(order.totalPrice) }}</p>

        <ion-list>
          <ion-item v-for="item in order.items ?? []" :key="item.id">
            <ion-label>
              {{ item.product?.name ?? 'Позиція' }} × {{ item.quantity }}
            </ion-label>
            <ion-note slot="end">{{ formatMoney(item.price) }}</ion-note>
          </ion-item>
        </ion-list>

        <ion-list>
          <ion-item v-if="order.deliveryType === 'delivery' && order.address" lines="none">
            <ion-icon slot="start" :icon="locationOutline" />
            <ion-label>{{ order.address }}</ion-label>
          </ion-item>
          <ion-item lines="none">
            <ion-icon slot="start" :icon="callOutline" />
            <ion-label>{{ order.phone }}</ion-label>
          </ion-item>
          <ion-item v-if="order.courier" lines="none">
            <ion-icon slot="start" :icon="bicycleOutline" />
            <ion-label>
              <h3>{{ order.courier.name }}</h3>
              <p>{{ order.courier.phone || '—' }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <ion-button expand="block" fill="outline" @click="ionRouter.push('/orders/' + order.id + '/tracking')">
          <ion-icon slot="start" :icon="navigateOutline" />
          Трекінг
        </ion-button>

        <ion-button
          v-if="order.status === 'created' || order.status === 'paid'"
          expand="block"
          color="danger"
          fill="outline"
          :disabled="cancelling"
          @click="cancelOrder"
        >
          Скасувати замовлення
        </ion-button>

        <template v-if="order.courier">
          <ion-button v-if="call.phase === 'idle'" expand="block" @click="startCall">
            <ion-icon slot="start" :icon="callOutline" />
            Подзвонити кур’єру
          </ion-button>
          <ion-button v-else expand="block" color="success" @click="call.end()">
            Дзвінок: {{ callPhaseLabel }}
          </ion-button>
        </template>

        <ion-text v-if="call.notice"><p class="note">{{ call.notice }}</p></ion-text>
        <ion-text v-if="error" color="danger"><p>{{ error }}</p></ion-text>

        <div class="section">
          <h3>Чат</h3>

          <div class="chat">
            <p v-if="!messages.length" class="empty-chat">Повідомлень ще немає</p>
            <div
              v-for="message in messages"
              :key="message.id"
              class="bubble"
              :class="message.sender === 'user' ? 'mine' : 'theirs'"
            >
              <p class="bubble-text">{{ message.text }}</p>
              <p class="bubble-meta">{{ timeAgo(message.createdAt) }}</p>
            </div>
          </div>

          <div class="chat-input">
            <ion-input v-model="draft" placeholder="Повідомлення..." @keyup.enter="sendMessage" />
            <ion-button :disabled="!draft.trim() || sending" @click="sendMessage">Надіслати</ion-button>
          </div>
        </div>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSpinner,
  IonText,
  useIonRouter,
} from '@ionic/vue';
import { bicycleOutline, callOutline, locationOutline, navigateOutline } from 'ionicons/icons';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { errorMessage } from '@/api/client';
import type { Order } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { useCallStore } from '@/stores/call';
import { useChatStore } from '@/stores/chat';
import { useOrderStore } from '@/stores/order';
import { useSocketStore } from '@/stores/socket';
import { formatDate, formatMoney, timeAgo } from '@/utils/format';

const route = useRoute();
const ionRouter = useIonRouter();
const orderStore = useOrderStore();
const chat = useChatStore();
const call = useCallStore();
const socket = useSocketStore();

const id = String(route.params.id);
const order = ref<Order | null>(null);
const loading = ref(true);
const cancelling = ref(false);
const sending = ref(false);
const error = ref('');
const draft = ref('');

const messages = computed(() => chat.messagesFor(id));
const callPhaseLabel = computed(() => {
  switch (call.phase) {
    case 'outgoing':
      return 'З’єднання...';
    case 'incoming':
      return 'Вхідний дзвінок';
    case 'active':
      return 'Активний';
    default:
      return 'Завершити';
  }
});

async function load(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    order.value = await orderStore.fetchOrder(id);
    await chat.fetchThread(id);
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}

async function cancelOrder(): Promise<void> {
  cancelling.value = true;
  error.value = '';
  try {
    order.value = await orderStore.cancel(id);
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    cancelling.value = false;
  }
}

function startCall(): void {
  call.start(id);
}

async function sendMessage(): Promise<void> {
  const text = draft.value.trim();
  if (!text) return;
  sending.value = true;
  error.value = '';
  try {
    await chat.send(id, text);
    draft.value = '';
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    sending.value = false;
  }
}

onMounted(() => {
  socket.subscribe('order:' + id);
  load();
});

onUnmounted(() => {
  socket.unsubscribe('order:' + id);
});
</script>

<style scoped>
.top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.order-id {
  font-weight: 700;
  font-size: 18px;
}
.meta {
  font-size: 13px;
  opacity: 0.75;
  margin: 4px 0 12px;
}
.note {
  font-size: 13px;
  opacity: 0.8;
}
.section {
  margin-top: 20px;
}
.chat {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  max-height: 320px;
  overflow-y: auto;
}
.empty-chat {
  opacity: 0.6;
  text-align: center;
}
.bubble {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
}
.bubble.mine {
  align-self: flex-end;
  background: var(--ion-color-primary);
  color: #fff;
}
.bubble.theirs {
  align-self: flex-start;
  background: var(--ion-color-light);
  color: var(--ion-text-color);
}
.bubble-text {
  margin: 0;
}
.bubble-meta {
  margin: 2px 0 0;
  font-size: 10px;
  opacity: 0.7;
}
.chat-input {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chat-input ion-input {
  border: 1px solid var(--ion-color-medium);
  border-radius: 8px;
  padding: 0 8px;
}
.center {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}
</style>
