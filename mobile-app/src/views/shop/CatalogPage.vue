<template>
  <ion-page>
    <AppHeader title="Каталог">
      <template #end>
        <ion-button router-link="/cart" fill="clear" color="light" class="cart-btn">
          <ion-icon :icon="cartOutline" />
          <ion-badge v-if="cart.count > 0" color="danger" class="cart-badge">{{ cart.count }}</ion-badge>
        </ion-button>
      </template>
    </AppHeader>

    <ion-content class="ion-padding">
      <div v-if="categories.length" class="chips-row">
        <ion-chip
          v-for="category in categories"
          :key="category.id"
          @click="ionRouter.push('/shop/category/' + category.slug)"
        >
          <ion-label>{{ category.name }}</ion-label>
        </ion-chip>
      </div>

      <div v-if="loading" class="center">
        <ion-spinner name="crescent" />
      </div>

      <EmptyState
        v-else-if="!products.length"
        tall
        icon="fast-food-outline"
        title="Товарів поки немає"
        subtitle="Загляньте пізніше"
      />

      <ion-grid v-else class="ion-no-padding">
        <ion-row>
          <ion-col v-for="product in products" :key="product.id" size="6">
            <ion-card @click="ionRouter.push('/shop/product/' + product.slug)">
              <ion-img v-if="product.cover" :src="product.cover" class="cover" />
              <ion-card-header>
                <ion-card-title class="product-title">{{ product.name }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p class="price">{{ formatMoney(product.price) }}</p>
                <ion-button size="small" expand="block" @click.stop="addToCart(product.id)">
                  Додати
                </ion-button>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>

      <ion-text v-if="error" color="danger"><p>{{ error }}</p></ion-text>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonCol,
  IonContent,
  IonGrid,
  IonIcon,
  IonImg,
  IonLabel,
  IonPage,
  IonRow,
  IonSpinner,
  IonText,
  useIonRouter,
} from '@ionic/vue';
import { cartOutline } from 'ionicons/icons';
import { onMounted, ref } from 'vue';

import { errorMessage } from '@/api/client';
import { listCategories, listProducts } from '@/api/endpoints';
import type { Category, Product } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import { useCartStore } from '@/stores/cart';
import { formatMoney } from '@/utils/format';

const cart = useCartStore();
const ionRouter = useIonRouter();

const categories = ref<Category[]>([]);
const products = ref<Product[]>([]);
const loading = ref(true);
const error = ref('');

async function load(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    const [cats, res] = await Promise.all([listCategories(), listProducts(1, 30)]);
    categories.value = cats ?? [];
    products.value = res.products ?? [];
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}

async function addToCart(productId: string): Promise<void> {
  try {
    await cart.add(productId);
  } catch (e) {
    error.value = errorMessage(e);
  }
}

onMounted(() => {
  load();
  cart.fetchCart().catch(() => {});
});
</script>

<style scoped>
.chips-row {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 8px;
}
.cart-btn {
  position: relative;
}
.cart-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 10px;
}
.cover {
  height: 120px;
  object-fit: cover;
}
.product-title {
  font-size: 15px;
}
.price {
  font-weight: 600;
  margin: 0 0 8px;
}
.center {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}
</style>
