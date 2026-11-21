<template>
  <ion-page>
    <AppHeader title="Профіль" />
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>{{ auth.user?.name }}</ion-card-title>
          <ion-card-subtitle>{{ roleLabel }} · {{ auth.user?.email }}</ion-card-subtitle>
        </ion-card-header>
      </ion-card>

      <ion-list>
        <ion-item>
          <ion-input v-model="form.name" label="Ім’я" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input v-model="form.phone" label="Телефон" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input v-model="form.address" label="Адреса" label-placement="stacked" />
        </ion-item>
      </ion-list>

      <ion-text v-if="message" :color="messageColor"><p>{{ message }}</p></ion-text>

      <ion-button expand="block" :disabled="saving" @click="save">Зберегти</ion-button>
      <ion-button expand="block" color="danger" fill="outline" @click="onLogout">Вийти</ion-button>

      <ion-button expand="block" fill="clear" router-link="/orders" v-if="auth.isCustomer || auth.isOwner">
        Мої замовлення
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonText,
  useIonRouter,
} from '@ionic/vue';
import { computed, onMounted, reactive, ref } from 'vue';

import { errorMessage } from '@/api/client';
import AppHeader from '@/components/AppHeader.vue';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';
import { ROLE_LABELS } from '@/utils/format';

const auth = useAuthStore();
const socket = useSocketStore();
const ionRouter = useIonRouter();

const form = reactive({ name: '', phone: '', address: '' });
const saving = ref(false);
const message = ref('');
const messageColor = ref<'success' | 'danger'>('success');

const roleLabel = computed(() => ROLE_LABELS[auth.role ?? 'customer'] ?? '');

onMounted(() => {
  form.name = auth.user?.name ?? '';
  form.phone = auth.user?.phone ?? '';
  form.address = auth.user?.address ?? '';
});

async function save(): Promise<void> {
  saving.value = true;
  message.value = '';
  try {
    await auth.updateProfile({ name: form.name, phone: form.phone, address: form.address });
    messageColor.value = 'success';
    message.value = 'Профіль оновлено';
  } catch (e) {
    messageColor.value = 'danger';
    message.value = errorMessage(e);
  } finally {
    saving.value = false;
  }
}

function onLogout(): void {
  socket.disconnect();
  auth.logout();
  ionRouter.replace('/login');
}
</script>
