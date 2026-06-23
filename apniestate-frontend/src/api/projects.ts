import { apiClient } from './client';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  builder_id: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  start_date: string;
  end_date: string | null;
  budget: number | null;
  actual_cost: number | null;
  progress_percentage: number | null;
  created_at: string;
  updated_at: string;
  _count?: { sites: number; tasks?: number; workers?: number };
  sites?: Site[];
  address?: string | null;
  city?: string | null;
  manager_id?: string | null;
  builder?: { id: string; name: string } | null;
  manager?: { id: string; name: string } | null;
  tasks?: any[] | null;
}

export interface Site {
  id: string;
  project_id: string;
  name: string;
  location: string;
  supervisor_id: string | null;
  created_at: string;
  updated_at: string;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | string;
  phase?: string | null;
  progress_percentage?: number | null;
  supervisor?: { id: string; name: string } | null;
}

export interface CreateProjectData {
  name: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  status?: Project['status'];
  budget?: number | null;
  address?: string | null;
  city?: string | null;
  manager_id?: string | null;
}

export interface UpdateProjectData {
  name?: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: Project['status'];
  budget?: number | null;
  address?: string | null;
  city?: string | null;
  manager_id?: string | null;
}

export const projectsApi = {
  getAll: () => apiClient.get<Project[]>('/projects'),

  getById: (id: string) => apiClient.get<Project>(`/projects/${id}`),

  create: (data: CreateProjectData) =>
    apiClient.post<Project>('/projects', data),

  update: (id: string, data: UpdateProjectData) =>
    apiClient.patch<Project>(`/projects/${id}`, data),

  delete: (id: string) => apiClient.delete(`/projects/${id}`),
};
