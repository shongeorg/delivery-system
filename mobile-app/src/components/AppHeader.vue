<template>
  <ion-header>
    <ion-toolbar color="primary">
      <ion-buttons slot="start">
        <ion-back-button v-if="back" :default-href="backHref" />
        <ion-menu-button v-else />
      </ion-buttons>
      <ion-title>{{ title }}</ion-title>
      <ion-buttons slot="end">
        <slot name="end" />
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonButtons,
  IonHeader,
  IonMenuButton,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';

withDefaults(
  defineProps<{
    title: string;
    back?: boolean;
    backHref?: string;
  }>(),
  { back: false, backHref: '/shop' },
);
</script>
