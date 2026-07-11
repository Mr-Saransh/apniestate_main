import { apiClient } from "./client";

export interface BOQItem {
  id?: string;
  category_id?: string;
  code?: string;
  description: string;
  quantity: number;
  unit: string;
  material_rate: number;
  labour_rate: number;
  equipment_rate: number;
  other_rate: number;
  total_rate?: number;
  total_amount?: number;
  remarks?: string;
}

export interface BOQCategory {
  id?: string;
  name: string;
  parent_id?: string;
  items?: BOQItem[];
  children?: BOQCategory[];
}

export interface BOQ {
  id: string;
  project_id: string;
  version: number;
  status: 'DRAFT' | 'APPROVED' | 'REVISED';
  total_estimated_cost: number;
  created_at: string;
  categories: BOQCategory[];
}

export const boqApi = {
  getBOQForProject: async (project_id: string) => {
    return apiClient.get<BOQ>(`/boq?project_id=${project_id}`);
  },
  
  createBOQ: async (data: { project_id: string; notes?: string; categories: BOQCategory[] }) => {
    return apiClient.post<BOQ>('/boq', data);
  },
  
  approveBOQ: async (id: string) => {
    return apiClient.patch<BOQ>(`/boq/${id}/approve`, {});
  },
  
  deleteBOQ: async (id: string) => {
    return apiClient.delete(`/boq/${id}`);
  }
};
