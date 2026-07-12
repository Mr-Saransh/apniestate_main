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
  gst: string;
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
  billUrl?: string | null;
  fullItems?: { name: string; qty: number; unit: string; price: number; total: number }[];
}

export interface QuotationSummary {
  id: string;
  vendor: string;
  material: string;
  rate: string;
  total: string;
  status: string;
}

export interface InventorySummary {
  id: string;
  material: string;
  stock: string;
  reorderLevel: string;
}

export interface ConsumptionLog {
  id: string;
  material: string;
  qty: string;
  date: string;
  time: string;
}

export interface PurchaseSummaryResponse {
  boq_items: BOQItemSummary[];
  material_requests: MaterialRequestSummary[];
  orders: OrderSummary[];
  vendors: VendorSummary[];
  received: ReceivedSummary[];
  quotations: QuotationSummary[];
  inventory: InventorySummary[];
  consumption_logs: ConsumptionLog[];
}

export const purchaseApi = {
  getSummary: (projectId: string) => api.get<PurchaseSummaryResponse>(`/purchase/summary?project_id=${projectId}`),
  performAction: (action: string, payload: any) => api.post<{success: boolean}>(`/purchase/actions`, { action, payload }),
};
