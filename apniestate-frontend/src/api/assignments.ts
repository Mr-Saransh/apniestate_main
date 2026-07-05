import { apiClient } from './client';
import { Role } from '@/api/auth';

export interface Assignment {
  id: string;
  user_id: string;
  company_id: string;
  role: Role;
  assigned_by: string;
  created_at: string;
  user?: { id: string; name: string; email: string };
  assigner?: { name: string };
  // Context-specific
  project_id?: string;
  project?: { id: string; name: string };
  site_id?: string;
  site?: { id: string; name: string };
}

export const assignmentsApi = {
  getProjects: () => apiClient.get<{data: Assignment[]}>('/assignments?type=project'),
  getSites: () => apiClient.get<{data: Assignment[]}>('/assignments?type=site'),
  create: (data: { user_id: string; type: 'project' | 'site'; entity_id: string; role: Role }) => 
    apiClient.post('/assignments', data),
  remove: (id: string, type: 'project' | 'site') => 
    apiClient.delete(`/assignments/${id}?type=${type}`)
};
