import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';

import type { Role } from '@/api/types';
import { useAuthStore } from '@/stores/auth';

interface RouteMeta {
  requiresAuth?: boolean;
  roles?: Role[];
  title?: string;
}

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginPage.vue'),
    meta: { title: 'Вхід' } satisfies RouteMeta,
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterPage.vue'),
    meta: { title: 'Реєстрація' } satisfies RouteMeta,
  },

  /* ------------------------------ Магаз ------------------------------ */
  {
    path: '/shop',
    name: 'shop',
    component: () => import('@/views/shop/CatalogPage.vue'),
    meta: { requiresAuth: true, title: 'Каталог' } satisfies RouteMeta,
  },
  {
    path: '/shop/category/:slug',
    name: 'shop-category',
    component: () => import('@/views/shop/CategoryPage.vue'),
    meta: { requiresAuth: true, title: 'Категорія' } satisfies RouteMeta,
  },
  {
    path: '/shop/product/:slug',
    name: 'shop-product',
    component: () => import('@/views/shop/ProductPage.vue'),
    meta: { requiresAuth: true, title: 'Товар' } satisfies RouteMeta,
  },
  {
    path: '/cart',
    name: 'cart',
    component: () => import('@/views/shop/CartPage.vue'),
    meta: { requiresAuth: true, title: 'Кошик' } satisfies RouteMeta,
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('@/views/shop/CheckoutPage.vue'),
    meta: { requiresAuth: true, title: 'Оформлення' } satisfies RouteMeta,
  },
  {
    path: '/orders',
    name: 'my-orders',
    component: () => import('@/views/shop/MyOrdersPage.vue'),
    meta: { requiresAuth: true, title: 'Мої замовлення' } satisfies RouteMeta,
  },
  {
    path: '/orders/:id',
    name: 'order-detail',
    component: () => import('@/views/shop/OrderDetailPage.vue'),
    meta: { requiresAuth: true, title: 'Замовлення' } satisfies RouteMeta,
  },
  {
    path: '/orders/:id/tracking',
    name: 'order-tracking',
    component: () => import('@/views/shop/TrackingPage.vue'),
    meta: { requiresAuth: true, title: 'Трекінг' } satisfies RouteMeta,
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfilePage.vue'),
    meta: { requiresAuth: true, title: 'Профіль' } satisfies RouteMeta,
  },

  /* ------------------------------ Кур'єр ------------------------------ */
  {
    path: '/courier',
    name: 'courier-home',
    component: () => import('@/views/courier/CourierHomePage.vue'),
    meta: { requiresAuth: true, roles: ['courier'], title: 'Кур’єр' } satisfies RouteMeta,
  },
  {
    path: '/courier/orders',
    name: 'courier-orders',
    component: () => import('@/views/courier/CourierOrdersPage.vue'),
    meta: { requiresAuth: true, roles: ['courier'], title: 'Замовлення' } satisfies RouteMeta,
  },
  {
    path: '/courier/orders/:id',
    name: 'courier-order',
    component: () => import('@/views/courier/CourierOrderPage.vue'),
    meta: { requiresAuth: true, roles: ['courier'], title: 'Доставка' } satisfies RouteMeta,
  },
  {
    path: '/courier/map',
    name: 'courier-map',
    component: () => import('@/views/courier/CourierMapPage.vue'),
    meta: { requiresAuth: true, roles: ['courier'], title: 'Карта' } satisfies RouteMeta,
  },

  /* ------------------------------ Кухня ------------------------------ */
  {
    path: '/kitchen',
    name: 'kitchen-home',
    component: () => import('@/views/chef/KitchenHomePage.vue'),
    meta: { requiresAuth: true, roles: ['chef', 'owner', 'admin'], title: 'Кухня' } satisfies RouteMeta,
  },
  {
    path: '/kitchen/orders',
    name: 'kitchen-orders',
    component: () => import('@/views/chef/KitchenOrdersPage.vue'),
    meta: { requiresAuth: true, roles: ['chef', 'owner', 'admin'], title: 'Черга замовлень' } satisfies RouteMeta,
  },
  {
    path: '/kitchen/inventory',
    name: 'kitchen-inventory',
    component: () => import('@/views/chef/KitchenInventoryPage.vue'),
    meta: { requiresAuth: true, roles: ['chef', 'owner', 'admin'], title: 'Склад' } satisfies RouteMeta,
  },

  /* ------------------------------ Оунер ------------------------------ */
  {
    path: '/owner',
    name: 'owner-home',
    component: () => import('@/views/owner/OwnerHomePage.vue'),
    meta: { requiresAuth: true, roles: ['owner', 'admin'], title: 'Огляд' } satisfies RouteMeta,
  },
  {
    path: '/owner/staff',
    name: 'owner-staff',
    component: () => import('@/views/owner/OwnerStaffPage.vue'),
    meta: { requiresAuth: true, roles: ['owner', 'admin'], title: 'Персонал' } satisfies RouteMeta,
  },
  {
    path: '/owner/payroll',
    name: 'owner-payroll',
    component: () => import('@/views/owner/OwnerPayrollPage.vue'),
    meta: { requiresAuth: true, roles: ['owner', 'admin'], title: 'Зарплати' } satisfies RouteMeta,
  },
  {
    path: '/owner/finances',
    name: 'owner-finances',
    component: () => import('@/views/owner/OwnerFinancesPage.vue'),
    meta: { requiresAuth: true, roles: ['owner', 'admin'], title: 'Фінанси' } satisfies RouteMeta,
  },
  {
    path: '/owner/kitchen',
    name: 'owner-kitchen',
    component: () => import('@/views/owner/OwnerKitchenPage.vue'),
    meta: { requiresAuth: true, roles: ['owner', 'admin'], title: 'Кухня (огляд)' } satisfies RouteMeta,
  },
  {
    path: '/owner/settings',
    name: 'owner-settings',
    component: () => import('@/views/owner/OwnerSettingsPage.vue'),
    meta: { requiresAuth: true, roles: ['owner', 'admin'], title: 'Налаштування' } satisfies RouteMeta,
  },
  {
    path: '/owner/audit',
    name: 'owner-audit',
    component: () => import('@/views/owner/OwnerAuditPage.vue'),
    meta: { requiresAuth: true, roles: ['owner', 'admin'], title: 'Журнал дій' } satisfies RouteMeta,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  const meta = to.meta as RouteMeta;

  if (meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if ((to.name === 'login' || to.name === 'register') && auth.isAuthenticated) {
    return auth.homeRoute();
  }

  if (meta.roles && auth.role && !meta.roles.includes(auth.role)) {
    return auth.homeRoute();
  }

  return true;
});

export default router;
