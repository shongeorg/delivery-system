import { api } from './axios';

export interface InventoryItem {
  id: string;
  name: string;
  slug: string;
  quantity: string;
  unit: string;
  cover?: string;
  updatedAt: string;
}

export const inventoryApi = {
  getAll: async () => {
    const response = await api.get('/inventory');
    return response.data;
  },

  updateQuantity: async (id: string, quantity: string) => {
    const response = await api.patch(`/inventory/${id}/quantity`, { quantity });
    return response.data;
  },

  create: async (data: Partial<InventoryItem>) => {
    const response = await api.post('/inventory', data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },
};
