export function formatMoney(value: number | string | null | undefined): string {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').toUpperCase();
}

export function statusClass(status: string): string {
  switch (status) {
    case 'created':
      return 'bg-gray-100 text-gray-700';
    case 'paid':
      return 'bg-blue-100 text-blue-700';
    case 'cooking':
      return 'bg-yellow-100 text-yellow-800';
    case 'ready':
      return 'bg-green-100 text-green-700';
    case 'on_the_way':
      return 'bg-purple-100 text-purple-700';
    case 'delivered':
      return 'bg-indigo-100 text-indigo-700';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function roleClass(role: string): string {
  switch (role) {
    case 'owner':
      return 'bg-amber-100 text-amber-800';
    case 'admin':
      return 'bg-purple-100 text-purple-700';
    case 'chef':
      return 'bg-orange-100 text-orange-700';
    case 'courier':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}
