<template>
  <ion-page>
    <AppHeader title="Кухня" />
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh">
        <ion-refresher-content />
      </ion-refresher>

      <div v-if="loading && !kitchen" class="state">
        <ion-spinner name="crescent" />
      </div>

      <EmptyState
        v-else-if="error"
        :title="error"
        subtitle="Перевірте з’єднання та спробуйте ще раз"
        icon="alert-circle-outline"
        tall
      />

      <div v-else-if="kitchen" class="ion-padding">
        <div class="waiting" :class="{ critical: kitchen.oldestWaitingMinutes >= 30 }">
          <span class="waiting-label">Найдовше очікування</span>
          <span class="waiting-value">{{ kitchen.oldestWaitingMinutes }} хв</span>
        </div>

        <h2 class="section-title">Статуси</h2>
        <div class="stats-grid">
          <div v-for="(count, status) in kitchen.counts" :key="status" class="stat-card">
            <span class="stat-label">{{ statusLabel(status as OrderStatus) }}</span>
            <span class="stat-value">{{ count }}</span>
          </div>
        </div>

        <h2 class="section-title">Черга замовлень</h2>
        <div v-if="kitchen.queue.length" class="order-list">
          <ion-card v-for="order in kitchen.queue" :key="order.id">
            <ion-card-header>
              <div class="order-head">
                <span class="order-id">#{{ order.id.slice(0, 8) }}</span>
                <StatusBadge :status="order.status" />
              </div>
              <ion-card-subtitle>
                {{ order.waitingMinutes }} хв · {{ formatMoney(order.totalPrice) }}
              </ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <ul class="items">
                <li v-for="item in order.items ?? []" :key="item.id">
                  <span>{{ item.quantity }}× {{ item.product?.name ?? 'Товар' }}</span>
                  <span>{{ formatMoney(item.price) }}</span>
                </li>
              </ul>
              <p v-if="order.courier" class="courier">Кур’єр: {{ order.courier.name }}</p>
            </ion-card-content>
          </ion-card>
        </div>
        <EmptyState v-else title="Черга порожня" icon="time-outline" tall />

        <h2 class="section-title">Низький залишок</h2>
        <ion-list v-if="kitchen.lowStock.length">
          <ion-item v-for="item in kitchen.lowStock" :key="item.id">
            <ion-label>{{ item.name }}</ion-label>
            <ion-note slot="end" color="danger">
              {{ toNumber(item.quantity).toFixed(2) }} {{ item.unit }}
            </ion-note>
          </ion-item>
        </ion-list>
        <EmptyState v-else title="Усі запаси в нормі" icon="cube-outline" />
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
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from '@ionic/vue';
import { onMounted, onUnmounted, ref } from 'vue';

import { errorMessage } from '@/api/client';
import { getOwnerKitchen } from '@/api/endpoints';
import type { OrderStatus, OwnerKitchen } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { formatMoney, statusLabel, toNumber } from '@/utils/format';

const kitchen = ref<OwnerKitchen | null>(null);
const loading = ref(false);
const error = ref('');
let timer: ReturnType<typeof setInterval> | null = null;

async function load(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    kitchen.value = await getOwnerKitchen();
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}

async function refresh(event: CustomEvent): Promise<void> {
  await load();
  (event.target as { complete?: () => void } | null)?.complete?.();
}

onMounted(() => {
  void load();
  timer = setInterval(() => {
    void load();
  }, 10000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.state {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}
.waiting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--ion-color-light, #f4f5f8);
  margin-bottom: 8px;
}
.waiting.critical {
  background: var(--ion-color-warning-tint, #ffe8b3);
}
.waiting-label {
  font-size: 14px;
}
.waiting-value {
  font-size: 18px;
  font-weight: 700;
}
.section-title {
  margin: 20px 0 8px;
  font-size: 16px;
  font-weight: 600;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: 12px;
  background: var(--ion-color-light, #f4f5f8);
}
.stat-label {
  font-size: 12px;
  opacity: 0.7;
}
.stat-value {
  font-size: 18px;
  font-weight: 700;
}
.order-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.order-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.order-id {
  font-family: monospace;
  font-size: 13px;
}
.items {
  list-style: none;
  margin: 0;
  padding: 0;
}
.items li {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  font-size: 14px;
}
.courier {
  margin: 8px 0 0;
  font-size: 12px;
  opacity: 0.7;
}
</style>
