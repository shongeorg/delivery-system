<template>
  <ion-page>
    <AppHeader title="Черга замовлень" />
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <ion-segment :value="filter" class="filter-segment" @ionChange="onFilterChange">
        <ion-segment-button value="all">
          <ion-label>Усі</ion-label>
        </ion-segment-button>
        <ion-segment-button value="paid">
          <ion-label>Нові</ion-label>
        </ion-segment-button>
        <ion-segment-button value="cooking">
          <ion-label>Готуються</ion-label>
        </ion-segment-button>
        <ion-segment-button value="ready">
          <ion-label>Готові</ion-label>
        </ion-segment-button>
      </ion-segment>

      <ion-text v-if="error" color="danger"><p class="ion-padding-horizontal">{{ error }}</p></ion-text>

      <div class="ion-padding">
        <EmptyState
          v-if="!visibleOrders.length"
          title="Немає замовлень"
          subtitle="У цій категорії поки немає замовлень"
          icon="receipt-outline"
        />

        <ion-card v-for="order in visibleOrders" :key="order.id" class="order-card">
          <ion-card-header>
            <div class="card-head">
              <span class="order-id">#{{ order.id.slice(0, 8) }}</span>
              <StatusBadge :status="order.status" />
            </div>
            <ion-card-subtitle>{{ timeAgo(order.createdAt) }}</ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            <ion-list lines="none" class="items-list">
              <ion-item v-for="item in order.items ?? []" :key="item.id">
                <ion-label>{{ item.product?.name ?? 'Позиція' }} × {{ item.quantity }}</ion-label>
              </ion-item>
            </ion-list>

            <ion-text v-if="order.address" color="medium">
              <p class="address">{{ order.address }}</p>
            </ion-text>

            <div class="total">
              <strong>{{ formatMoney(order.totalPrice) }}</strong>
            </div>

            <ion-button
              v-if="order.status === 'paid'"
              expand="block"
              color="warning"
              :disabled="updatingId === order.id"
              @click="startCooking(order.id)"
            >
              Почати готувати
            </ion-button>
            <ion-button
              v-else-if="order.status === 'cooking'"
              expand="block"
              color="success"
              :disabled="updatingId === order.id"
              @click="markReady(order.id)"
            >
              Позначити готовим
            </ion-button>
            <ion-text v-else-if="order.status === 'ready'" color="success">
              <p class="waiting">Очікує кур’єра</p>
            </ion-text>
          </ion-card-content>
        </ion-card>
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
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonText,
} from '@ionic/vue';
import type { RefresherEventDetail, SegmentChangeEventDetail } from '@ionic/vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';

import { errorMessage } from '@/api/client';
import type { OrderStatus } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { useOrderStore } from '@/stores/order';
import { useSocketStore } from '@/stores/socket';
import { formatMoney, timeAgo } from '@/utils/format';

type Filter = 'all' | 'paid' | 'cooking' | 'ready';

const orderStore = useOrderStore();
const socket = useSocketStore();

const filter = ref<Filter>('all');
const updatingId = ref<string | null>(null);
const error = ref('');

const visibleOrders = computed(() => {
  const orders = orderStore.staffOrders;
  if (filter.value === 'all') return orders;
  return orders.filter((o) => o.status === filter.value);
});

async function load(): Promise<void> {
  error.value = '';
  try {
    await orderStore.fetchStaffOrders();
  } catch (e) {
    error.value = errorMessage(e);
  }
}

async function onRefresh(event: CustomEvent<RefresherEventDetail>): Promise<void> {
  await load();
  event.detail.complete();
}

function onFilterChange(event: CustomEvent<SegmentChangeEventDetail>): void {
  filter.value = (event.detail.value ?? 'all') as Filter;
}

async function changeStatus(id: string, status: OrderStatus): Promise<void> {
  updatingId.value = id;
  error.value = '';
  try {
    await orderStore.updateStatus(id, status);
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    updatingId.value = null;
  }
}

function startCooking(id: string): Promise<void> {
  return changeStatus(id, 'cooking');
}

function markReady(id: string): Promise<void> {
  return changeStatus(id, 'ready');
}

onMounted(() => {
  socket.subscribe('orders');
  void load();
});

onUnmounted(() => {
  socket.unsubscribe('orders');
});
</script>

<style scoped>
.filter-segment {
  padding: 8px;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.order-id {
  font-weight: 700;
}
.items-list {
  background: transparent;
  padding: 0;
}
.items-list ion-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  --min-height: 28px;
}
.address {
  font-size: 13px;
  margin: 4px 0;
}
.total {
  margin: 8px 0;
}
.waiting {
  text-align: center;
  font-weight: 600;
  margin: 4px 0 0;
}
</style>
