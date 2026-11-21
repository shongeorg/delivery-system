<template>
  <ion-page>
    <AppHeader title="Фінанси" />
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh">
        <ion-refresher-content />
      </ion-refresher>

      <div class="ion-padding">
        <ion-list>
          <ion-item>
            <ion-input
              :value="from"
              type="date"
              label="Від"
              label-placement="stacked"
              @ionChange="onFromChange"
            />
          </ion-item>
          <ion-item>
            <ion-input :value="to" type="date" label="До" label-placement="stacked" @ionChange="onToChange" />
          </ion-item>
        </ion-list>

        <ion-button expand="block" class="add-button" @click="openExpenseForm">Додати витрату</ion-button>

        <div v-if="finances" class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Дохід</span>
            <span class="stat-value">{{ formatMoney(finances.totals.revenue) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Зарплати</span>
            <span class="stat-value">{{ formatMoney(finances.totals.payroll) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Витрати</span>
            <span class="stat-value">{{ formatMoney(finances.totals.expenses) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Чистий</span>
            <span class="stat-value" :class="{ negative: finances.totals.net < 0 }">
              {{ formatMoney(finances.totals.net) }}
            </span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Замовлень</span>
            <span class="stat-value">{{ finances.totals.orders }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Оплачених</span>
            <span class="stat-value">{{ finances.totals.paidOrders }}</span>
          </div>
        </div>
      </div>

      <div v-if="loading && !finances" class="state">
        <ion-spinner name="crescent" />
      </div>

      <EmptyState
        v-else-if="error"
        :title="error"
        subtitle="Перевірте з’єднання та спробуйте ще раз"
        icon="alert-circle-outline"
        tall
      />

      <template v-else-if="finances">
        <h2 class="section-title ion-padding-start ion-padding-end">Динаміка доходу</h2>
        <div v-if="finances.series.length" class="chart ion-padding-start ion-padding-end">
          <div v-for="point in finances.series" :key="point.date" class="chart-col">
            <div class="chart-bar" :style="{ height: barHeight(point.revenue) }" />
            <span class="chart-date">{{ point.date.slice(5) }}</span>
          </div>
        </div>
        <EmptyState v-else title="Немає даних за період" icon="bar-chart-outline" />

        <h2 class="section-title ion-padding-start ion-padding-end">Витрати</h2>
        <ion-list v-if="finances.expenses.length">
          <ion-item v-for="expense in finances.expenses" :key="expense.id">
            <ion-label>
              <h2>{{ expense.title }}</h2>
              <p>{{ expense.category }}<span v-if="expense.note"> · {{ expense.note }}</span></p>
              <p>{{ formatDate(expense.createdAt) }}</p>
            </ion-label>
            <ion-note slot="end">{{ formatMoney(expense.amount) }}</ion-note>
            <ion-button slot="end" fill="clear" color="danger" @click="removeExpense(expense.id)">
              <ion-icon slot="icon-only" icon="trash-outline" />
            </ion-button>
          </ion-item>
        </ion-list>
        <EmptyState v-else title="Витрат немає" subtitle="За цей період витрат не знайдено" icon="receipt-outline" tall />
      </template>
    </ion-content>

    <ion-modal :is-open="formOpen" @didDismiss="closeExpenseForm">
      <ion-header>
        <ion-toolbar>
          <ion-title>Нова витрата</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeExpenseForm">Закрити</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-list>
          <ion-item>
            <ion-input v-model="form.title" label="Назва" label-placement="stacked" />
          </ion-item>
          <ion-item>
            <ion-select
              label="Категорія"
              label-placement="stacked"
              interface="popover"
              :value="form.category"
              @ionChange="onCategoryChange"
            >
              <ion-select-option v-for="item in CATEGORIES" :key="item" :value="item">
                {{ CATEGORY_LABELS[item] }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-input v-model="form.amount" type="number" label="Сума" label-placement="stacked" />
          </ion-item>
          <ion-item>
            <ion-input v-model="form.note" label="Нотатка" label-placement="stacked" />
          </ion-item>
        </ion-list>

        <ion-text v-if="formError" color="danger"><p>{{ formError }}</p></ion-text>

        <ion-button expand="block" :disabled="saving" @click="submitExpense">Створити</ion-button>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { computed, onMounted, reactive, ref } from 'vue';

import { errorMessage } from '@/api/client';
import { createExpense, deleteExpense, getFinances } from '@/api/endpoints';
import type { FinanceResponse } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import { formatDate, formatMoney, toNumber } from '@/utils/format';

const CATEGORIES = ['supplies', 'rent', 'utilities', 'marketing', 'equipment', 'other'];
const CATEGORY_LABELS: Record<string, string> = {
  supplies: 'Постачання',
  rent: 'Оренда',
  utilities: 'Комунальні',
  marketing: 'Маркетинг',
  equipment: 'Обладнання',
  other: 'Інше',
};

function firstOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const finances = ref<FinanceResponse | null>(null);
const from = ref(firstOfMonth());
const to = ref(today());
const loading = ref(false);
const error = ref('');

const formOpen = ref(false);
const saving = ref(false);
const formError = ref('');
const form = reactive({ title: '', category: 'supplies', amount: '', note: '' });

const maxSeries = computed(() =>
  Math.max(...(finances.value?.series.map((point) => point.revenue) ?? [0]), 1),
);

function barHeight(value: number): string {
  return `${Math.max(4, Math.round((value / maxSeries.value) * 100))}%`;
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    finances.value = await getFinances(from.value || undefined, to.value || undefined);
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}

async function refresh(event: CustomEvent): Promise<void> {
  await load();
  (event.target as { complete?: () => void } | null)?.complete?.();
}

function onFromChange(event: CustomEvent): void {
  from.value = String(event.detail.value ?? '');
  void load();
}

function onToChange(event: CustomEvent): void {
  to.value = String(event.detail.value ?? '');
  void load();
}

function onCategoryChange(event: CustomEvent): void {
  form.category = String(event.detail.value ?? 'supplies');
}

function openExpenseForm(): void {
  formError.value = '';
  form.title = '';
  form.category = 'supplies';
  form.amount = '';
  form.note = '';
  formOpen.value = true;
}

function closeExpenseForm(): void {
  formOpen.value = false;
}

async function submitExpense(): Promise<void> {
  const title = form.title.trim();
  if (title.length < 2) {
    formError.value = 'Введіть назву витрати';
    return;
  }
  const amount = toNumber(form.amount);
  if (amount <= 0) {
    formError.value = 'Введіть коректну суму';
    return;
  }
  saving.value = true;
  formError.value = '';
  try {
    await createExpense({ title, category: form.category, amount, note: form.note || undefined });
    closeExpenseForm();
    await load();
  } catch (e) {
    formError.value = errorMessage(e);
  } finally {
    saving.value = false;
  }
}

async function removeExpense(id: string): Promise<void> {
  try {
    await deleteExpense(id);
    await load();
  } catch (e) {
    error.value = errorMessage(e);
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
.add-button {
  margin-top: 12px;
}
.section-title {
  margin: 20px 0 8px;
  font-size: 16px;
  font-weight: 600;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
  margin-top: 12px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: 12px;
  background: var(--ion-color-light, #f4f5f8);
}
.stat-label {
  font-size: 12px;
  opacity: 0.7;
}
.stat-value {
  font-size: 18px;
  font-weight: 700;
}
.stat-value.negative {
  color: var(--ion-color-danger, #eb445a);
}
.chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 160px;
  overflow-x: auto;
}
.chart-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-width: 24px;
  height: 100%;
  gap: 4px;
}
.chart-bar {
  width: 16px;
  border-radius: 4px 4px 0 0;
  background: var(--ion-color-primary, #3880ff);
}
.chart-date {
  font-size: 10px;
  opacity: 0.6;
}
</style>
