import { api } from './axios';

export interface Order {
  id: string;
  userId: string;
  totalPrice: string;
  status: 'created' | 'paid' | 'cooking' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled';
  deliveryType: string;
  address?: string;
  phone?: string;
  paymentType: string;
  paymentStatus: string;
  createdAt: string;
  items?: OrderItem[];
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: string;
  product?: {
    name: string;
    cover?: string;
  };
}

export const ordersApi = {
  getAll: async (status?: string) => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/orders${params}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  create: async (data: Partial<Order>) => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await api.post(`/orders/${id}/cancel`);
    return response.data;
  },
};
