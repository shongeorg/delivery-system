import { api } from './axios';

export interface User {
  id: string;
  name: string;
  slug: string;
  email: string;
  role: string;
  phone?: string | null;
  cover?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
};
