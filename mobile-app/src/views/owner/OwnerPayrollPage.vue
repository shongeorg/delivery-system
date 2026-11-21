<template>
  <ion-page>
    <AppHeader title="Зарплати" />
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh">
        <ion-refresher-content />
      </ion-refresher>

      <div class="ion-padding">
        <ion-item>
          <ion-input
            :value="period"
            type="month"
            label="Період (YYYY-MM)"
            label-placement="stacked"
            @ionChange="onPeriodChange"
          />
        </ion-item>

        <ion-button expand="block" class="add-button" @click="openForm">Додати виплату</ion-button>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Зарплати</span>
            <span class="stat-value">{{ formatMoney(payroll?.totals.salary ?? 0) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Бонуси</span>
            <span class="stat-value">{{ formatMoney(payroll?.totals.bonus ?? 0) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Усього</span>
            <span class="stat-value">{{ formatMoney(payroll?.totals.all ?? 0) }}</span>
          </div>
        </div>
      </div>

      <div v-if="loading && !payroll" class="state">
        <ion-spinner name="crescent" />
      </div>

      <EmptyState
        v-else-if="error"
        :title="error"
        subtitle="Перевірте з’єднання та спробуйте ще раз"
        icon="alert-circle-outline"
        tall
      />

      <ion-list v-else-if="payroll && payroll.payments.length">
        <ion-item v-for="payment in payroll.payments" :key="payment.id">
          <ion-label>
            <h2>{{ payment.user?.name ?? 'Невідомий' }}</h2>
            <p>
              {{ payment.type === 'bonus' ? 'Бонус' : 'Зарплата' }}
              <span v-if="payment.period"> · {{ payment.period }}</span>
            </p>
            <p v-if="payment.note">{{ payment.note }}</p>
            <p>{{ formatDate(payment.createdAt) }}</p>
          </ion-label>
          <ion-note slot="end">{{ formatMoney(payment.amount) }}</ion-note>
        </ion-item>
      </ion-list>

      <EmptyState v-else title="Виплат немає" subtitle="За цей період виплат не знайдено" icon="cash-outline" tall />
    </ion-content>

    <ion-modal :is-open="formOpen" @didDismiss="closeForm">
      <ion-header>
        <ion-toolbar>
          <ion-title>Нова виплата</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeForm">Закрити</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-list>
          <ion-item>
            <ion-select
              label="Співробітник"
              label-placement="stacked"
              interface="popover"
              :value="form.userId"
              @ionChange="onUserChange"
            >
              <ion-select-option v-for="member in employees" :key="member.id" :value="member.id">
                {{ member.name }} · {{ ROLE_LABELS[member.role] }}
              </ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-input v-model="form.amount" type="number" label="Сума" label-placement="stacked" />
          </ion-item>

          <ion-item>
            <ion-label>Тип</ion-label>
            <ion-segment :value="form.type" @ionChange="onTypeChange">
              <ion-segment-button value="salary">Зарплата</ion-segment-button>
              <ion-segment-button value="bonus">Бонус</ion-segment-button>
            </ion-segment>
          </ion-item>

          <ion-item>
            <ion-input v-model="form.period" type="month" label="Період (YYYY-MM)" label-placement="stacked" />
          </ion-item>

          <ion-item>
            <ion-input v-model="form.note" label="Нотатка" label-placement="stacked" />
          </ion-item>
        </ion-list>

        <ion-text v-if="formError" color="danger"><p>{{ formError }}</p></ion-text>

        <ion-button expand="block" :disabled="saving" @click="submitForm">Створити</ion-button>
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
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { computed, onMounted, reactive, ref } from 'vue';

import { errorMessage } from '@/api/client';
import { createPayrollPayment, getPayroll, listStaff } from '@/api/endpoints';
import type { PayrollResponse, StaffMember } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import { formatDate, formatMoney, ROLE_LABELS, toNumber } from '@/utils/format';

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

const payroll = ref<PayrollResponse | null>(null);
const period = ref(currentPeriod());
const loading = ref(false);
const error = ref('');

const staff = ref<StaffMember[]>([]);
const formOpen = ref(false);
const saving = ref(false);
const formError = ref('');
const form = reactive({
  userId: '',
  amount: '',
  type: 'salary' as 'salary' | 'bonus',
  period: currentPeriod(),
  note: '',
});

const employees = computed(() => staff.value.filter((member) => member.role !== 'customer'));

async function load(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    payroll.value = await getPayroll(period.value || undefined);
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

function onPeriodChange(event: CustomEvent): void {
  period.value = String(event.detail.value ?? '');
  void load();
}

function onUserChange(event: CustomEvent): void {
  form.userId = String(event.detail.value ?? '');
}

function onTypeChange(event: CustomEvent): void {
  form.type = event.detail.value as 'salary' | 'bonus';
}

function openForm(): void {
  formError.value = '';
  form.userId = '';
  form.amount = '';
  form.type = 'salary';
  form.period = currentPeriod();
  form.note = '';
  formOpen.value = true;
}

function closeForm(): void {
  formOpen.value = false;
}

async function submitForm(): Promise<void> {
  if (!form.userId) {
    formError.value = 'Оберіть співробітника';
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
    await createPayrollPayment({
      userId: form.userId,
      amount,
      type: form.type,
      period: form.period || undefined,
      note: form.note || undefined,
    });
    closeForm();
    await load();
  } catch (e) {
    formError.value = errorMessage(e);
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await load();
  try {
    staff.value = await listStaff();
  } catch {
    /* список співробітників потрібен лише для форми */
  }
});
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
</style>
