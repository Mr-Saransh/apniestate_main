import { apiClient, type ApiResponse } from "./client";

export interface Worker {
  id: string;
  name: string;
  phone: string | null;
  trade: string;
  status: "ACTIVE" | "INACTIVE" | "TERMINATED" | "ON_LEAVE";
  daily_rate: number;
  site_id: string | null;
  project_id: string | null;
  address: string | null;
  aadhaar_number: string | null;
  bank_account: string | null;
  contractor_id: string | null;
  created_at: string;
  site?: { name: string } | null;
  project?: { name: string } | null;
  contractor?: { name: string } | null;
}

export const workersApi = {
  getWorkers: async (filters?: {
    site_id?: string;
    project_id?: string;
    contractor_id?: string;
    status?: string;
    trade?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.site_id) params.append("site_id", filters.site_id);
    if (filters?.project_id) params.append("project_id", filters.project_id);
    if (filters?.contractor_id) params.append("contractor_id", filters.contractor_id);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.trade) params.append("trade", filters.trade);

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<Worker[]>(`/workers${queryStr}`);
  },
  getWorkerById: async (id: string) => {
    return apiClient.get<Worker>(`/workers/${id}`);
  },
  createWorker: async (data: Partial<Worker>) => {
    return apiClient.post<Worker>("/workers", data);
  },
  updateWorker: async (id: string, data: Partial<Worker>) => {
    return apiClient.patch<Worker>(`/workers/${id}`, data);
  },
  deleteWorker: async (id: string) => {
    return apiClient.delete(`/workers/${id}`);
  }
};
