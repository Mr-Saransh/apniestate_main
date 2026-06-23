import { apiClient } from "./client";

export interface Contractor {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  gst_number: string | null;
  pan_number: string | null;
  rating: number | null;
  is_active: boolean;
  created_at: string;
  _count?: {
    workers: number;
    payments: number;
  };
}

export const contractorsApi = {
  getContractors: async () => {
    return apiClient.get<Contractor[]>("/contractors");
  },
  getContractorById: async (id: string) => {
    return apiClient.get<Contractor>(`/contractors/${id}`);
  },
  createContractor: async (data: Partial<Contractor>) => {
    return apiClient.post<Contractor>("/contractors", data);
  },
  updateContractor: async (id: string, data: Partial<Contractor>) => {
    return apiClient.patch<Contractor>(`/contractors/${id}`, data);
  },
  deleteContractor: async (id: string) => {
    return apiClient.delete(`/contractors/${id}`);
  }
};
