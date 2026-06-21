import { apiClient, ApiResponse } from './client';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  assignee?: { id: string; name: string };
  creator?: { id: string; name: string };
  site?: { id: string; name: string };
  created_at: string;
}

export const tasksApi = {
  getAll: () => apiClient.get<Task[]>('/tasks'),
  create: (data: Partial<Task>) => apiClient.post<Task>('/tasks', data),
  update: (id: string, data: Partial<Task>) => apiClient.patch<Task>(`/tasks/${id}`, data),
  delete: (id: string) => apiClient.delete<null>(`/tasks/${id}`),
};
