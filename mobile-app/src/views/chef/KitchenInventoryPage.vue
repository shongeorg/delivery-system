<template>
  <ion-page>
    <AppHeader title="Склад" />
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <ion-searchbar
        :value="search"
        placeholder="Пошук за назвою"
        @ionInput="onSearch"
      />

      <ion-text v-if="error" color="danger"><p class="ion-padding-horizontal">{{ error }}</p></ion-text>

      <div class="ion-padding">
        <EmptyState
          v-if="!filtered.length"
          title="Нічого не знайдено"
          :subtitle="inventory.length ? 'Спробуйте змінити запит' : 'Склад порожній'"
          icon="cube-outline"
        />

        <ion-list v-else>
          <ion-item v-for="item in filtered" :key="item.id">
            <ion-label>{{ item.name }}</ion-label>
            <div slot="end" class="qty-controls">
              <ion-button
                size="small"
                fill="outline"
                :disabled="busyId === item.id || item.quantity <= 0"
                @click="adjust(item, -1)"
              >
                -
              </ion-button>
              <ion-badge :color="item.quantity <= 5 ? 'danger' : 'medium'">
                {{ item.quantity }} {{ item.unit }}
              </ion-badge>
              <ion-button
                size="small"
                fill="outline"
                :disabled="busyId === item.id"
                @click="adjust(item, 1)"
              >
                +
              </ion-button>
            </div>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBadge,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonText,
} from '@ionic/vue';
import type { RefresherEventDetail, SearchbarInputEventDetail } from '@ionic/vue';
import { computed, onMounted, ref } from 'vue';

import { errorMessage } from '@/api/client';
import { listInventory, updateInventoryQuantity } from '@/api/endpoints';
import type { InventoryItem } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';

const inventory = ref<InventoryItem[]>([]);
const search = ref('');
const busyId = ref<string | null>(null);
const error = ref('');

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return inventory.value;
  return inventory.value.filter((item) => item.name.toLowerCase().includes(term));
});

async function load(): Promise<void> {
  error.value = '';
  try {
    inventory.value = await listInventory();
  } catch (e) {
    error.value = errorMessage(e);
  }
}

async function onRefresh(event: CustomEvent<RefresherEventDetail>): Promise<void> {
  await load();
  event.detail.complete();
}

function onSearch(event: CustomEvent<SearchbarInputEventDetail>): void {
  search.value = event.detail.value ?? '';
}

async function adjust(item: InventoryItem, delta: number): Promise<void> {
  const next = Math.max(0, item.quantity + delta);
  if (next === item.quantity) return;

  busyId.value = item.id;
  error.value = '';
  try {
    const updated = await updateInventoryQuantity(item.id, next);
    const idx = inventory.value.findIndex((i) => i.id === item.id);
    if (idx !== -1) inventory.value[idx] = updated;
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    busyId.value = null;
  }
}

onMounted(() => {
  void load();
});
</script>

<style scoped>
.qty-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
