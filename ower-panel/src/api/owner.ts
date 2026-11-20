import { api } from './axios';

export interface InventoryItem {
  id: string;
  name: string;
  slug: string;
  quantity: string;
  unit: string;
  cover?: string | null;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: string;
  product?: {
    name: string;
    cover?: string | null;
  };
}

export interface Order {
  id: string;
  userId: string;
  totalPrice: string;
  status: string;
  deliveryType: string;
  address?: string | null;
  phone?: string | null;
  paymentType: string;
  paymentStatus: string;
  courierId?: string | null;
  courier?: { id: string; name: string; phone?: string | null } | null;
  createdAt: string;
  items?: OrderItem[];
}

export interface StaffSalary {
  id: string;
  userId: string;
  baseSalary: string;
  bonusPercentage: string;
  currency: string;
  updatedAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  slug: string;
  email: string;
  role: string;
  phone?: string | null;
  cover?: string | null;
  isBlocked: boolean;
  createdAt: string;
  salary: StaffSalary | null;
}

export interface Overview {
  revenue: { today: number; week: number; month: number; total: number };
  orders: {
    today: number;
    active: number;
    deliveredToday: number;
    total: number;
    averageValue: number;
  };
  finance: { payrollMonth: number; expensesMonth: number; netProfitMonth: number };
  staff: { total: number; byRole: Record<string, number>; blocked: number };
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  lowStock: InventoryItem[];
  recentOrders: Order[];
}

export interface PayrollPayment {
  id: string;
  userId: string;
  amount: string;
  type: 'salary' | 'bonus' | string;
  period?: string | null;
  note?: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string; role: string } | null;
}

export interface PayrollResponse {
  payments: PayrollPayment[];
  totals: { salary: number; bonus: number; all: number };
}

export interface FinanceSeriesPoint {
  date: string;
  revenue: number;
  payroll: number;
  expenses: number;
  net: number;
}

export interface FinanceResponse {
  from: string;
  to: string;
  totals: {
    revenue: number;
    payroll: number;
    expenses: number;
    net: number;
    orders: number;
    paidOrders: number;
  };
  series: FinanceSeriesPoint[];
  expenses: Expense[];
  payrollPayments: PayrollPayment[];
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: string;
  note?: string | null;
  createdAt: string;
}

export interface KitchenOrder extends Omit<Order, 'items'> {
  items: Array<{ name: string; quantity: number; price: string }>;
  waitingMinutes: number;
}

export interface KitchenResponse {
  counts: Record<string, number>;
  queue: KitchenOrder[];
  oldestWaitingMinutes: number;
  lowStock: InventoryItem[];
}

export interface RestaurantSettings {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  workingHours?: string | null;
  currency: string;
  taxRate: string;
  deliveryFee: string;
  logo?: string | null;
  cover?: string | null;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string; role: string } | null;
}

export const ownerApi = {
  getOverview: async (): Promise<Overview> => {
    const response = await api.get('/owner/overview');
    return response.data;
  },

  getStaff: async (params?: { search?: string; role?: string }): Promise<StaffMember[]> => {
    const response = await api.get('/owner/staff', { params });
    return response.data;
  },

  updateStaff: async (id: string, data: { name?: string; role?: string; isBlocked?: boolean; phone?: string }) => {
    const response = await api.patch(`/owner/staff/${id}`, data);
    return response.data;
  },

  updateSalary: async (id: string, data: { baseSalary: number; bonusPercentage: number; currency: string }) => {
    const response = await api.put(`/owner/staff/${id}/salary`, data);
    return response.data;
  },

  getPayroll: async (period?: string): Promise<PayrollResponse> => {
    const response = await api.get('/owner/payroll', { params: period ? { period } : undefined });
    return response.data;
  },

  createPayroll: async (data: {
    userId: string;
    amount: number;
    type: 'salary' | 'bonus';
    period?: string;
    note?: string;
  }) => {
    const response = await api.post('/owner/payroll', data);
    return response.data;
  },

  getFinances: async (from?: string, to?: string): Promise<FinanceResponse> => {
    const response = await api.get('/owner/finances', { params: { from, to } });
    return response.data;
  },

  getExpenses: async (): Promise<Expense[]> => {
    const response = await api.get('/owner/expenses');
    return response.data;
  },

  createExpense: async (data: { title: string; category: string; amount: number; note?: string }) => {
    const response = await api.post('/owner/expenses', data);
    return response.data;
  },

  deleteExpense: async (id: string) => {
    const response = await api.delete(`/owner/expenses/${id}`);
    return response.data;
  },

  getKitchen: async (): Promise<KitchenResponse> => {
    const response = await api.get('/owner/kitchen');
    return response.data;
  },

  getSettings: async (): Promise<RestaurantSettings> => {
    const response = await api.get('/owner/settings');
    return response.data;
  },

  updateSettings: async (
    data: Partial<Omit<RestaurantSettings, 'taxRate' | 'deliveryFee'>> & {
      taxRate?: number | string;
      deliveryFee?: number | string;
    }
  ) => {
    const response = await api.patch('/owner/settings', data);
    return response.data;
  },

  getAuditLogs: async (): Promise<AuditLogEntry[]> => {
    const response = await api.get('/owner/audit-logs');
    return response.data;
  },
};
