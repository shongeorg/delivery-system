<template>
  <ion-page>
    <AppHeader title="Товар" back back-href="/shop" />

    <ion-content class="ion-padding">
      <div v-if="loading" class="center">
        <ion-spinner name="crescent" />
      </div>

      <EmptyState
        v-else-if="!product"
        tall
        icon="alert-circle-outline"
        title="Товар не знайдено"
      />

      <template v-else>
        <ion-img v-if="product.cover" :src="product.cover" class="cover" />

        <h2 class="name">{{ product.name }}</h2>
        <p class="price">{{ formatMoney(product.price) }}</p>

        <p v-if="product.description" class="description">{{ product.description }}</p>

        <div v-if="product.categories?.length" class="chips-row">
          <ion-chip v-for="c in product.categories" :key="c.id">
            <ion-label>{{ c.name }}</ion-label>
          </ion-chip>
        </div>

        <div v-if="product.tags?.length" class="chips-row">
          <ion-chip v-for="t in product.tags" :key="t.id" color="medium">
            <ion-label>#{{ t.name }}</ion-label>
          </ion-chip>
        </div>

        <div v-if="product.ingredients?.length" class="section">
          <h3>Склад</h3>
          <ion-list lines="none">
            <ion-item v-for="(ing, idx) in product.ingredients" :key="ing.id ?? idx">
              <ion-label>{{ ing.name }}</ion-label>
              <ion-note slot="end">{{ ing.quantity }} {{ ing.unit }}</ion-note>
            </ion-item>
          </ion-list>
        </div>

        <div class="qty-row">
          <ion-button fill="outline" size="small" @click="decrement">-</ion-button>
          <ion-input
            type="number"
            class="qty-input"
            :value="String(quantity)"
            @ionInput="onQtyInput"
          />
          <ion-button fill="outline" size="small" @click="increment">+</ion-button>
        </div>

        <ion-button expand="block" :disabled="adding" @click="addToCart">
          <ion-spinner v-if="adding" name="crescent" />
          <span v-else>Додати в кошик · {{ formatMoney(unitTotal) }}</span>
        </ion-button>

        <ion-text v-if="error" color="danger"><p>{{ error }}</p></ion-text>

        <div class="section">
          <h3>Відгуки</h3>

          <EmptyState
            v-if="!reviews.length"
            icon="chatbubble-outline"
            title="Ще немає відгуків"
            subtitle="Будьте першим"
          />

          <ion-list v-else lines="full">
            <ion-item v-for="review in reviews" :key="review.id">
              <ion-label>
                <div class="stars">
                  <ion-icon
                    v-for="i in 5"
                    :key="i"
                    :icon="i <= review.rating ? star : starOutline"
                    :color="i <= review.rating ? 'warning' : 'medium'"
                  />
                </div>
                <p class="review-text">{{ review.text }}</p>
                <p class="review-meta">
                  {{ review.user?.name || 'Користувач' }} · {{ formatDate(review.createdAt) }}
                </p>
              </ion-label>
            </ion-item>
          </ion-list>

          <ion-list>
            <ion-item>
              <ion-select
                v-model="reviewRating"
                label="Оцінка"
                label-placement="stacked"
                interface="popover"
              >
                <ion-select-option v-for="n in 5" :key="n" :value="n">{{ n }}</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-textarea
                v-model="reviewText"
                label="Коментар"
                label-placement="stacked"
                :rows="3"
                placeholder="Ваш відгук..."
              />
            </ion-item>
          </ion-list>

          <ion-button
            expand="block"
            fill="outline"
            :disabled="submitting || !reviewText.trim()"
            @click="submitReview"
          >
            <ion-spinner v-if="submitting" name="crescent" />
            <span v-else>Надіслати</span>
          </ion-button>
        </div>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonChip,
  IonContent,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTextarea,
  toastController,
} from '@ionic/vue';
import { star, starOutline } from 'ionicons/icons';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { errorMessage } from '@/api/client';
import { createReview, getProduct, listProductReviews } from '@/api/endpoints';
import type { Product, Review } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import { useCartStore } from '@/stores/cart';
import { formatDate, formatMoney, toNumber } from '@/utils/format';

const cart = useCartStore();
const route = useRoute();

const slug = String(route.params.slug);
const product = ref<Product | null>(null);
const reviews = ref<Review[]>([]);
const quantity = ref(1);
const loading = ref(true);
const adding = ref(false);
const submitting = ref(false);
const error = ref('');
const reviewRating = ref(5);
const reviewText = ref('');

const unitTotal = computed(() => formatMoney(toNumber(product.value?.price) * quantity.value));

function increment(): void {
  quantity.value += 1;
}

function decrement(): void {
  quantity.value = Math.max(1, quantity.value - 1);
}

function onQtyInput(event: CustomEvent<{ value?: string | null }>): void {
  const parsed = parseInt(String(event.detail.value ?? ''), 10);
  quantity.value = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

async function loadProduct(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    product.value = await getProduct(slug);
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}

async function loadReviews(): Promise<void> {
  if (!product.value) return;
  try {
    reviews.value = await listProductReviews(product.value.id);
  } catch (e) {
    error.value = errorMessage(e);
  }
}

async function addToCart(): Promise<void> {
  if (!product.value) return;
  adding.value = true;
  error.value = '';
  try {
    await cart.add(product.value.id, quantity.value);
    const toast = await toastController.create({
      message: 'Додано до кошика',
      duration: 1500,
      position: 'bottom',
      color: 'success',
    });
    await toast.present();
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    adding.value = false;
  }
}

async function submitReview(): Promise<void> {
  if (!product.value || !reviewText.value.trim()) return;
  submitting.value = true;
  error.value = '';
  try {
    await createReview({
      productId: product.value.id,
      rating: reviewRating.value,
      text: reviewText.value.trim(),
    });
    reviewText.value = '';
    reviewRating.value = 5;
    await loadReviews();
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  await loadProduct();
  await loadReviews();
});
</script>

<style scoped>
.cover {
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border-radius: 12px;
}
.name {
  margin: 12px 0 4px;
}
.price {
  font-size: 20px;
  font-weight: 700;
  color: var(--ion-color-primary);
  margin: 0 0 12px;
}
.description {
  opacity: 0.85;
}
.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}
.section {
  margin-top: 20px;
}
.qty-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}
.qty-input {
  max-width: 72px;
  text-align: center;
  border: 1px solid var(--ion-color-medium);
  border-radius: 8px;
}
.stars {
  display: flex;
  gap: 2px;
  margin-bottom: 4px;
}
.review-text {
  margin: 4px 0;
}
.review-meta {
  font-size: 12px;
  opacity: 0.7;
  margin: 0;
}
.center {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}
</style>
