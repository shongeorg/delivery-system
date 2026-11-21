import type { OrderStatus } from '@/api/types';

export function toNumber(value: string | number | null | undefined): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '0'));
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(value: string | number | null | undefined, currency = '₴'): string {
  return `${toNumber(value).toFixed(2)} ${currency}`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'щойно';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} хв тому`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} год тому`;
  return `${Math.floor(hours / 24)} дн тому`;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  created: 'Створено',
  paid: 'Оплачено',
  cooking: 'Готується',
  ready: 'Готово',
  on_the_way: 'В дорозі',
  delivered: 'Доставлено',
  cancelled: 'Скасовано',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  created: 'medium',
  paid: 'tertiary',
  cooking: 'warning',
  ready: 'secondary',
  on_the_way: 'primary',
  delivered: 'success',
  cancelled: 'danger',
};

export function statusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function statusColor(status: OrderStatus): string {
  return ORDER_STATUS_COLORS[status] ?? 'medium';
}

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Власник',
  admin: 'Адмін',
  chef: 'Кухар',
  courier: 'Кур’єр',
  customer: 'Клієнт',
};
