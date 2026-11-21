<template>
  <div class="empty-state" :style="{ padding: tall ? '48px 16px' : '16px' }">
    <ion-icon :icon="icon" size="large" color="medium" />
    <p class="title">{{ title }}</p>
    <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue';

withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    icon?: string;
    tall?: boolean;
  }>(),
  { icon: 'information-circle-outline', subtitle: '', tall: false },
);
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 6px;
}
.empty-state .title {
  margin: 4px 0 0;
  font-weight: 600;
}
.empty-state .subtitle {
  margin: 0;
  font-size: 13px;
  opacity: 0.7;
}
</style>
