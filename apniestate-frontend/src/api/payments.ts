import { apiClient } from "./client";

export interface Payment {
  id: string;
  amount: number;
  vendor_id: string | null;
  contractor_id: string | null;
  invoice_id: string | null;
  date: string;
  method: "CASH" | "BANK_TRANSFER" | "CHEQUE" | "UPI" | "OTHER";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  reference: string | null;
  notes: string | null;
  created_at: string;
  vendor?: { name: string } | null;
  contractor?: { name: string } | null;
  invoice?: { number: string } | null;
}

export const paymentsApi = {
  getPayments: async () => {
    return apiClient.get<Payment[]>("/payments");
  },
  getPaymentById: async (id: string) => {
    return apiClient.get<Payment>(`/payments/${id}`);
  },
  createPayment: async (data: Partial<Payment>) => {
    return apiClient.post<Payment>("/payments", data);
  },
  updatePayment: async (id: string, data: Partial<Payment>) => {
    return apiClient.patch<Payment>(`/payments/${id}`, data);
  },
  deletePayment: async (id: string) => {
    return apiClient.delete(`/payments/${id}`);
  }
};
