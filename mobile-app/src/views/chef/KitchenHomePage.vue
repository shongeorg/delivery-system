<template>
  <ion-page>
    <AppHeader title="Кухня" />
    <ion-content class="ion-padding">
      <ion-grid>
        <ion-row>
          <ion-col size="6">
            <ion-card class="stat-card">
              <ion-card-content>
                <div class="stat-value">{{ counts.paid }}</div>
                <div class="stat-label">Нові</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6">
            <ion-card class="stat-card">
              <ion-card-content>
                <div class="stat-value">{{ counts.cooking }}</div>
                <div class="stat-label">Готуються</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
        <ion-row>
          <ion-col size="6">
            <ion-card class="stat-card">
              <ion-card-content>
                <div class="stat-value">{{ counts.ready }}</div>
                <div class="stat-label">Готові до видачі</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="6">
            <ion-card class="stat-card">
              <ion-card-content>
                <div class="stat-value">{{ counts.onTheWay }}</div>
                <div class="stat-label">В дорозі</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>

      <ion-text v-if="error" color="danger"><p>{{ error }}</p></ion-text>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Низький залишок</ion-card-title>
        </ion-card-header>
        <ion-list v-if="lowStock.length">
          <ion-item v-for="item in lowStock" :key="item.id">
            <ion-label>{{ item.name }}</ion-label>
            <ion-badge slot="end" color="danger">{{ item.quantity }} {{ item.unit }}</ion-badge>
          </ion-item>
        </ion-list>
        <ion-card-content v-else>
          <ion-text color="medium"><p>Усі позиції достатньо забезпечені.</p></ion-text>
        </ion-card-content>
      </ion-card>

      <ion-button expand="block" router-link="/kitchen/orders">Черга замовлень</ion-button>
      <ion-button expand="block" fill="outline" router-link="/kitchen/inventory">Склад</ion-button>
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
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRow,
  IonText,
} from '@ionic/vue';
import { computed, onMounted, ref } from 'vue';

import { errorMessage } from '@/api/client';
import { listInventory } from '@/api/endpoints';
import type { InventoryItem } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import { useOrderStore } from '@/stores/order';

const orderStore = useOrderStore();

const inventory = ref<InventoryItem[]>([]);
const error = ref('');

const counts = computed(() => ({
  paid: orderStore.staffOrders.filter((o) => o.status === 'paid').length,
  cooking: orderStore.staffOrders.filter((o) => o.status === 'cooking').length,
  ready: orderStore.staffOrders.filter((o) => o.status === 'ready').length,
  onTheWay: orderStore.staffOrders.filter((o) => o.status === 'on_the_way').length,
}));

const lowStock = computed(() =>
  [...inventory.value]
    .filter((item) => item.quantity <= 5)
    .sort((a, b) => a.quantity - b.quantity),
);

onMounted(async () => {
  error.value = '';
  try {
    await orderStore.fetchStaffOrders();
    inventory.value = await listInventory();
  } catch (e) {
    error.value = errorMessage(e);
  }
});
</script>

<style scoped>
.stat-card {
  margin: 0;
  text-align: center;
}
.stat-value {
  font-size: 32px;
  font-weight: 700;
}
.stat-label {
  font-size: 13px;
  opacity: 0.7;
}
</style>
