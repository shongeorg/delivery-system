<template>
  <ion-page>
    <AppHeader title="Кур’єр" />
    <ion-content class="ion-padding">
      <ion-card v-if="auth.user">
        <ion-card-header>
          <ion-card-title>{{ auth.user.name }}</ion-card-title>
          <ion-card-subtitle>Кур’єр доставки</ion-card-subtitle>
        </ion-card-header>
      </ion-card>

      <ion-grid class="stats">
        <ion-row>
          <ion-col size="4">
            <ion-card>
              <ion-card-header>
                <ion-card-title>{{ counts.ready }}</ion-card-title>
                <ion-card-subtitle>Готові</ion-card-subtitle>
              </ion-card-header>
            </ion-card>
          </ion-col>
          <ion-col size="4">
            <ion-card>
              <ion-card-header>
                <ion-card-title>{{ counts.onTheWay }}</ion-card-title>
                <ion-card-subtitle>В дорозі</ion-card-subtitle>
              </ion-card-header>
            </ion-card>
          </ion-col>
          <ion-col size="4">
            <ion-card>
              <ion-card-header>
                <ion-card-title>{{ counts.delivered }}</ion-card-title>
                <ion-card-subtitle>Доставлено</ion-card-subtitle>
              </ion-card-header>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Мій статус</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item lines="none">
            <ion-label>
              <h3>Трекінг локації</h3>
              <p>{{ locationStore.watching ? 'Активний' : 'Вимкнено' }}</p>
              <p v-if="locationStore.latitude !== null && locationStore.longitude !== null">
                {{ locationStore.latitude.toFixed(5) }}, {{ locationStore.longitude.toFixed(5) }}
              </p>
            </ion-label>
            <ion-button slot="end" :color="locationStore.watching ? 'danger' : 'success'" @click="toggleTracking">
              {{ locationStore.watching ? 'Стоп' : 'Старт' }}
            </ion-button>
          </ion-item>

          <ion-item lines="none">
            <ion-label>WebSocket</ion-label>
            <ion-badge slot="end" :color="socket.connected ? 'success' : 'medium'">
              {{ socket.connected ? 'Онлайн' : 'Офлайн' }}
            </ion-badge>
          </ion-item>

          <ion-text v-if="locationStore.error" color="danger">
            <p>{{ locationStore.error }}</p>
          </ion-text>
        </ion-card-content>
      </ion-card>

      <ion-button expand="block" router-link="/courier/orders">Замовлення</ion-button>
      <ion-button expand="block" fill="outline" router-link="/courier/map">Карта</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonItem,
  IonLabel,
  IonPage,
  IonRow,
  IonText,
} from '@ionic/vue';
import { computed, onMounted } from 'vue';

import type { OrderStatus } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import { useAuthStore } from '@/stores/auth';
import { useLocationStore } from '@/stores/location';
import { useOrderStore } from '@/stores/order';
import { useSocketStore } from '@/stores/socket';

const auth = useAuthStore();
const orderStore = useOrderStore();
const locationStore = useLocationStore();
const socket = useSocketStore();

onMounted(() => {
  orderStore.fetchStaffOrders().catch(() => {
    /* помилка не блокує панель */
  });
});

function countBy(status: OrderStatus): number {
  return orderStore.staffOrders.filter((order) => order.status === status).length;
}

const counts = computed(() => ({
  ready: countBy('ready'),
  onTheWay: countBy('on_the_way'),
  delivered: countBy('delivered'),
}));

function toggleTracking(): void {
  if (locationStore.watching) {
    locationStore.stopTracking();
  } else {
    locationStore.startTracking();
  }
}
</script>

<style scoped>
.stats ion-card {
  margin: 0 0 8px;
  text-align: center;
}
.stats ion-card-title {
  font-size: 22px;
}
</style>
