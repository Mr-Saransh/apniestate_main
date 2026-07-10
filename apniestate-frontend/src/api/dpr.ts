import { apiClient } from './client';

export interface DPR {
  id: string;
  project_id?: string;
  site_id: string;
  submitted_by: string;
  report_date: string;
  summary: string;
  weather?: string | null;
  temperature?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  work_completed?: string | null;
  work_in_progress?: string | null;
  tomorrow_plan?: string | null;
  completion_percentage?: number | null;
  reasons_for_delay?: string | null;
  safety_observations?: string | null;
  quality_observations?: string | null;
  visitor_notes?: string | null;
  remarks?: string | null;
  
  attendance_data?: any;
  materials_consumed?: any;
  issues_faced?: any;
  photos?: any;
  
  status: "DRAFT" | "SUBMITTED" | "APPROVED";
  created_at: string;
  updated_at: string;

  site?: {
    id: string;
    name: string;
    project?: { id: string; name: string };
  };
  submitter?: { id: string; name: string };
}

export interface WeeklyReport {
  id: string;
  project_id: string;
  site_id?: string;
  generated_by: string;
  week_start_date: string;
  week_end_date: string;
  
  completed_work?: string | null;
  pending_work?: string | null;
  delay_summary?: string | null;
  major_achievements?: string | null;
  major_risks?: string | null;
  site_health?: string | null;
  
  attendance_summary?: any;
  material_consumption?: any;
  budget_impact?: number | null;
  
  status: "DRAFT" | "GENERATED" | "APPROVED";
  created_at: string;
  
  project?: { id: string; name: string };
  site?: { id: string; name: string };
  generator?: { id: string; name: string };
}

export interface CreateDprData {
  project_id?: string | null;
  site_id: string;
  date?: string | null;
  summary: string;
  weather?: string | null;
  temperature?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  work_completed?: string | null;
  work_in_progress?: string | null;
  tomorrow_plan?: string | null;
  completion_percentage?: number | null;
  reasons_for_delay?: string | null;
  safety_observations?: string | null;
  quality_observations?: string | null;
  visitor_notes?: string | null;
  remarks?: string | null;
  status?: "DRAFT" | "SUBMITTED" | "APPROVED";
  photos?: any;
}

export const dprApi = {
  getAll: (filters?: { project_id?: string; site_id?: string; date?: string }) => {
    const params = new URLSearchParams();
    if (filters?.project_id) params.append('project_id', filters.project_id);
    if (filters?.site_id) params.append('site_id', filters.site_id);
    if (filters?.date) params.append('date', filters.date);
    return apiClient.get<DPR[]>(`/dpr?${params.toString()}`);
  },

  getById: (id: string) => apiClient.get<DPR>(`/dpr/${id}`),

  create: (data: CreateDprData) => apiClient.post<DPR>('/dpr', data),

  update: (id: string, data: Partial<CreateDprData>) => apiClient.patch<DPR>(`/dpr/${id}`, data),

  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/dpr/${id}`),

  // Weekly Reports
  getWeekly: (filters?: { project_id?: string; site_id?: string }) => {
    const params = new URLSearchParams();
    if (filters?.project_id) params.append('project_id', filters.project_id);
    if (filters?.site_id) params.append('site_id', filters.site_id);
    return apiClient.get<WeeklyReport[]>(`/dpr/weekly?${params.toString()}`);
  },

  generateWeekly: (data: { project_id: string; site_id?: string; start_date: string; end_date: string }) => 
    apiClient.post<WeeklyReport>('/dpr/weekly', data)
};
