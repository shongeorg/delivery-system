<template>
  <ion-app>
    <ion-menu v-if="auth.isAuthenticated" content-id="main" side="start">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Delivery System</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-menu-toggle :auto-hide="false" v-for="item in menuItems" :key="item.path">
            <ion-item :router-link="item.path" router-direction="root" :detail="false">
              <ion-icon slot="start" :icon="item.icon" />
              <ion-label>{{ item.label }}</ion-label>
            </ion-item>
          </ion-menu-toggle>
          <ion-item button :detail="false" @click="onLogout">
            <ion-icon slot="start" :icon="logOutOutline" />
            <ion-label>Вийти</ion-label>
          </ion-item>
        </ion-list>

        <div class="menu-footer">
          <p class="name">{{ auth.user?.name }}</p>
          <p class="role">{{ roleLabel }}</p>
        </div>
      </ion-content>
    </ion-menu>

    <ion-router-outlet id="main" />

    <ion-modal :is-open="call.phase === 'incoming'" :backdrop-dismiss="false">
      <ion-content class="ion-padding call-modal">
        <h2>Вхідний дзвінок</h2>
        <p>{{ call.peerName }} телефонує…</p>
        <ion-button expand="block" color="success" @click="call.accept()">Прийняти</ion-button>
        <ion-button expand="block" color="danger" fill="outline" @click="call.decline()">Відхилити</ion-button>
      </ion-content>
    </ion-modal>
  </ion-app>
</template>

<script setup lang="ts">
import {
  IonApp,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonModal,
  IonRouterOutlet,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/vue';
import {
  bicycleOutline,
  cartOutline,
  cashOutline,
  documentTextOutline,
  gridOutline,
  listOutline,
  logOutOutline,
  mapOutline,
  peopleOutline,
  personOutline,
  restaurantOutline,
  settingsOutline,
  statsChartOutline,
  storefrontOutline,
} from 'ionicons/icons';
import { computed, onMounted } from 'vue';

import { ROLE_LABELS } from '@/utils/format';
import { useAuthStore } from '@/stores/auth';
import { useCallStore } from '@/stores/call';
import { useSocketStore } from '@/stores/socket';

interface MenuItem {
  label: string;
  path: string;
  icon: string;
}

const auth = useAuthStore();
const call = useCallStore();
const socket = useSocketStore();
const ionRouter = useIonRouter();

const roleLabel = computed(() => ROLE_LABELS[auth.role ?? 'customer'] ?? '');

const MENUS: Record<string, MenuItem[]> = {
  customer: [
    { label: 'Каталог', path: '/shop', icon: storefrontOutline },
    { label: 'Кошик', path: '/cart', icon: cartOutline },
    { label: 'Мої замовлення', path: '/orders', icon: listOutline },
    { label: 'Профіль', path: '/profile', icon: personOutline },
  ],
  courier: [
    { label: 'Панель', path: '/courier', icon: gridOutline },
    { label: 'Замовлення', path: '/courier/orders', icon: listOutline },
    { label: 'Карта', path: '/courier/map', icon: mapOutline },
    { label: 'Профіль', path: '/profile', icon: personOutline },
  ],
  chef: [
    { label: 'Кухня', path: '/kitchen', icon: restaurantOutline },
    { label: 'Черга замовлень', path: '/kitchen/orders', icon: listOutline },
    { label: 'Склад', path: '/kitchen/inventory', icon: gridOutline },
    { label: 'Профіль', path: '/profile', icon: personOutline },
  ],
  owner: [
    { label: 'Огляд', path: '/owner', icon: statsChartOutline },
    { label: 'Персонал', path: '/owner/staff', icon: peopleOutline },
    { label: 'Зарплати', path: '/owner/payroll', icon: cashOutline },
    { label: 'Фінанси', path: '/owner/finances', icon: cashOutline },
    { label: 'Кухня', path: '/owner/kitchen', icon: restaurantOutline },
    { label: 'Замовлення', path: '/orders', icon: listOutline },
    { label: 'Налаштування', path: '/owner/settings', icon: settingsOutline },
    { label: 'Журнал дій', path: '/owner/audit', icon: documentTextOutline },
    { label: 'Профіль', path: '/profile', icon: personOutline },
  ],
};

const menuItems = computed<MenuItem[]>(() => {
  const role = auth.role;
  if (role === 'admin') return MENUS.owner;
  if (role && role in MENUS) return MENUS[role];
  return MENUS.customer;
});

function onLogout(): void {
  socket.disconnect();
  auth.logout();
  ionRouter.push('/login');
}

onMounted(() => {
  if (auth.isAuthenticated) {
    socket.connect();
    auth.fetchMe().catch(() => {
      /* токен міг протермінуватися — інтерсептор у client.ts оновить його */
    });
  }
});
</script>

<style scoped>
.menu-footer {
  padding: 16px;
  opacity: 0.7;
}
.menu-footer .name {
  margin: 0;
  font-weight: 600;
}
.menu-footer .role {
  margin: 2px 0 0;
  font-size: 13px;
}
.call-modal {
  text-align: center;
}
</style>
