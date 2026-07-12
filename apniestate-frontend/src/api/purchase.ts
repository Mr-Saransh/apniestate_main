import { apiClient as api } from './client';

export interface BOQItemSummary {
  id: string;
  name: string;
  unit: string;
  planned: number;
  used: number;
}

export interface MaterialRequestSummary {
  id: string;
  name: string;
  stage: string;
  qty: string;
  date: string;
}

export interface OrderSummary {
  id: string;
  name: string;
  vendor: string;
  amount: string;
  status: string;
  date: string;
  eta: string;
}

export interface VendorSummary {
  id: string;
  name: string;
  category: string;
  rating: string;
  orders: number;
  due: string;
}

export interface ReceivedSummary {
  id: string;
  name: string;
  vendor: string;
  amount: string;
  received: string;
  quality: string;
}

export interface PurchaseSummaryResponse {
  boq_items: BOQItemSummary[];
  material_requests: MaterialRequestSummary[];
  orders: OrderSummary[];
  vendors: VendorSummary[];
  received: ReceivedSummary[];
}

export const purchaseApi = {
  getSummary: (projectId: string) => api.get<PurchaseSummaryResponse>(`/purchase/summary?project_id=${projectId}`),
  performAction: (action: string, payload: any) => api.post<{success: boolean}>(`/purchase/actions`, { action, payload }),
};
