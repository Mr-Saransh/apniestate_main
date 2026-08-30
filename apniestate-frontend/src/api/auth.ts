import { apiClient } from './client';

export interface LoginCredentials {
  identifier: string;
  password?: string;
  otp?: string;
}

export interface SignupCredentials {
  email: string;
  password?: string;
  otp?: string;
}

export type Role =
  | 'ADMIN'
  | 'BUILDER'
  | 'SITE_SUPERVISOR'
  | 'ACCOUNTANT'
  | 'INVENTORY_MANAGER'
  | 'PROJECT_MANAGER'
  | 'WORKER'
  | 'CRM_MANAGER'
  | 'TELECALLER'
  | 'SALES_EXECUTIVE';

export type CrmRole = 'BUILDER' | 'CRM_MANAGER' | 'TELECALLER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  crm_role?: CrmRole | null;
  company_roles?: string[];
  can_switch_mode?: boolean;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  onboarded?: boolean;
  profile_completed?: boolean;
  subscription_status?: string;
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

  signup: (credentials: SignupCredentials) =>
    apiClient.post<AuthResponse>('/auth/signup', credentials),

  sendOtp: (email: string) =>
    apiClient.post<{success: boolean, message: string}>('/auth/send-otp', { email }),

  switchWorkspace: (companyId: string, role: string) =>
    apiClient.post<AuthResponse>('/auth/switch-workspace', { company_id: companyId, role }),

  restoreWorkspace: () =>
    apiClient.post<AuthResponse>('/auth/restore-workspace'),

  getWorkspaces: () =>
    apiClient.get<{data: { memberships: Membership[] }}>('/auth/workspaces'),

  logout: () => apiClient.post('/auth/logout'),
};
