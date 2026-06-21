import { apiClient } from './client';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  site?: { name: string };
}

export const inventoryApi = {
  getAll: () => apiClient.get<InventoryItem[]>('/inventory'),
  create: (data: Partial<InventoryItem>) => apiClient.post<InventoryItem>('/inventory', data),
  update: (id: string, data: Partial<InventoryItem>) => apiClient.patch<InventoryItem>(`/inventory/${id}`, data),
  delete: (id: string) => apiClient.delete<null>(`/inventory/${id}`),
};
