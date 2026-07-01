import { apiClient } from './client';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  site?: { name: string };
  material_id?: string;
  site_id?: string;
  stock_in?: number;
  stock_out?: number;
  avg_daily_usage?: number;
  days_remaining?: number;
  is_low_stock?: boolean;
  is_estimated?: boolean;
}

export interface InventoryTransactionInput {
  material_id: string;
  site_id: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  notes?: string | null;
}

export const inventoryApi = {
  getAll: () => apiClient.get<InventoryItem[]>('/inventory'),
  create: (data: Partial<InventoryItem>) => apiClient.post<InventoryItem>('/inventory', data),
  update: (id: string, data: Partial<InventoryItem>) => apiClient.patch<InventoryItem>(`/inventory/${id}`, data),
  delete: (id: string) => apiClient.delete<null>(`/inventory/${id}`),
  recordTransaction: (data: InventoryTransactionInput) => apiClient.post<any>('/inventory/transactions', data),
};

