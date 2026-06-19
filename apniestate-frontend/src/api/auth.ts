import { apiClient } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'BUILDER' | 'SITE_SUPERVISOR' | 'ACCOUNTANT' | 'INVENTORY_MANAGER';
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<LoginResponse>('/auth/login', credentials),

  logout: () => apiClient.post('/auth/logout'),
};
