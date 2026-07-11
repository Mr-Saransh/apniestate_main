import { apiClient } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export type Role = 'ADMIN' | 'BUILDER' | 'SITE_SUPERVISOR' | 'ACCOUNTANT' | 'INVENTORY_MANAGER' | 'PROJECT_MANAGER' | 'WORKER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  onboarded?: boolean;
  company_id?: string | null;
  company?: any;
  last_workspace_id?: string | null;
}

export interface Membership {
  id: string;
  user_id: string;
  company_id: string;
  roles: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'RESIGNED';
  last_active_at?: string;
  company: {
    id: string;
    name: string;
  };
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
  memberships?: Membership[];
  needsSelection?: boolean;
  restored?: boolean;
  company?: { id: string; name: string };
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>('/auth/login', credentials),

  signup: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>('/auth/signup', credentials),

  switchWorkspace: (companyId: string, role: string) =>
    apiClient.post<AuthResponse>('/auth/switch-workspace', { company_id: companyId, role }),

  restoreWorkspace: () =>
    apiClient.post<AuthResponse>('/auth/restore-workspace'),

  getWorkspaces: () =>
    apiClient.get<{data: { memberships: Membership[] }}>('/auth/workspaces'),

  logout: () => apiClient.post('/auth/logout'),
};
