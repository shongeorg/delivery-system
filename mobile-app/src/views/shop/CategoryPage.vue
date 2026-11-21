<template>
  <ion-page>
    <AppHeader :title="category?.name || 'Категорія'" back back-href="/shop" />

    <ion-content class="ion-padding">
      <ion-text v-if="category?.description"><p>{{ category.description }}</p></ion-text>

      <div v-if="loading && !products.length" class="center">
        <ion-spinner name="crescent" />
      </div>

      <EmptyState
        v-else-if="!products.length"
        tall
        icon="fast-food-outline"
        title="Товарів немає"
        subtitle="У цій категорії поки що порожньо"
      />

      <template v-else>
        <ion-grid class="ion-no-padding">
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

        <ion-infinite-scroll :disabled="!hasMore" @ionInfinite="onInfinite">
          <ion-infinite-scroll-content loading-spinner="crescent" loading-text="Завантаження..." />
        </ion-infinite-scroll>
      </template>

      <ion-text v-if="error" color="danger"><p>{{ error }}</p></ion-text>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonImg,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonPage,
  IonRow,
  IonSpinner,
  IonText,
  useIonRouter,
} from '@ionic/vue';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { errorMessage } from '@/api/client';
import { getCategory } from '@/api/endpoints';
import type { Category, Product } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import { useCartStore } from '@/stores/cart';
import { formatMoney } from '@/utils/format';

interface InfiniteScrollTarget extends HTMLElement {
  complete: () => Promise<void>;
  disabled: boolean;
}

const LIMIT = 20;

const cart = useCartStore();
const ionRouter = useIonRouter();
const route = useRoute();

const slug = String(route.params.slug);
const category = ref<Category | null>(null);
const products = ref<Product[]>([]);
const page = ref(1);
const hasMore = ref(false);
const loading = ref(true);
const error = ref('');

async function load(reset = false): Promise<void> {
  if (reset) {
    page.value = 1;
    products.value = [];
  }
  loading.value = true;
  error.value = '';
  try {
    const res = await getCategory(slug, page.value, LIMIT);
    category.value = res.category;
    products.value = reset ? (res.products ?? []) : [...products.value, ...(res.products ?? [])];
    hasMore.value = res.pagination.page < res.pagination.lastPage;
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}

async function onInfinite(event: CustomEvent<void>): Promise<void> {
  const target = event.target as unknown as InfiniteScrollTarget;
  if (hasMore.value) {
    page.value += 1;
    await load(false);
  }
  await target.complete();
}

async function addToCart(productId: string): Promise<void> {
  try {
    await cart.add(productId);
  } catch (e) {
    error.value = errorMessage(e);
  }
}

onMounted(() => {
  load(true);
  cart.fetchCart().catch(() => {});
});
</script>

<style scoped>
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
