import { apiClient } from "./client";

export interface Invoice {
  id: string;
  number: string;
  vendor_id: string;
  amount: number;
  tax_amount: number | null;
  total: number;
  due_date: string;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  notes: string | null;
  created_at: string;
  vendor?: { name: string };
  payments?: any[];
}

export const invoicesApi = {
  getInvoices: async () => {
    return apiClient.get<Invoice[]>("/invoices");
  },
  getInvoiceById: async (id: string) => {
    return apiClient.get<Invoice>(`/invoices/${id}`);
  },
  createInvoice: async (data: Partial<Invoice>) => {
    return apiClient.post<Invoice>("/invoices", data);
  },
  updateInvoice: async (id: string, data: Partial<Invoice>) => {
    return apiClient.patch<Invoice>(`/invoices/${id}`, data);
  },
  deleteInvoice: async (id: string) => {
    return apiClient.delete(`/invoices/${id}`);
  }
};
