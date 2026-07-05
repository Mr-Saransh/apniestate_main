import { apiClient } from './client';

export interface Resignation {
  id: string;
  user_id: string;
  company_id: string;
  reason: string;
  last_working_day?: string;
  feedback?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  user?: { name: string; email: string; role: string };
  company?: { name: string };
  reviewer?: { name: string };
}

export const resignationsApi = {
  getAll: () => apiClient.get<Resignation[]>('/resignations'),
  create: (data: { reason: string; last_working_day?: string; feedback?: string }) => 
    apiClient.post('/resignations', data),
  review: (id: string, status: 'APPROVED' | 'REJECTED') => 
    apiClient.patch(`/resignations/${id}`, { status })
};
