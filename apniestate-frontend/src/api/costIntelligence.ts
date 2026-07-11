import { apiClient } from "./client";

export interface CostIntelligenceDashboard {
  estimatedBudget: number;
  totalActualCost: number;
  variance: number;
  variancePercentage: number;
  breakdown: {
    materialCost: number;
    labourCost: number;
    equipmentCost: number;
    indirectCost: number;
  };
}

export const costIntelligenceApi = {
  getDashboard: async (project_id: string) => {
    return apiClient.get<CostIntelligenceDashboard>(`/cost-intelligence/dashboard?project_id=${project_id}`);
  }
};
