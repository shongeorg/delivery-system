<template>
  <ion-page>
    <AppHeader title="Кошик" back back-href="/shop" />

    <ion-content class="ion-padding">
      <div v-if="cart.loading && !cart.items.length" class="center">
        <ion-spinner name="crescent" />
      </div>

      <EmptyState
        v-else-if="cart.isEmpty"
        tall
        icon="cart-outline"
        title="Кошик порожній"
        subtitle="Додайте товари з каталогу"
      >
        <ion-button router-link="/shop">До каталогу</ion-button>
      </EmptyState>

      <template v-else>
        <ion-list>
          <ion-item v-for="item in cart.items" :key="item.id">
            <ion-label>
              <h3>{{ item.product?.name }}</h3>
              <p>{{ formatMoney(item.product?.price) }}</p>
            </ion-label>
            <div class="stepper">
              <ion-button fill="clear" size="small" @click="changeQty(item.id, item.quantity - 1)">
                <ion-icon slot="icon-only" :icon="removeOutline" />
              </ion-button>
              <span class="qty">{{ item.quantity }}</span>
              <ion-button fill="clear" size="small" @click="changeQty(item.id, item.quantity + 1)">
                <ion-icon slot="icon-only" :icon="addOutline" />
              </ion-button>
              <ion-button fill="clear" size="small" color="danger" @click="removeItem(item.id)">
                <ion-icon slot="icon-only" :icon="trashOutline" />
              </ion-button>
            </div>
          </ion-item>
        </ion-list>

        <div class="summary">
          <div class="total-row">
            <span>Разом:</span>
            <strong>{{ formatMoney(cart.total) }}</strong>
          </div>
          <ion-button expand="block" :disabled="cart.isEmpty" router-link="/checkout">
            Оформити замовлення
          </ion-button>
        </div>

        <ion-text v-if="error" color="danger"><p>{{ error }}</p></ion-text>
      </template>
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
  IonSpinner,
  IonText,
} from '@ionic/vue';
import { addOutline, removeOutline, trashOutline } from 'ionicons/icons';
import { onMounted, ref } from 'vue';

import { errorMessage } from '@/api/client';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import { useCartStore } from '@/stores/cart';
import { formatMoney } from '@/utils/format';

const cart = useCartStore();
const error = ref('');

async function changeQty(itemId: string, quantity: number): Promise<void> {
  error.value = '';
  try {
    await cart.update(itemId, quantity);
  } catch (e) {
    error.value = errorMessage(e);
  }
}

async function removeItem(itemId: string): Promise<void> {
  error.value = '';
  try {
    await cart.remove(itemId);
  } catch (e) {
    error.value = errorMessage(e);
  }
}

onMounted(() => {
  cart.fetchCart().catch((e) => {
    error.value = errorMessage(e);
  });
});
</script>

<style scoped>
.stepper {
  display: flex;
  align-items: center;
}
.qty {
  min-width: 24px;
  text-align: center;
  font-weight: 600;
}
.summary {
  margin-top: 20px;
}
.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 18px;
  margin-bottom: 12px;
}
.center {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}
</style>
