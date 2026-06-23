import { apiClient } from "./client";

export interface Budget {
  id: string;
  project_id: string;
  category: "MATERIALS" | "LABOUR" | "EQUIPMENT" | "OVERHEAD" | "SUBCONTRACT" | "CONTINGENCY" | "OTHER";
  allocated: number;
  spent: number;
  description: string | null;
  created_by: string;
  created_at: string;
  project?: { name: string };
  creator?: { name: string };
}

export const budgetsApi = {
  getBudgets: async () => {
    return apiClient.get<Budget[]>("/budgets");
  },
  getBudgetsByProject: async (projectId: string) => {
    return apiClient.get<Budget[]>(`/budgets?project_id=${projectId}`);
  },
  createBudget: async (data: Partial<Budget>) => {
    return apiClient.post<Budget>("/budgets", data);
  },
  updateBudget: async (id: string, data: Partial<Budget>) => {
    return apiClient.patch<Budget>(`/budgets/${id}`, data);
  },
  deleteBudget: async (id: string) => {
    return apiClient.delete(`/budgets/${id}`);
  }
};
