<template>
  <ion-page>
    <AppHeader title="Налаштування" />
    <ion-content>
      <div v-if="loading && !loaded" class="state">
        <ion-spinner name="crescent" />
      </div>

      <EmptyState
        v-else-if="error"
        :title="error"
        subtitle="Перевірте з’єднання та спробуйте ще раз"
        icon="alert-circle-outline"
        tall
      />

      <div v-else class="ion-padding">
        <ion-list>
          <ion-item>
            <ion-input v-model="form.name" label="Назва" label-placement="stacked" />
          </ion-item>
          <ion-item>
            <ion-input v-model="form.phone" label="Телефон" label-placement="stacked" />
          </ion-item>
          <ion-item>
            <ion-input v-model="form.address" label="Адреса" label-placement="stacked" />
          </ion-item>
          <ion-item>
            <ion-input v-model="form.workingHours" label="Години роботи" label-placement="stacked" />
          </ion-item>
          <ion-item>
            <ion-input v-model="form.currency" label="Валюта" label-placement="stacked" />
          </ion-item>
          <ion-item>
            <ion-input v-model="form.taxRate" type="number" label="Податок, %" label-placement="stacked" />
          </ion-item>
          <ion-item>
            <ion-input v-model="form.deliveryFee" type="number" label="Вартість доставки" label-placement="stacked" />
          </ion-item>
        </ion-list>

        <ion-button expand="block" :disabled="saving" @click="save">Зберегти</ion-button>
      </div>
    </ion-content>

    <ion-toast
      :is-open="toastOpen"
      :message="toastMessage"
      :color="toastColor"
      duration="2500"
      @didDismiss="toastOpen = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonSpinner,
  IonToast,
} from '@ionic/vue';
import { onMounted, reactive, ref } from 'vue';

import { errorMessage } from '@/api/client';
import { getSettings, updateSettings } from '@/api/endpoints';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import { toNumber } from '@/utils/format';

const form = reactive({
  name: '',
  phone: '',
  address: '',
  workingHours: '',
  currency: 'UAH',
  taxRate: '0',
  deliveryFee: '0',
});

const loading = ref(false);
const loaded = ref(false);
const saving = ref(false);
const error = ref('');

const toastOpen = ref(false);
const toastMessage = ref('');
const toastColor = ref<'success' | 'danger'>('success');

function showToast(message: string, color: 'success' | 'danger'): void {
  toastMessage.value = message;
  toastColor.value = color;
  toastOpen.value = true;
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    const settings = await getSettings();
    form.name = settings.name ?? '';
    form.phone = settings.phone ?? '';
    form.address = settings.address ?? '';
    form.workingHours = settings.workingHours ?? '';
    form.currency = settings.currency ?? 'UAH';
    form.taxRate = String(settings.taxRate ?? 0);
    form.deliveryFee = String(settings.deliveryFee ?? 0);
    loaded.value = true;
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}

async function save(): Promise<void> {
  saving.value = true;
  try {
    await updateSettings({
      name: form.name,
      phone: form.phone,
      address: form.address,
      workingHours: form.workingHours,
      currency: form.currency,
      taxRate: toNumber(form.taxRate),
      deliveryFee: toNumber(form.deliveryFee),
    });
    showToast('Налаштування збережено', 'success');
  } catch (e) {
    showToast(errorMessage(e), 'danger');
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.state {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}
</style>
