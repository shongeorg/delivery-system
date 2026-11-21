<template>
  <ion-page>
    <ion-content class="ion-padding auth-content">
      <div class="auth-box">
        <h1 class="brand">Реєстрація</h1>
        <p class="subtitle">Створіть акаунт клієнта</p>

        <ion-list>
          <ion-item>
            <ion-input v-model="form.name" label="Ім’я" label-placement="stacked" placeholder="Іван" />
          </ion-item>
          <ion-item>
            <ion-input
              v-model="form.email"
              label="Email"
              label-placement="stacked"
              type="email"
              placeholder="you@example.com"
            />
          </ion-item>
          <ion-item>
            <ion-input
              v-model="form.password"
              label="Пароль"
              label-placement="stacked"
              type="password"
            />
          </ion-item>
          <ion-item>
            <ion-input v-model="form.phone" label="Телефон" label-placement="stacked" placeholder="+380..." />
          </ion-item>
          <ion-item>
            <ion-input v-model="form.address" label="Адреса" label-placement="stacked" placeholder="вул. ..." />
          </ion-item>
        </ion-list>

        <ion-text v-if="error" color="danger"><p>{{ error }}</p></ion-text>

        <ion-button expand="block" :disabled="loading" @click="onSubmit">
          <ion-spinner v-if="loading" name="crescent" />
          <span v-else>Зареєструватися</span>
        </ion-button>

        <ion-button expand="block" fill="clear" router-link="/login">Вже маю акаунт</ion-button>
      </div>
    </ion-content>
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
  IonText,
  useIonRouter,
} from '@ionic/vue';
import { reactive, ref } from 'vue';

import { errorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';

const auth = useAuthStore();
const socket = useSocketStore();
const ionRouter = useIonRouter();

const form = reactive({ name: '', email: '', password: '', phone: '', address: '' });
const loading = ref(false);
const error = ref('');

async function onSubmit(): Promise<void> {
  if (!form.name || !form.email || !form.password) {
    error.value = 'Заповніть ім’я, email та пароль';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    await auth.register({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
      address: form.address || undefined,
    });
    socket.connect();
    ionRouter.replace(auth.homeRoute());
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-content {
  display: flex;
  align-items: center;
}
.auth-box {
  width: 100%;
  max-width: 460px;
  margin: 0 auto;
}
.brand {
  text-align: center;
  margin-bottom: 4px;
}
.subtitle {
  text-align: center;
  opacity: 0.7;
  margin-top: 0;
}
</style>
