import { apiClient } from './client';

export interface User {
  id: string;
  name: string;
  email: string | null;
  username?: string | null;
  role: 'ADMIN' | 'BUILDER' | 'SITE_SUPERVISOR' | 'ACCOUNTANT' | 'INVENTORY_MANAGER' | 'PROJECT_MANAGER';
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateUserData {
  name: string;
  email?: string;
  username?: string;
  password: string;
  role?: User['role'];
  phone?: string;
  project_id?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: User['role'];
  phone?: string;
}

export const usersApi = {
  getAll: () => apiClient.get<User[]>('/users'),

  getById: (id: string) => apiClient.get<User>(`/users/${id}`),

  create: (data: CreateUserData) =>
    apiClient.post<User>('/team/create-member', data),

  update: (id: string, data: UpdateUserData) =>
    apiClient.patch<User>(`/users/${id}`, data),

  delete: (id: string) => apiClient.delete(`/users/${id}`),
};
