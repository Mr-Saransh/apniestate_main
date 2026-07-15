import { apiClient } from './client';

export interface User {
  id: string;
  name: string;
  email: string | null;
  username?: string | null;
  role: 'ADMIN' | 'BUILDER' | 'SITE_SUPERVISOR' | 'ACCOUNTANT' | 'INVENTORY_MANAGER' | 'PROJECT_MANAGER';
  phone: string | null;
  city?: string | null;
  state?: string | null;
  is_active: boolean;
  created_at: string;
  project_assignments?: { project_id: string; project: { name: string } }[];
}

export interface CreateUserData {
  name: string;
  email?: string;
  username?: string;
  password: string;
  role?: User['role'];
  phone?: string;
  project_ids?: string[];
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: User['role'];
  phone?: string;
  city?: string;
  state?: string;
}

export const usersApi = {
  getAll: () => apiClient.get<User[]>('/users'),

  getById: (id: string) => apiClient.get<User>(`/users/${id}`),

  create: (data: CreateUserData) =>
    apiClient.post<User>('/team/create-member', data),

  update: (id: string, data: UpdateUserData) =>
    apiClient.patch<User>(`/users/${id}`, data),

  updateAssignments: (id: string, projectIds: string[]) =>
    apiClient.put(`/users/${id}/assignments`, { project_ids: projectIds }),

  delete: (id: string) => apiClient.delete(`/users/${id}`),
};
