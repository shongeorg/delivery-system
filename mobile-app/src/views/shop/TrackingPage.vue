<template>
  <ion-page>
    <AppHeader title="Трекінг" back :back-href="'/orders/' + id" />

    <ion-content class="ion-padding">
      <div v-if="loading && !tracking" class="center">
        <ion-spinner name="crescent" />
      </div>

      <EmptyState
        v-else-if="!tracking"
        tall
        icon="navigate-outline"
        title="Дані трекінгу недоступні"
      />

      <template v-else>
        <div class="top-row">
          <span class="order-id">#{{ tracking.order.id.slice(0, 8) }}</span>
          <StatusBadge :status="tracking.order.status" />
        </div>

        <MapView :points="points" :line="line" />

        <ion-list>
          <ion-item v-if="tracking.courier" lines="none">
            <ion-icon slot="start" :icon="bicycleOutline" />
            <ion-label>
              <h3>{{ tracking.courier.name }}</h3>
              <p>{{ tracking.courier.phone || '—' }}</p>
            </ion-label>
          </ion-item>
          <ion-item lines="none">
            <ion-icon slot="start" :icon="timeOutline" />
            <ion-label>Оновлено: {{ timeAgo(tracking.location?.updatedAt) }}</ion-label>
          </ion-item>
          <ion-item v-if="tracking.order.address" lines="none">
            <ion-icon slot="start" :icon="locationOutline" />
            <ion-label>{{ tracking.order.address }}</ion-label>
          </ion-item>
        </ion-list>

        <ion-button v-if="tracking.courier && call.phase === 'idle'" expand="block" @click="startCall">
          <ion-icon slot="start" :icon="callOutline" />
          Подзвонити
        </ion-button>
        <ion-button v-else-if="call.phase !== 'idle'" expand="block" color="success" @click="call.end()">
          Дзвінок · {{ call.phase }}
        </ion-button>

        <ion-text v-if="call.notice"><p class="note">{{ call.notice }}</p></ion-text>
        <ion-text v-if="error" color="danger"><p>{{ error }}</p></ion-text>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonText,
} from '@ionic/vue';
import { bicycleOutline, callOutline, locationOutline, timeOutline } from 'ionicons/icons';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { errorMessage } from '@/api/client';
import { getOrderTracking } from '@/api/endpoints';
import type { Tracking } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import MapView from '@/components/MapView.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { useCallStore } from '@/stores/call';
import { useSocketStore } from '@/stores/socket';
import { timeAgo } from '@/utils/format';

const route = useRoute();
const call = useCallStore();
const socket = useSocketStore();

const id = String(route.params.id);
const tracking = ref<Tracking | null>(null);
const loading = ref(true);
const error = ref('');
let poll: ReturnType<typeof setInterval> | null = null;

const points = computed(() => {
  const data = tracking.value;
  if (!data) return [];
  const result: { lat: number; lng: number; label?: string; color?: string }[] = [];

  const { lat: clientLat, lng: clientLng } = data.client;
  if (clientLat != null && clientLng != null && Number.isFinite(clientLat) && Number.isFinite(clientLng)) {
    result.push({ lat: clientLat, lng: clientLng, color: '#ff9800', label: 'Ви' });
  }

  const loc = data.location;
  if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
    result.push({ lat: loc.lat, lng: loc.lng, color: '#3880ff', label: data.courier?.name || 'Кур’єр' });
  }

  return result;
});

const line = computed<[number, number][]>(() => {
  const data = tracking.value;
  if (!data || !data.location) return [];
  const { lat: clientLat, lng: clientLng } = data.client;
  const { lat, lng } = data.location;
  if (clientLat == null || clientLng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return [];
  return [
    [clientLat, clientLng],
    [lat, lng],
  ];
});

async function load(): Promise<void> {
  try {
    tracking.value = await getOrderTracking(id);
    error.value = '';
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}

function startCall(): void {
  call.start(id);
}

onMounted(() => {
  socket.subscribe('order:' + id);
  load();
  poll = setInterval(load, 5000);
});

onUnmounted(() => {
  socket.unsubscribe('order:' + id);
  if (poll) clearInterval(poll);
  poll = null;
});
</script>

<style scoped>
.top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.order-id {
  font-weight: 700;
  font-size: 18px;
}
.note {
  font-size: 13px;
  opacity: 0.8;
}
.center {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}
</style>
