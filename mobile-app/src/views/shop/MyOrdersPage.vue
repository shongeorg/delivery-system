<template>
  <ion-page>
    <AppHeader title="Мої замовлення" back back-href="/shop" />

    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <div class="ion-padding">
        <div v-if="orderStore.loading && !orderStore.myOrders.length" class="center">
          <ion-spinner name="crescent" />
        </div>

        <EmptyState
          v-else-if="!orderStore.myOrders.length"
          tall
          icon="receipt-outline"
          title="Замовлень ще немає"
          subtitle="Оформіть перше замовлення у каталозі"
        >
          <ion-button router-link="/shop">До каталогу</ion-button>
        </EmptyState>

        <ion-card
          v-for="order in orderStore.myOrders"
          :key="order.id"
          button
          @click="ionRouter.push('/orders/' + order.id)"
        >
          <ion-card-header>
            <div class="card-top">
              <ion-card-title>#{{ order.id.slice(0, 8) }}</ion-card-title>
              <StatusBadge :status="order.status" />
            </div>
            <ion-card-subtitle>{{ formatDate(order.createdAt) }} · {{ timeAgo(order.createdAt) }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <p class="total">{{ formatMoney(order.totalPrice) }}</p>
            <p class="meta">{{ deliveryLabel(order.deliveryType) }} · {{ paymentLabel(order.paymentType) }}</p>

            <ion-button
              v-if="canTrack(order.status)"
              expand="block"
              fill="outline"
              size="small"
              @click.stop="ionRouter.push('/orders/' + order.id + '/tracking')"
            >
              Трекінг
            </ion-button>
          </ion-card-content>
        </ion-card>

        <ion-text v-if="error" color="danger"><p>{{ error }}</p></ion-text>
      </div>
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
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText,
  useIonRouter,
} from '@ionic/vue';
import { onMounted, ref } from 'vue';

import { errorMessage } from '@/api/client';
import type { DeliveryType, OrderStatus, PaymentType } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { useOrderStore } from '@/stores/order';
import { formatDate, formatMoney, timeAgo } from '@/utils/format';

const orderStore = useOrderStore();
const ionRouter = useIonRouter();
const error = ref('');

const TRACKABLE: OrderStatus[] = ['on_the_way', 'ready', 'delivered'];

function canTrack(status: OrderStatus): boolean {
  return TRACKABLE.includes(status);
}

function deliveryLabel(type: DeliveryType): string {
  return type === 'delivery' ? 'Доставка' : 'Самовивіз';
}

function paymentLabel(type: PaymentType): string {
  return type === 'card' ? 'Картка' : 'Готівка';
}

async function load(): Promise<void> {
  error.value = '';
  try {
    await orderStore.fetchMyOrders();
  } catch (e) {
    error.value = errorMessage(e);
  }
}

async function onRefresh(event: CustomEvent): Promise<void> {
  try {
    await orderStore.fetchMyOrders();
  } finally {
    (event.target as unknown as { complete: () => void }).complete();
  }
}

onMounted(() => {
  load();
});
</script>

<style scoped>
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.total {
  font-weight: 700;
  font-size: 16px;
  margin: 0 0 4px;
}
.meta {
  font-size: 13px;
  opacity: 0.75;
  margin: 0 0 8px;
}
.center {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}
</style>
