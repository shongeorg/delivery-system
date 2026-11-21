<template>
  <ion-chip :color="color" class="status-badge">
    <ion-label>{{ label }}</ion-label>
  </ion-chip>
</template>

<script setup lang="ts">
import { IonChip, IonLabel } from '@ionic/vue';
import { computed } from 'vue';

import type { OrderStatus } from '@/api/types';
import { statusColor, statusLabel } from '@/utils/format';

const props = defineProps<{ status: OrderStatus }>();

const label = computed(() => statusLabel(props.status));
const color = computed(() => statusColor(props.status));
</script>

<style scoped>
.status-badge {
  height: 24px;
  font-size: 12px;
}
</style>
