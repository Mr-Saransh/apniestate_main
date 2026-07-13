import { apiClient } from './client';
import { Role } from '@/api/auth';

export interface Invitation {
  id: string;
  company_id: string;
  invited_by: string;
  email: string;
  role: Role;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | 'APPROVED';
  project_ids: string[];
  site_ids: string[];
  expires_at: string;
  created_at: string;
  company?: { name: string };
  inviter?: { name: string; email: string };
}

export const invitationsApi = {
  getCompanyInvitations: () => apiClient.get<Invitation[]>('/invitations'),
  getMyInvitations: () => apiClient.get<Invitation[]>('/invitations/my'),
  create: (data: { email: string; role: Role; project_ids?: string[]; site_ids?: string[] }) => 
    apiClient.post('/invitations', data),
  action: (id: string, action: 'accept' | 'reject' | 'approve' | 'cancel' | 'resend') => 
    apiClient.patch(`/invitations/${id}`, { action }),
  delete: (id: string) => apiClient.delete(`/invitations/${id}`)
};
