<template>
  <ion-page>
    <AppHeader title="Доставка" back back-href="/courier/orders" />
    <ion-content class="ion-padding">
      <ion-text v-if="error && !order" color="danger"
        ><p>{{ error }}</p></ion-text
      >
      <div v-if="loading && !order" class="loader"><ion-spinner name="crescent" /></div>

      <template v-else-if="order">
        <ion-card>
          <ion-card-header>
            <div class="card-top">
              <ion-card-title>#{{ order.id.slice(0, 8) }}</ion-card-title>
              <StatusBadge :status="order.status" />
            </div>
            <ion-card-subtitle>{{ timeAgo(order.createdAt) }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-button v-if="canTake" expand="block" :disabled="updating" @click="takeOrder">
              <ion-spinner v-if="updating" name="crescent" />
              <span v-else>Взяти в доставку</span>
            </ion-button>
            <ion-button
              v-else-if="canDeliver"
              expand="block"
              color="success"
              :disabled="updating"
              @click="markDelivered"
            >
              <ion-spinner v-if="updating" name="crescent" />
              <span v-else>Доставлено</span>
            </ion-button>
            <ion-text v-else color="medium"><p>Для цього статусу дій немає</p></ion-text>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-content>
            <ion-item lines="none">
              <ion-icon slot="start" :icon="locationOutline" />
              <ion-label>
                <h3>Адреса</h3>
                <p>{{ order.address || 'Самовивіз' }}</p>
              </ion-label>
              <ion-button slot="end" fill="outline" size="small" @click="mapOpen = true"> Навігація </ion-button>
            </ion-item>
            <ion-item lines="none">
              <ion-icon slot="start" :icon="callOutline" />
              <ion-label>
                <h3>Телефон клієнта</h3>
                <p>{{ order.phone }}</p>
              </ion-label>
              <ion-button slot="end" fill="outline" size="small" @click="callClient"> Подзвонити </ion-button>
            </ion-item>
            <ion-item lines="none">
              <ion-icon slot="start" :icon="cardOutline" />
              <ion-label>
                <h3>Оплата</h3>
                <p>{{ order.paymentType }} · {{ order.paymentStatus }}</p>
              </ion-label>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <ion-card v-if="callActive">
          <ion-card-content>
            <ion-item lines="none">
              <ion-label>
                <h3>Дзвінок</h3>
                <p>{{ call.phase === 'active' ? 'Активний' : 'Виклик…' }}</p>
              </ion-label>
            </ion-item>
            <ion-text v-if="call.notice" color="medium"
              ><p>{{ call.notice }}</p></ion-text
            >
            <div class="call-actions">
              <ion-button color="medium" fill="outline" @click="call.toggleMute()">
                {{ call.muted ? 'Увімкнути звук' : 'Mute' }}
              </ion-button>
              <ion-button color="danger" @click="call.end()">Завершити</ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>Позиції</ion-card-title>
          </ion-card-header>
          <ion-list>
            <ion-item v-for="item in order.items ?? []" :key="item.id">
              <ion-label>
                <h3>{{ item.product?.name || 'Товар' }}</h3>
                <p>×{{ item.quantity }}</p>
              </ion-label>
              <ion-text slot="end">{{ formatMoney(toNumber(item.price) * item.quantity) }}</ion-text>
            </ion-item>
            <ion-item v-if="!(order.items && order.items.length)" lines="none">
              <ion-label color="medium">Позиції відсутні</ion-label>
            </ion-item>
          </ion-list>
          <ion-card-content>
            <div class="total">
              <span>Разом</span>
              <strong>{{ formatMoney(order.totalPrice) }}</strong>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>Чат з клієнтом</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="chat">
              <p v-if="messages.length === 0" class="muted">Ще немає повідомлень</p>
              <div
                v-for="message in messages"
                :key="message.id"
                class="bubble"
                :class="message.sender === 'courier' ? 'mine' : 'theirs'"
              >
                <span class="sender">{{ senderLabel(message.sender) }}</span>
                <span class="text">{{ message.text }}</span>
              </div>
            </div>
            <div class="chat-form">
              <ion-input v-model="chatText" placeholder="Повідомлення…" @keyup.enter="sendChat" />
              <ion-button :disabled="sending || !chatText.trim()" @click="sendChat"> Надіслати </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-text v-if="error" color="danger"
          ><p>{{ error }}</p></ion-text
        >
      </template>

      <ion-modal :is-open="mapOpen" :backdrop-dismiss="false">
        <ion-content class="ion-padding">
          <h2>Навігація</h2>
          <MapView :points="mapPoints" height="60vh" />
          <ion-button expand="block" @click="mapOpen = false">Закрити</ion-button>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSpinner,
  IonText,
} from '@ionic/vue';
import { callOutline, cardOutline, locationOutline } from 'ionicons/icons';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { errorMessage } from '@/api/client';
import { updateOrderLocation } from '@/api/endpoints';
import type { ChatMessage, Order } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import MapView from '@/components/MapView.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { useAuthStore } from '@/stores/auth';
import { useCallStore } from '@/stores/call';
import { useChatStore } from '@/stores/chat';
import { useLocationStore } from '@/stores/location';
import { useOrderStore } from '@/stores/order';
import { useSocketStore } from '@/stores/socket';
import { formatMoney, timeAgo, toNumber } from '@/utils/format';

const route = useRoute();
const id = String(route.params.id);

const auth = useAuthStore();
const orderStore = useOrderStore();
const chat = useChatStore();
const socket = useSocketStore();
const locationStore = useLocationStore();
const call = useCallStore();

const order = ref<Order | null>(null);
const loading = ref(true);
const updating = ref(false);
const sending = ref(false);
const error = ref('');
const chatText = ref('');
const mapOpen = ref(false);

const messages = computed(() => chat.messagesFor(id));
const assignedToMe = computed(() => Boolean(order.value?.courierId) && order.value?.courierId === auth.user?.id);
const canTake = computed(() => order.value?.status === 'ready');
const canDeliver = computed(() => order.value?.status === 'on_the_way');
const callActive = computed(() => call.phase === 'outgoing' || call.phase === 'active');

const mapPoints = computed(() => {
  const points: { lat: number; lng: number; label?: string; color?: string }[] = [];
  const current = order.value;
  if (current?.lat != null && current?.lng != null) {
    points.push({ lat: current.lat, lng: current.lng, label: 'Клієнт', color: '#ff9800' });
  }
  if (locationStore.latitude !== null && locationStore.longitude !== null) {
    points.push({
      lat: locationStore.latitude,
      lng: locationStore.longitude,
      label: 'Я',
      color: '#3880ff',
    });
  }
  return points;
});

onMounted(async () => {
  await load();
  // Тред доступний кур'єру лише після призначення на замовлення —
  // інакше бекенд віддає 403, тож вантажимо його після takeOrder().
  if (assignedToMe.value) {
    chat.fetchThread(id).catch(() => {
      /* чат може бути ще порожній */
    });
  }
  socket.subscribe(`order:${id}`);
  if (order.value?.status === 'on_the_way') startTracking();
});

onUnmounted(() => {
  locationStore.stopTracking();
  socket.unsubscribe(`order:${id}`);
});

watch(
  () => [locationStore.latitude, locationStore.longitude] as const,
  ([lat, lng]) => {
    if (!locationStore.watching || lat === null || lng === null) return;
    socket.sendLocationUpdate(id, lat, lng);
    updateOrderLocation(id, lat, lng).catch(() => {
      /* REST-фолбек; WS уже надіслано */
    });
  },
);

async function load(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    order.value = await orderStore.fetchOrder(id);
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}

function startTracking(): void {
  locationStore.startTracking();
}

async function takeOrder(): Promise<void> {
  updating.value = true;
  error.value = '';
  try {
    order.value = await orderStore.updateStatus(id, 'on_the_way');
    startTracking();
    // Тепер кур'єр призначений на замовлення — бекенд дозволяє читати історію чату.
    chat.fetchThread(id).catch(() => {
      /* чат може бути ще порожній */
    });
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    updating.value = false;
  }
}

async function markDelivered(): Promise<void> {
  updating.value = true;
  error.value = '';
  try {
    order.value = await orderStore.updateStatus(id, 'delivered');
    locationStore.stopTracking();
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    updating.value = false;
  }
}

async function sendChat(): Promise<void> {
  const text = chatText.value.trim();
  if (!text) return;
  sending.value = true;
  try {
    await chat.send(id, text);
    chatText.value = '';
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    sending.value = false;
  }
}

function callClient(): void {
  void call.start(id);
}

function senderLabel(sender: ChatMessage['sender']): string {
  if (sender === 'courier') return 'Я';
  if (sender === 'admin') return 'Підтримка';
  return 'Клієнт';
}
</script>

<style scoped>
.loader {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.call-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.total {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.total strong {
  font-size: 18px;
}
.chat {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 260px;
  overflow-y: auto;
  margin-bottom: 8px;
}
.bubble {
  display: flex;
  flex-direction: column;
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 14px;
  font-size: 14px;
}
.bubble.mine {
  align-self: flex-end;
  background: var(--ion-color-primary);
  color: var(--ion-color-primary-contrast);
}
.bubble.theirs {
  align-self: flex-start;
  background: var(--ion-color-light);
}
.bubble .sender {
  font-size: 11px;
  opacity: 0.7;
}
.muted {
  opacity: 0.7;
  font-size: 14px;
}
.chat-form {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
