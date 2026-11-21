<template>
  <ion-page>
    <AppHeader title="Замовлення" />
    <ion-content>
      <ion-segment v-model="filter">
        <ion-segment-button value="ready">
          <ion-label>Готові</ion-label>
        </ion-segment-button>
        <ion-segment-button value="on_the_way">
          <ion-label>В дорозі</ion-label>
        </ion-segment-button>
        <ion-segment-button value="delivered">
          <ion-label>Доставлено</ion-label>
        </ion-segment-button>
      </ion-segment>

      <ion-refresher slot="fixed" @ion-refresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <div class="ion-padding">
        <EmptyState
          v-if="!orderStore.loading && filtered.length === 0"
          title="Немає замовлень"
          subtitle="У цій категорії поки що нічого немає"
          icon="cube-outline"
          tall
        />

        <ion-card v-for="order in filtered" :key="order.id" button @click="open(order.id)">
          <ion-card-header>
            <div class="card-top">
              <ion-card-title>#{{ order.id.slice(0, 8) }}</ion-card-title>
              <StatusBadge :status="order.status" />
            </div>
            <ion-card-subtitle>{{ timeAgo(order.createdAt) }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <div class="line">
              <ion-icon :icon="locationOutline" />
              <span>{{ order.address || 'Самовивіз' }}</span>
            </div>
            <div class="line">
              <ion-icon :icon="callOutline" />
              <span>{{ order.phone }}</span>
            </div>
            <div class="line">
              <ion-icon :icon="cashOutline" />
              <span>{{ formatMoney(order.totalPrice) }}</span>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonIcon,
  IonLabel,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  useIonRouter,
} from '@ionic/vue';
import { callOutline, cashOutline, locationOutline } from 'ionicons/icons';
import { computed, onMounted, ref } from 'vue';

import type { OrderStatus } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { useOrderStore } from '@/stores/order';
import { formatMoney, timeAgo } from '@/utils/format';

const orderStore = useOrderStore();
const ionRouter = useIonRouter();

const filter = ref<OrderStatus>('ready');

const filtered = computed(() => orderStore.staffOrders.filter((order) => order.status === filter.value));

onMounted(() => {
  orderStore.fetchStaffOrders().catch(() => {
    /* помилка не блокує список */
  });
});

async function onRefresh(event: CustomEvent): Promise<void> {
  try {
    await orderStore.fetchStaffOrders();
  } finally {
    (event.target as unknown as { complete: () => void }).complete();
  }
}

function open(id: string): void {
  ionRouter.push(`/courier/orders/${id}`);
}
</script>

<style scoped>
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
  font-size: 14px;
}
.line ion-icon {
  color: var(--ion-color-medium);
  font-size: 18px;
}
</style>
