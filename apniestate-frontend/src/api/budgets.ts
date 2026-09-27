import { apiClient } from "./client";

export interface Budget {
  id: string;
  project_id: string;
  category: "MATERIALS" | "LABOUR" | "EQUIPMENT" | "OVERHEAD" | "SUBCONTRACT" | "CONTINGENCY" | "MATERIAL" | "GENERAL" | "STOCK_TRANSFER" | "SUBCONTRACTS" | "BROKER" | "OFFICE" | "OTHER";
  allocated: number;
  spent: number;
  remaining?: number;
  utilization?: number;
  is_overrun?: boolean;
  overrun_amount?: number;
  description: string | null;
  created_by: string;
  created_at: string;
  project?: { id?: string; name: string; budget?: number | null };
  creator?: { name: string };
}

export interface ProjectBudgetSummary {
  total_allocated: number;
  total_spent: number;
  variance: number;
  utilization_rate: number;
  has_leakage: boolean;
  total_leakage_amount: number;
  leakages: Array<{
    category: string;
    allocated: number;
    spent: number;
    leakage_amount: number;
    utilization: number;
  }>;
  by_category: Array<{
    id: string;
    category: string;
    allocated: number;
    spent: number;
    remaining: number;
    utilization: number;
    is_overrun: boolean;
    overrun_amount: number;
  }>;
}

export const budgetsApi = {
  getBudgets: async () => {
    return apiClient.get<Budget[]>("/budgets");
  },
  getBudgetsByProject: async (projectId: string) => {
    return apiClient.get<Budget[]>(`/budgets?project_id=${projectId}`);
  },
  getProjectBudgetSummary: async (projectId: string) => {
    return apiClient.get<ProjectBudgetSummary>(`/budgets?project_id=${projectId}&summary=true`);
  },
  createBudget: async (data: Partial<Budget>) => {
    return apiClient.post<Budget>("/budgets", data);
  },
  updateBudget: async (id: string, data: Partial<Budget>) => {
    return apiClient.patch<Budget>(`/budgets/${id}`, data);
  },
  deleteBudget: async (id: string) => {
    return apiClient.delete(`/budgets/${id}`);
  },
  applyPreset: async (projectId: string, totalBudget: number) => {
    return apiClient.post<Budget[]>("/budgets?preset=true", {
      project_id: projectId,
      total_budget: totalBudget,
    });
  },
};

