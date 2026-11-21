<template>
  <ion-page>
    <AppHeader title="Журнал дій">
      <template #end>
        <ion-button :disabled="loading" @click="load">
          <ion-icon slot="icon-only" icon="refresh-outline" />
        </ion-button>
      </template>
    </AppHeader>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh">
        <ion-refresher-content />
      </ion-refresher>

      <div v-if="loading && !logs.length" class="state">
        <ion-spinner name="crescent" />
      </div>

      <EmptyState
        v-else-if="error"
        :title="error"
        subtitle="Перевірте з’єднання та спробуйте ще раз"
        icon="alert-circle-outline"
        tall
      />

      <ion-list v-else-if="logs.length">
        <ion-item v-for="log in logs" :key="log.id">
          <ion-label>
            <h2>{{ log.action }}</h2>
            <p>
              {{ log.entity }}
              <span v-if="log.entityId"> · {{ log.entityId.slice(0, 8) }}</span>
            </p>
            <p v-if="log.details" class="details">{{ formatDetails(log.details) }}</p>
            <p>{{ log.user?.name ?? 'Невідомий' }} · {{ formatDate(log.createdAt) }}</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <EmptyState
        v-else
        title="Записів немає"
        subtitle="Журнал дій порожній"
        icon="document-text-outline"
        tall
      />
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
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from '@ionic/vue';
import { onMounted, onUnmounted, ref } from 'vue';

import { errorMessage } from '@/api/client';
import { getAuditLogs } from '@/api/endpoints';
import type { AuditLogEntry } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import { formatDate } from '@/utils/format';

const logs = ref<AuditLogEntry[]>([]);
const loading = ref(false);
const error = ref('');
let timer: ReturnType<typeof setInterval> | null = null;

function formatDetails(details: string | null | undefined): string {
  if (!details) return '—';
  try {
    return JSON.stringify(JSON.parse(details));
  } catch {
    return details;
  }
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    logs.value = await getAuditLogs();
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
  }, 30000);
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
.details {
  font-family: monospace;
  font-size: 11px;
  word-break: break-word;
}
</style>
