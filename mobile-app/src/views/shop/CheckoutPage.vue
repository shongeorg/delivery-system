<template>
  <ion-page>
    <AppHeader title="Оформлення" back back-href="/cart" />

    <ion-content class="ion-padding">
      <div v-if="cart.loading && !cart.items.length" class="center">
        <ion-spinner name="crescent" />
      </div>

      <EmptyState v-else-if="cart.isEmpty" tall icon="cart-outline" title="Кошик порожній">
        <ion-button router-link="/shop">До каталогу</ion-button>
      </EmptyState>

      <template v-else>
        <h3>Тип доставки</h3>
        <ion-segment v-model="deliveryType">
          <ion-segment-button value="delivery">
            <ion-label>Доставка</ion-label>
          </ion-segment-button>
          <ion-segment-button value="pickup">
            <ion-label>Самовивіз</ion-label>
          </ion-segment-button>
        </ion-segment>

        <ion-list v-if="deliveryType === 'delivery'">
          <ion-item>
            <ion-textarea
              v-model="address"
              label="Адреса доставки"
              label-placement="stacked"
              :rows="2"
              placeholder="Вулиця, будинок, квартира, місто"
            />
          </ion-item>
          <ion-item lines="none">
            <ion-button fill="outline" size="small" :disabled="locating" @click="determineLocation">
              <ion-icon slot="start" :icon="locationOutline" />
              {{ locating ? 'Визначення...' : 'Визначити на карті' }}
            </ion-button>
          </ion-item>
          <ion-item lines="none">
            <ion-note v-if="locationNote">{{ locationNote }}</ion-note>
          </ion-item>
        </ion-list>

        <ion-list>
          <ion-item>
            <ion-input
              v-model="phone"
              label="Телефон"
              label-placement="stacked"
              type="tel"
              placeholder="+380..."
            />
          </ion-item>
        </ion-list>

        <h3>Оплата</h3>
        <ion-segment v-model="paymentType">
          <ion-segment-button value="card">
            <ion-label>Картка</ion-label>
          </ion-segment-button>
          <ion-segment-button value="cash">
            <ion-label>Готівка</ion-label>
          </ion-segment-button>
        </ion-segment>

        <div v-show="paymentType === 'card'" class="card-holder">
          <p v-if="!hasStripeKey" class="hint">
            Оплата карткою не налаштована. Оберіть готівку.
          </p>
          <div v-else ref="cardMount" class="card-mount"></div>
        </div>

        <ion-list class="summary-list">
          <ion-item v-for="item in cart.items" :key="item.id">
            <ion-label>
              {{ item.product?.name }} × {{ item.quantity }}
            </ion-label>
            <ion-note slot="end">{{ formatMoney(item.product?.price) }}</ion-note>
          </ion-item>
        </ion-list>

        <div class="total-row">
          <span>Разом:</span>
          <strong>{{ formatMoney(cart.total) }}</strong>
        </div>

        <ion-text v-if="error" color="danger"><p>{{ error }}</p></ion-text>

        <ion-button expand="block" :disabled="loading" @click="submit">
          <ion-spinner v-if="loading" name="crescent" />
          <span v-else>Підтвердити замовлення</span>
        </ion-button>
        <ion-note v-if="loading && step">{{ step }}</ion-note>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTextarea,
  useIonRouter,
} from '@ionic/vue';
import type { Stripe, StripeCardElement } from '@stripe/stripe-js';
import { locationOutline } from 'ionicons/icons';
import { nextTick, onMounted, ref } from 'vue';

import { errorMessage, STRIPE_PUBLISHABLE_KEY } from '@/api/client';
import { confirmPayment, createOrder, createPaymentIntent, geocode } from '@/api/endpoints';
import type { CreateOrderPayload, DeliveryType, PaymentType } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { useLocationStore } from '@/stores/location';
import { formatMoney } from '@/utils/format';

const auth = useAuthStore();
const cart = useCartStore();
const location = useLocationStore();
const ionRouter = useIonRouter();

const deliveryType = ref<DeliveryType>('delivery');
const paymentType = ref<PaymentType>('card');
const address = ref('');
const phone = ref('');
const lat = ref<number | null>(null);
const lng = ref<number | null>(null);
const locating = ref(false);
const locationNote = ref('');
const loading = ref(false);
const error = ref('');
const step = ref('');

const hasStripeKey = Boolean(STRIPE_PUBLISHABLE_KEY);
const cardMount = ref<HTMLDivElement | null>(null);
let stripe: Stripe | null = null;
let cardElement: StripeCardElement | null = null;

async function mountCard(): Promise<void> {
  if (!stripe || !cardMount.value || cardElement) return;
  cardElement = stripe.elements().create('card');
  cardElement.mount(cardMount.value);
}

async function determineLocation(): Promise<void> {
  locating.value = true;
  locationNote.value = '';
  try {
    const pos = await location.getCurrentPosition();
    lat.value = pos.lat;
    lng.value = pos.lng;
    locationNote.value = 'Точку доставки збережено';
  } catch {
    if (address.value.trim()) {
      try {
        const res = await geocode(address.value.trim());
        lat.value = res.lat;
        lng.value = res.lng;
        locationNote.value = 'Координати визначено з адреси';
      } catch (e) {
        locationNote.value = errorMessage(e);
      }
    } else {
      locationNote.value = 'Вкажіть адресу, щоб визначити координати';
    }
  } finally {
    locating.value = false;
  }
}

async function submit(): Promise<void> {
  error.value = '';
  if (cart.isEmpty) {
    error.value = 'Кошик порожній';
    return;
  }
  if (deliveryType.value === 'delivery' && address.value.trim().length < 5) {
    error.value = 'Вкажіть коректну адресу доставки';
    return;
  }
  if (phone.value.trim().length < 5) {
    error.value = 'Вкажіть коректний телефон';
    return;
  }

  loading.value = true;
  step.value = 'Створення замовлення...';
  try {
    if (deliveryType.value === 'delivery' && lat.value === null && address.value.trim()) {
      try {
        const res = await geocode(address.value.trim());
        lat.value = res.lat;
        lng.value = res.lng;
      } catch {
        /* координати не обов'язкові */
      }
    }

    const isDelivery = deliveryType.value === 'delivery';
    const payload: CreateOrderPayload = {
      deliveryType: deliveryType.value,
      address: isDelivery ? address.value.trim() : undefined,
      phone: phone.value.trim(),
      paymentType: paymentType.value,
      lat: isDelivery ? (lat.value ?? undefined) : undefined,
      lng: isDelivery ? (lng.value ?? undefined) : undefined,
      items: cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    };

    const order = await createOrder(payload);

    if (paymentType.value === 'card') {
      step.value = 'Підготовка оплати...';
      const intent = await createPaymentIntent(order.id);

      if (stripe && cardElement) {
        step.value = 'Обробка оплати...';
        const result = await stripe.confirmCardPayment(intent.clientSecret, {
          payment_method: { card: cardElement },
        });
        if (result.error) {
          throw new Error(result.error.message ?? 'Оплату не завершено');
        }
        if (result.paymentIntent) {
          await confirmPayment(order.id, result.paymentIntent.id);
        }
      } else {
        await confirmPayment(order.id, intent.paymentIntentId);
      }
    }

    step.value = 'Завершення...';
    await cart.clear();
    ionRouter.replace('/orders/' + order.id);
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
    step.value = '';
  }
}

onMounted(async () => {
  phone.value = auth.user?.phone ?? '';
  address.value = auth.user?.address ?? '';
  cart.fetchCart().catch(() => {});

  if (hasStripeKey) {
    try {
      const { loadStripe } = await import('@stripe/stripe-js');
      stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
      await nextTick();
      await mountCard();
    } catch {
      stripe = null;
    }
  }
});
</script>

<style scoped>
h3 {
  margin: 16px 0 8px;
}
.center {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}
.card-holder {
  margin-top: 12px;
}
.card-mount {
  border: 1px solid var(--ion-color-medium);
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}
.hint {
  color: var(--ion-color-danger);
  font-size: 14px;
}
.summary-list {
  margin-top: 16px;
}
.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 18px;
  margin: 12px 0;
}
</style>
