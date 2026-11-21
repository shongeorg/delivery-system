<template>
  <ion-page>
    <AppHeader title="Огляд" />
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh">
        <ion-refresher-content />
      </ion-refresher>

      <div v-if="loading && !overview" class="state">
        <ion-spinner name="crescent" />
      </div>

      <EmptyState
        v-else-if="error"
        :title="error"
        subtitle="Перевірте з’єднання та спробуйте ще раз"
        icon="alert-circle-outline"
        tall
      />

      <div v-else-if="overview" class="ion-padding">
        <h2 class="section-title">Дохід</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Сьогодні</span>
            <span class="stat-value">{{ formatMoney(overview.revenue.today) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Тиждень</span>
            <span class="stat-value">{{ formatMoney(overview.revenue.week) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Місяць</span>
            <span class="stat-value">{{ formatMoney(overview.revenue.month) }}</span>
          </div>
        </div>

        <h2 class="section-title">Замовлення</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Сьогодні</span>
            <span class="stat-value">{{ overview.orders.today }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Активні</span>
            <span class="stat-value">{{ overview.orders.active }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Доставлено сьогодні</span>
            <span class="stat-value">{{ overview.orders.deliveredToday }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Середній чек</span>
            <span class="stat-value">{{ formatMoney(overview.orders.averageValue) }}</span>
          </div>
        </div>

        <h2 class="section-title">Чистий прибуток (місяць)</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Net profit</span>
            <span class="stat-value" :class="{ negative: overview.finance.netProfitMonth < 0 }">
              {{ formatMoney(overview.finance.netProfitMonth) }}
            </span>
          </div>
        </div>

        <h2 class="section-title">Топ товарів</h2>
        <ion-list v-if="overview.topProducts.length">
          <ion-item v-for="product in overview.topProducts" :key="product.name">
            <ion-label>
              <h3>{{ product.name }}</h3>
              <p>{{ product.quantity }} шт · {{ formatMoney(product.revenue) }}</p>
            </ion-label>
            <div slot="end" class="bar-wrap">
              <div class="bar" :style="{ width: widthFor(product.revenue) }" />
            </div>
          </ion-item>
        </ion-list>
        <EmptyState v-else title="Немає продажів" icon="trending-up-outline" />

        <h2 class="section-title">Низький залишок</h2>
        <ion-list v-if="overview.lowStock.length">
          <ion-item v-for="item in overview.lowStock" :key="item.id">
            <ion-label>{{ item.name }}</ion-label>
            <ion-note slot="end" color="danger">
              {{ toNumber(item.quantity).toFixed(2) }} {{ item.unit }}
            </ion-note>
          </ion-item>
        </ion-list>
        <EmptyState v-else title="Усі запаси в нормі" icon="cube-outline" />

        <h2 class="section-title">Останні замовлення</h2>
        <div v-if="overview.recentOrders.length" class="order-list">
          <ion-card button @click="openOrder(order.id)" v-for="order in overview.recentOrders" :key="order.id">
            <ion-card-header>
              <div class="order-head">
                <span class="order-id">#{{ order.id.slice(0, 8) }}</span>
                <StatusBadge :status="order.status" />
              </div>
              <ion-card-subtitle>{{ formatDate(order.createdAt) }}</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <ion-label>{{ formatMoney(order.totalPrice) }}</ion-label>
            </ion-card-content>
          </ion-card>
        </div>
        <EmptyState v-else title="Замовлень ще немає" icon="receipt-outline" />
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
  useIonRouter,
} from '@ionic/vue';
import { computed, onMounted, ref } from 'vue';

import { errorMessage } from '@/api/client';
import { getOwnerOverview } from '@/api/endpoints';
import type { OwnerOverview } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { formatDate, formatMoney, toNumber } from '@/utils/format';

const ionRouter = useIonRouter();

const overview = ref<OwnerOverview | null>(null);
const loading = ref(false);
const error = ref('');

const maxRevenue = computed(() =>
  Math.max(...(overview.value?.topProducts.map((product) => product.revenue) ?? [0]), 1),
);

function widthFor(value: number): string {
  return `${Math.max(4, Math.round((value / maxRevenue.value) * 100))}%`;
}

function openOrder(id: string): void {
  ionRouter.push(`/orders/${id}`);
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    overview.value = await getOwnerOverview();
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

onMounted(load);
</script>

<style scoped>
.state {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}
.section-title {
  margin: 20px 0 8px;
  font-size: 16px;
  font-weight: 600;
}
.section-title:first-child {
  margin-top: 0;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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
.stat-value.negative {
  color: var(--ion-color-danger, #eb445a);
}
.bar-wrap {
  width: 96px;
  height: 8px;
  border-radius: 4px;
  background: var(--ion-color-light, #e4e6eb);
  overflow: hidden;
}
.bar {
  height: 100%;
  border-radius: 4px;
  background: var(--ion-color-primary, #3880ff);
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
</style>
