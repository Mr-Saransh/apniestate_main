import { apiClient } from './client';

export type TaskStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'COMPLETED_PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SubContractorExpense {
  id: string;
  assignment_id: string;
  amount: number;
  description?: string;
  bill_url?: string | null;
  status: ExpenseStatus;
  date: string;
  approved_at?: string | null;
  approved_by?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  assignment?: {
    id: string;
    work_type: string;
    allocated_budget: number;
    project?: { id: string; name: string };
    user?: { id: string; name: string; email: string };
  };
  approver?: { id: string; name: string } | null;
}

export interface SubContractorTask {
  id: string;
  assignment_id: string;
  description: string;
  deadline?: string | null;
  status: TaskStatus;
  completed_at?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  created_at: string;
  assignment?: {
    id: string;
    work_type: string;
    project?: { id: string; name: string };
    user?: { id: string; name: string };
  };
  approver?: { id: string; name: string } | null;
}

export interface SubContractorAssignment {
  id: string;
  user_id: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    is_active?: boolean;
  };
  project_id: string;
  project?: {
    id: string;
    name: string;
    status?: string;
    city?: string | null;
  };
  work_type: string;
  allocated_budget: number;
  used_budget: number;
  remaining_budget: number;
  pending_expense_amount?: number;
  pending_tasks_count: number;
  completed_awaiting_approval_count: number;
  approved_tasks_count: number;
  expenses: SubContractorExpense[];
  tasks: SubContractorTask[];
  created_at: string;
}

export interface CreateSubContractorPayload {
  name: string;
  email: string;
  password: string;
  project_id: string;
  work_type: string;
  allocated_budget: number;
  phone?: string;
}

export interface AssignSubContractorPayload {
  user_id: string;
  project_id: string;
  work_type: string;
  allocated_budget: number;
}

export interface CreateExpensePayload {
  assignment_id: string;
  amount: number;
  description: string;
  bill_url?: string | null;
}

export interface CreateTaskPayload {
  assignment_id: string;
  description: string;
  deadline?: string | null;
}

export interface UpdateTaskPayload {
  description?: string;
  deadline?: string | null;
  status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED_PENDING_APPROVAL';
}

export const subcontractorsApi = {
  // Builder APIs
  getAll: (projectId?: string) =>
    apiClient.get<SubContractorAssignment[]>(
      `/subcontractors${projectId ? `?project_id=${projectId}` : ''}`
    ),

  getById: (assignmentId: string) =>
    apiClient.get<SubContractorAssignment>(`/subcontractors/${assignmentId}`),

  create: (data: CreateSubContractorPayload) =>
    apiClient.post<{
      assignment: SubContractorAssignment;
      user: { id: string; name: string; email: string };
    }>('/subcontractors', data),

  assignToProject: (data: AssignSubContractorPayload) =>
    apiClient.post<SubContractorAssignment>('/subcontractors/assignments', data),

  reviewExpense: (
    expenseId: string,
    data: { status: 'APPROVED' | 'REJECTED'; rejection_reason?: string }
  ) => apiClient.patch<SubContractorExpense>(`/subcontractors/expenses/${expenseId}`, data),

  reviewTask: (taskId: string, action: 'APPROVE' | 'REJECT') =>
    apiClient.patch<SubContractorTask>(`/subcontractors/tasks/${taskId}/approve`, { action }),

  // Sub Contractor Portal APIs
  getMyAssignments: () =>
    apiClient.get<SubContractorAssignment[]>('/subcontractors/me'),

  getExpenses: (assignmentId?: string, projectId?: string) => {
    const params = new URLSearchParams();
    if (assignmentId) params.append('assignment_id', assignmentId);
    if (projectId) params.append('project_id', projectId);
    const qs = params.toString();
    return apiClient.get<SubContractorExpense[]>(`/subcontractors/expenses${qs ? `?${qs}` : ''}`);
  },

  submitExpense: (data: CreateExpensePayload) =>
    apiClient.post<SubContractorExpense>('/subcontractors/expenses', data),

  getTasks: (assignmentId?: string, projectId?: string) => {
    const params = new URLSearchParams();
    if (assignmentId) params.append('assignment_id', assignmentId);
    if (projectId) params.append('project_id', projectId);
    const qs = params.toString();
    return apiClient.get<SubContractorTask[]>(`/subcontractors/tasks${qs ? `?${qs}` : ''}`);
  },

  createTask: (data: CreateTaskPayload) =>
    apiClient.post<SubContractorTask>('/subcontractors/tasks', data),

  updateTask: (taskId: string, data: UpdateTaskPayload) =>
    apiClient.patch<SubContractorTask>(`/subcontractors/tasks/${taskId}`, data),
};
