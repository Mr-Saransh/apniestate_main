import { apiClient } from './client';

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description?: string;
  site_id?: string | null;
  project_id?: string | null;
  vendor_id?: string | null;
  invoice_id?: string | null;
  user_id: string;
  date: string;
  receipt_url?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reference_id?: string | null;
  created_at: string;
  updated_at: string;
}

export const expensesApi = {
  getExpenses: (projectId?: string) => 
    apiClient.get<Expense[]>(`/expenses${projectId ? `?project_id=${projectId}` : ''}`),
    
  createExpense: (data: Partial<Expense>) => 
    apiClient.post<Expense>('/expenses', data),
};
