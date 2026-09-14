import { apiClient } from './client';

export interface DuePaymentRecord {
  id: string;
  due_id: string;
  company_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface FinanceDue {
  id: string;
  company_id: string;
  project_id?: string | null;
  vendor_id?: string | null;
  purchase_order_id?: string | null;
  title: string;
  party_name: string;
  party_phone?: string | null;
  party_type?: string | null;
  due_type: 'VENDOR_PURCHASE' | 'MANUAL_DUE' | 'LABOUR_WAGE' | 'SUBCONTRACTOR' | 'OTHER';
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date?: string | null;
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'CANCELLED';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  vendor?: { id: string; name: string; phone?: string; contact_person?: string } | null;
  project?: { id: string; name: string } | null;
  purchase_order?: { id: string; po_number: string; total_amount: number } | null;
  payments: DuePaymentRecord[];
}

export interface DuesSummary {
  total_due_amount: number;
  total_paid_amount: number;
  total_accrued_amount: number;
  count_pending: number;
  count_total: number;
}

export interface DuesResponse {
  dues: FinanceDue[];
  summary: DuesSummary;
}

export const duesApi = {
  getDues: (params?: { project_id?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.project_id) query.set('project_id', params.project_id);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<DuesResponse>(`/finance/dues${qs}`);
  },

  createDue: (data: {
    project_id?: string;
    vendor_id?: string;
    party_name: string;
    party_phone?: string;
    party_type?: string;
    due_type?: string;
    title: string;
    total_amount: number;
    due_date?: string;
    notes?: string;
  }) => apiClient.post<FinanceDue>('/finance/dues', data),

  payDue: (
    id: string,
    data: {
      amount: number;
      payment_method?: string;
      payment_date?: string;
      reference?: string;
      notes?: string;
    }
  ) => apiClient.post<FinanceDue>(`/finance/dues/${id}/pay`, data),
};
