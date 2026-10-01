import { apiClient } from './client';

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  target_date: string;
  actual_date: string | null;
  planned_start_date?: string | null;
  planned_end_date?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
  schedule_status?: 'AHEAD' | 'ON_TIME' | 'DELAYED' | 'ON_TRACK' | 'AT_RISK' | 'PENDING';
  scheduleStatus?: 'AHEAD' | 'ON_TIME' | 'DELAYED' | 'ON_TRACK' | 'AT_RISK' | 'PENDING';
  days_variance?: number;
  daysVariance?: number;
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
  target_date?: string;
  planned_start_date?: string | null;
  planned_end_date?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
  weight?: number | null;
  progress_percentage?: number;
  status?: Milestone['status'];
}

export interface UpdateMilestoneData {
  name?: string;
  description?: string | null;
  target_date?: string;
  planned_start_date?: string | null;
  planned_end_date?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
  weight?: number | null;
  progress_percentage?: number;
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
