import { apiClient } from "./client";

export interface Invoice {
  id: string;
  number: string;
  vendor_id: string;
  project_id?: string | null;
  site_id?: string | null;
  amount: number;
  tax_amount: number | null;
  total: number;
  due_date: string;
  status: "DRAFT" | "PENDING" | "APPROVED" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  notes: string | null;
  created_at: string;
  vendor?: { id?: string; name: string; phone?: string; email?: string };
  project?: { id: string; name: string };
  site?: { id: string; name: string };
  payments?: any[];
  attachments?: {
    id: string;
    file_name: string;
    secure_url: string;
    mime_type?: string;
  }[];
}

export interface InvoiceFilters {
  project_id?: string;
  vendor_id?: string;
  status?: string;
}

export const invoicesApi = {
  getInvoices: async (filters?: InvoiceFilters) => {
    const params = new URLSearchParams();
    if (filters?.project_id) params.set("project_id", filters.project_id);
    if (filters?.vendor_id) params.set("vendor_id", filters.vendor_id);
    if (filters?.status) params.set("status", filters.status);
    const qs = params.toString();
    return apiClient.get<Invoice[]>(`/invoices${qs ? `?${qs}` : ""}`);
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
