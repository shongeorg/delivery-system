<template>
  <ion-page>
    <AppHeader title="Персонал" />
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="refresh">
        <ion-refresher-content />
      </ion-refresher>

      <ion-searchbar
        :value="search"
        placeholder="Пошук за ім’ям, email, телефоном"
        @ionInput="onSearchInput"
        @ionClear="onSearchClear"
      />

      <ion-item>
        <ion-select
          label="Фільтр за роллю"
          label-placement="stacked"
          interface="popover"
          :value="roleFilter"
          @ionChange="onRoleFilter"
        >
          <ion-select-option value="">Усі ролі</ion-select-option>
          <ion-select-option v-for="role in ROLE_OPTIONS" :key="role" :value="role">
            {{ ROLE_LABELS[role] }}
          </ion-select-option>
        </ion-select>
      </ion-item>

      <div v-if="loading && !staff.length" class="state">
        <ion-spinner name="crescent" />
      </div>

      <EmptyState
        v-else-if="error"
        :title="error"
        subtitle="Перевірте з’єднання та спробуйте ще раз"
        icon="alert-circle-outline"
        tall
      />

      <ion-list v-else-if="staff.length">
        <ion-item v-for="member in staff" :key="member.id">
          <ion-label>
            <h2>{{ member.name }}</h2>
            <p>{{ member.email }}</p>
            <p v-if="member.phone">{{ member.phone }}</p>
            <p v-if="member.salary">
              Зарплата: {{ formatMoney(member.salary.baseSalary, member.salary.currency) }} +
              {{ toNumber(member.salary.bonusPercentage) }}%
            </p>
          </ion-label>

          <div slot="end" class="staff-actions">
            <ion-select
              :value="member.role"
              interface="popover"
              aria-label="Роль"
              :disabled="busyId === member.id"
              @ionChange="onRoleChange(member, $event)"
            >
              <ion-select-option v-for="role in ROLE_OPTIONS" :key="role" :value="role">
                {{ ROLE_LABELS[role] }}
              </ion-select-option>
            </ion-select>

            <ion-toggle
              :checked="member.isBlocked"
              :disabled="busyId === member.id"
              aria-label="Заблоковано"
              @ionChange="onBlockChange(member, $event)"
            />

            <ion-button size="small" fill="outline" @click="openSalary(member)">Зарплата</ion-button>
          </div>
        </ion-item>
      </ion-list>

      <EmptyState v-else title="Персонал не знайдено" icon="people-outline" tall />
    </ion-content>

    <ion-modal :is-open="Boolean(salaryTarget)" @didDismiss="closeSalary">
      <ion-header>
        <ion-toolbar>
          <ion-title>Зарплата · {{ salaryTarget?.name }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeSalary">Закрити</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-list>
          <ion-item>
            <ion-input
              v-model="salaryForm.baseSalary"
              type="number"
              label="Базова зарплата"
              label-placement="stacked"
            />
          </ion-item>
          <ion-item>
            <ion-input
              v-model="salaryForm.bonusPercentage"
              type="number"
              label="Бонус, %"
              label-placement="stacked"
            />
          </ion-item>
          <ion-item>
            <ion-select
              label="Валюта"
              label-placement="stacked"
              interface="popover"
              :value="salaryForm.currency"
              @ionChange="onCurrencyChange"
            >
              <ion-select-option value="UAH">UAH</ion-select-option>
              <ion-select-option value="USD">USD</ion-select-option>
              <ion-select-option value="EUR">EUR</ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>

        <ion-text v-if="salaryError" color="danger"><p>{{ salaryError }}</p></ion-text>

        <ion-button expand="block" :disabled="savingSalary" @click="saveSalary">Зберегти</ion-button>
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
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/vue';
import { onMounted, reactive, ref } from 'vue';

import { errorMessage } from '@/api/client';
import { listStaff, setStaffSalary, updateStaff } from '@/api/endpoints';
import type { Role, StaffMember } from '@/api/types';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import { formatMoney, ROLE_LABELS, toNumber } from '@/utils/format';

const ROLE_OPTIONS: Role[] = ['owner', 'admin', 'chef', 'courier', 'customer'];

const staff = ref<StaffMember[]>([]);
const loading = ref(false);
const error = ref('');
const search = ref('');
const roleFilter = ref('');
const busyId = ref('');

const salaryTarget = ref<StaffMember | null>(null);
const salaryForm = reactive({ baseSalary: '', bonusPercentage: '', currency: 'UAH' });
const savingSalary = ref(false);
const salaryError = ref('');

async function load(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    staff.value = await listStaff(search.value || undefined, roleFilter.value || undefined);
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

function onSearchInput(event: CustomEvent): void {
  const next = String(event.detail.value ?? '');
  if (next === search.value) return;
  search.value = next;
  void load();
}

function onSearchClear(): void {
  if (!search.value) return;
  search.value = '';
  void load();
}

function onRoleFilter(event: CustomEvent): void {
  roleFilter.value = String(event.detail.value ?? '');
  void load();
}

async function onRoleChange(member: StaffMember, event: CustomEvent): Promise<void> {
  const next = event.detail.value as Role;
  if (!next || next === member.role) return;
  busyId.value = member.id;
  try {
    await updateStaff(member.id, { role: next });
    await load();
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    busyId.value = '';
  }
}

async function onBlockChange(member: StaffMember, event: CustomEvent): Promise<void> {
  const next = Boolean(event.detail.checked);
  busyId.value = member.id;
  try {
    await updateStaff(member.id, { isBlocked: next });
    await load();
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    busyId.value = '';
  }
}

function openSalary(member: StaffMember): void {
  salaryTarget.value = member;
  salaryForm.baseSalary = member.salary ? String(member.salary.baseSalary) : '0';
  salaryForm.bonusPercentage = member.salary ? String(member.salary.bonusPercentage) : '0';
  salaryForm.currency = member.salary?.currency ?? 'UAH';
  salaryError.value = '';
}

function closeSalary(): void {
  salaryTarget.value = null;
}

function onCurrencyChange(event: CustomEvent): void {
  salaryForm.currency = String(event.detail.value ?? 'UAH');
}

async function saveSalary(): Promise<void> {
  if (!salaryTarget.value) return;
  savingSalary.value = true;
  salaryError.value = '';
  try {
    await setStaffSalary(salaryTarget.value.id, {
      baseSalary: toNumber(salaryForm.baseSalary),
      bonusPercentage: toNumber(salaryForm.bonusPercentage),
      currency: salaryForm.currency,
    });
    closeSalary();
    await load();
  } catch (e) {
    salaryError.value = errorMessage(e);
  } finally {
    savingSalary.value = false;
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
.staff-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
