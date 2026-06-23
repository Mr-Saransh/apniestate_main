import { apiClient } from "./client";

export interface Leave {
  id: string;
  worker_id: string;
  type: "CASUAL" | "SICK" | "EARNED" | "UNPAID" | "EMERGENCY";
  from_date: string;
  to_date: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reason: string | null;
  approved_by: string | null;
  created_at: string;
  worker?: { name: string; trade: string };
  approver?: { name: string };
}

export const leavesApi = {
  getLeaves: async () => {
    return apiClient.get<Leave[]>("/leaves");
  },
  getLeaveById: async (id: string) => {
    return apiClient.get<Leave>(`/leaves/${id}`);
  },
  createLeave: async (data: Partial<Leave>) => {
    return apiClient.post<Leave>("/leaves", data);
  },
  updateLeave: async (id: string, data: Partial<Leave>) => {
    return apiClient.patch<Leave>(`/leaves/${id}`, data);
  },
  approveLeave: async (id: string, approved: boolean) => {
    return apiClient.patch<Leave>(`/leaves/${id}`, {
      status: approved ? "APPROVED" : "REJECTED"
    });
  },
  deleteLeave: async (id: string) => {
    return apiClient.delete(`/leaves/${id}`);
  }
};
