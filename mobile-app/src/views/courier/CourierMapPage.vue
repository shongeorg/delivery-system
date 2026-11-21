<template>
  <ion-page>
    <AppHeader title="Карта" />
    <ion-content class="ion-padding">
      <ion-button expand="block" :color="locationStore.watching ? 'danger' : 'success'" @click="toggleTracking">
        {{ locationStore.watching ? 'Зупинити трекінг' : 'Почати трекінг' }}
      </ion-button>

      <ion-text v-if="locationStore.error" color="danger"
        ><p>{{ locationStore.error }}</p></ion-text
      >

      <MapView :points="points" :line="line" height="60vh" />

      <ion-item lines="none">
        <ion-label>
          <h3>Активна доставка</h3>
          <p>{{ activeLabel }}</p>
        </ion-label>
        <ion-badge slot="end" :color="socket.connected ? 'success' : 'medium'">
          {{ socket.connected ? 'Онлайн' : 'Офлайн' }}
        </ion-badge>
      </ion-item>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonBadge, IonButton, IonContent, IonItem, IonLabel, IonPage, IonText } from '@ionic/vue';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { getOrderTracking } from '@/api/endpoints';
import AppHeader from '@/components/AppHeader.vue';
import MapView from '@/components/MapView.vue';
import { useLocationStore } from '@/stores/location';
import { useOrderStore } from '@/stores/order';
import { useSocketStore } from '@/stores/socket';

interface Point {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

const route = useRoute();
const queryOrderId = typeof route.query.orderId === 'string' ? route.query.orderId : null;

const locationStore = useLocationStore();
const orderStore = useOrderStore();
const socket = useSocketStore();

const client = ref<{ lat: number; lng: number } | null>(null);
const routeLine = ref<[number, number][]>([]);
let routeLoading = false;

const activeOrder = computed(() => orderStore.staffOrders.find((order) => order.status === 'on_the_way') ?? null);

const clientPoint = computed<{ lat: number; lng: number } | null>(() => {
  if (client.value) return client.value;
  const order = activeOrder.value;
  if (order?.lat != null && order?.lng != null) return { lat: order.lat, lng: order.lng };
  return null;
});

const courierPoint = computed<Point | null>(() => {
  if (locationStore.latitude === null || locationStore.longitude === null) return null;
  return {
    lat: locationStore.latitude,
    lng: locationStore.longitude,
    label: 'Я',
    color: '#3880ff',
  };
});

const points = computed<Point[]>(() => {
  const list: Point[] = [];
  if (courierPoint.value) list.push(courierPoint.value);
  if (clientPoint.value) {
    list.push({ ...clientPoint.value, label: 'Клієнт', color: '#ff9800' });
  }
  return list;
});

const straightLine = computed<[number, number][]>(() => {
  if (!courierPoint.value || !clientPoint.value) return [];
  return [
    [courierPoint.value.lat, courierPoint.value.lng],
    [clientPoint.value.lat, clientPoint.value.lng],
  ];
});

const line = computed<[number, number][]>(() => (routeLine.value.length > 1 ? routeLine.value : straightLine.value));

const activeLabel = computed(() => {
  if (activeOrder.value) return `#${activeOrder.value.id.slice(0, 8)}`;
  if (client.value) return 'Клієнт на карті';
  return 'Немає активної доставки';
});

onMounted(() => {
  orderStore.fetchStaffOrders().catch(() => {
    /* карта працює й без списку замовлень */
  });
  if (queryOrderId) void loadTracking(queryOrderId);
});

watch([clientPoint, () => locationStore.latitude, () => locationStore.longitude], () => {
  void loadRoute();
});

async function loadTracking(orderId: string): Promise<void> {
  try {
    const tracking = await getOrderTracking(orderId);
    if (tracking.client.lat != null && tracking.client.lng != null) {
      client.value = { lat: tracking.client.lat, lng: tracking.client.lng };
    }
  } catch {
    /* трекінг недоступний — показуємо лише точку кур'єра */
  }
}

async function loadRoute(): Promise<void> {
  const destination = clientPoint.value;
  const lat = locationStore.latitude;
  const lng = locationStore.longitude;
  if (!destination || lat === null || lng === null) {
    routeLine.value = [];
    return;
  }
  if (routeLoading) return;
  routeLoading = true;
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/${lng},${lat};` +
      `${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as {
      routes?: { geometry?: { coordinates?: [number, number][] } }[];
    };
    const coords = data.routes?.[0]?.geometry?.coordinates;
    routeLine.value = coords && coords.length > 1 ? coords.map(([x, y]) => [y, x] as [number, number]) : [];
  } catch {
    routeLine.value = [];
  } finally {
    routeLoading = false;
  }
}

function toggleTracking(): void {
  if (locationStore.watching) {
    locationStore.stopTracking();
  } else {
    locationStore.startTracking();
  }
}
</script>
