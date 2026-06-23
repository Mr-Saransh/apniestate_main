import { apiClient } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'BUILDER' | 'SITE_SUPERVISOR' | 'ACCOUNTANT' | 'INVENTORY_MANAGER' | 'PROJECT_MANAGER';
  phone?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<LoginResponse>('/auth/login', credentials),

  signup: (credentials: LoginCredentials) =>
    apiClient.post<LoginResponse>('/auth/signup', credentials),

  updateRole: (role: string) =>
    apiClient.patch<AuthUser>('/users/me/role', { role }),

  logout: () => apiClient.post('/auth/logout'),
};
