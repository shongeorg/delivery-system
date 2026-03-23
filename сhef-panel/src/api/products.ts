import { api } from './axios';

export interface Product {
  id: string;
  name: string;
  slug: string;
  cover?: string;
  price: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  categories?: string[];
  tags?: string[];
  ingredients?: Ingredient[];
}

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  cover?: string;
  description?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export const productsApi = {
  getAll: async () => {
    const response = await api.get('/products');
    return response.data;
  },

  getBySlug: async (slug: string) => {
    const response = await api.get(`/products/${slug}`);
    return response.data;
  },

  create: async (data: Partial<Product> & { categoryIds?: string[]; tagIds?: string[]; ingredients?: Ingredient[] }) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Product>) => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};

export const categoriesApi = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
};

export const tagsApi = {
  getAll: async () => {
    const response = await api.get('/tags');
    return response.data;
  },
};
