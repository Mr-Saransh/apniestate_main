import { apiClient } from './client';

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  target_date: string;
  actual_date: string | null;
  weight: number | null;
  progress_percentage?: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  created_at: string;
  updated_at: string;
}

export interface CreateMilestoneData {
  project_id: string;
  name: string;
  description?: string | null;
  target_date: string;
  weight?: number | null;
  progress_percentage?: number;
  status?: Milestone['status'];
}

export interface UpdateMilestoneData {
  name?: string;
  description?: string | null;
  target_date?: string;
  weight?: number | null;
  status?: Milestone['status'];
  actual_date?: string | null;
}

export const milestonesApi = {
  getAll: (projectId?: string) => 
    apiClient.get<Milestone[]>(projectId ? `/milestones?project_id=${projectId}` : '/milestones'),

  getById: (id: string) => 
    apiClient.get<Milestone>(`/milestones/${id}`),

  create: (data: CreateMilestoneData) =>
    apiClient.post<Milestone>('/milestones', data),

  update: (id: string, data: UpdateMilestoneData) =>
    apiClient.patch<Milestone>(`/milestones/${id}`, data),

  delete: (id: string) => 
    apiClient.delete(`/milestones/${id}`),
};
