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
  _count?: { sites: number };
  sites?: Site[];
}

export interface Site {
  id: string;
  project_id: string;
  name: string;
  location: string;
  supervisor_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status?: Project['status'];
  budget?: number;
  address?: string;
  city?: string;
  manager_id?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: Project['status'];
  budget?: number;
  address?: string;
  city?: string;
  manager_id?: string;
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
