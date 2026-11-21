<template>
  <ion-page>
    <ion-content class="ion-padding auth-content">
      <div class="auth-box">
        <h1 class="brand">Delivery System</h1>
        <p class="subtitle">Вхід до єдиного застосунку</p>

        <ion-list>
          <ion-item>
            <ion-input
              v-model="email"
              label="Email"
              label-placement="stacked"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
            />
          </ion-item>
          <ion-item>
            <ion-input
              v-model="password"
              label="Пароль"
              label-placement="stacked"
              type="password"
              autocomplete="current-password"
              @keyup.enter="onSubmit"
            />
          </ion-item>
        </ion-list>

        <ion-text v-if="error" color="danger"><p>{{ error }}</p></ion-text>

        <ion-button expand="block" :disabled="loading" @click="onSubmit">
          <ion-spinner v-if="loading" name="crescent" />
          <span v-else>Увійти</span>
        </ion-button>

        <ion-button expand="block" fill="clear" router-link="/register">
          Немає акаунта? Зареєструватися
        </ion-button>
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
import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { errorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';

const auth = useAuthStore();
const socket = useSocketStore();
const ionRouter = useIonRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function onSubmit(): Promise<void> {
  if (!email.value || !password.value) {
    error.value = 'Введіть email та пароль';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    await auth.login(email.value, password.value);
    socket.connect();
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null;
    ionRouter.replace(redirect ?? auth.homeRoute());
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
