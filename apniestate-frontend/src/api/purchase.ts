import { apiClient as api } from './client';

export interface BOQItemSummary {
  id: string;
  name: string;
  unit: string;
  planned: number;
  used: number;
  ordered?: number;
  received?: number;
  remaining?: number;
  rate?: number;
  amount?: number;
  category?: string;
  code?: string | null;
  remarks?: string | null;
}

export interface BOQCategorySummary {
  id: string;
  name: string;
  items: BOQItemSummary[];
}

export interface MaterialRequestSummary {
  id: string;
  name: string;
  stage: string;
  qty: string;
  quantity?: number;
  unit?: string;
  date: string;
  priority?: string;
  notes?: string | null;
}

export interface OrderItemSummary {
  id: string;
  materialId: string;
  materialName: string;
  unit: string;
  orderedQty: number;
  receivedQty: number;
  pendingQty: number;
  unitPrice?: number;
  quotedPrice?: number;
  priceVariance?: number;
}

export interface OrderSummary {
  id: string;
  poNumber?: string;
  name: string;
  vendor: string;
  amount: string;
  numericAmount?: number;
  status: string;
  date: string;
  eta: string;
  items?: OrderItemSummary[];
  quotationId?: string | null;
  totalQuotedAmount?: number;
  totalNegotiatedSavings?: number;
  notes?: string;
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
  vendorId?: string;
  amount: string;
  received: string;
  receivedTime?: string;
  deliverySpeed?: 'ON_TIME' | 'SLOW' | 'DELAYED' | string;
  remarks?: string | null;
  quality: string;
  billUrl?: string | null;
  fullItems?: { name: string; qty: number; unit: string; price: number; total: number }[];
}

export interface QuotationSummary {
  id: string;
  vendorId?: string;
  vendor: string;
  vendorPhone?: string;
  material: string;
  rate: string;
  numericRate?: number;
  quantity?: number;
  unit?: string;
  total: string;
  numericTotal?: number;
  deliveryTime?: string;
  status: string;
  date?: string;
  items?: {
    materialId?: string;
    materialName: string;
    quantity: number;
    rate: number;
    unit?: string;
  }[];
}

export interface InventorySummary {
  id: string;
  material: string;
  stock: string;
  availableQuantity?: number;
  unit?: string;
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
  boq_categories?: BOQCategorySummary[];
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

