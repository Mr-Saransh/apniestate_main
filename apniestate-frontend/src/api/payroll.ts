import { apiClient } from "./client";

export interface PayrollRecord {
  id: string;
  workerName: string;
  trade: string;
  dailyRate: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  leaveDays: number;
  overtimeHours: number;
  totalDaysInMonth: number;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  status: string;
  siteName: string | null;
  contractorName: string | null;
}

export const payrollApi = {
  getPayroll: async (month?: number, year?: number, siteId?: string) => {
    const params = new URLSearchParams();
    if (month) params.append("month", month.toString());
    if (year) params.append("year", year.toString());
    if (siteId) params.append("site_id", siteId);

    const queryStr = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<PayrollRecord[]>(`/payroll${queryStr}`);
  },
  generatePayroll: async (month?: number, year?: number, siteId?: string) => {
    return apiClient.post<PayrollRecord[]>("/payroll", { month, year, site_id: siteId });
  }
};
