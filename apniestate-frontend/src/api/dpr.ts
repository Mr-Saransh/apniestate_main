import { apiClient } from './client';

export interface DPR {
  id: string;
  site_id: string;
  submitted_by: string;
  report_date: string;
  summary: string;
  weather: string | null;
  workers_count: number | null;
  work_completed: string | null;
  materials_consumed: string | null;
  issues_faced: string | null;
  photos: string | null; // JSON string or array
  tomorrow_plan: string | null;
  created_at: string;
  updated_at: string;
  site?: {
    id: string;
    name: string;
    project?: { id: string; name: string };
  };
  submitter?: { id: string; name: string };
}

export interface CreateDprData {
  site_id: string;
  date?: string | null;
  work_completed: string;
  weather?: string | null;
  workers_present?: number | string | null;
  materials_consumed?: string | null;
  issues_faced?: string | null;
  photos?: any;
  tomorrow_plan?: string | null;
}

export const dprApi = {
  getAll: (filters?: { project_id?: string; site_id?: string; date?: string }) => {
    const params = new URLSearchParams();
    if (filters?.project_id) params.append('project_id', filters.project_id);
    if (filters?.site_id) params.append('site_id', filters.site_id);
    if (filters?.date) params.append('date', filters.date);
    return apiClient.get<DPR[]>(`/dpr?${params.toString()}`);
  },

  create: (data: CreateDprData) =>
    apiClient.post<DPR>('/dpr', data),
};
