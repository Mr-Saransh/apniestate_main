import { apiClient } from "./client";

export interface PurchaseOrderItem {
  id?: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  gst_rate: number;
  total?: number;
  material?: any;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  project_id?: string;
  site_id?: string;
  created_by: string;
  status: 'DRAFT' | 'ISSUED' | 'APPROVED' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'PARTIAL' | 'DELIVERED';
  delivery_date?: string;
  total_amount: number;
  gst_amount: number;
  discount_amount: number;
  terms_conditions?: string;
  notes?: string;
  created_at: string;
  vendor?: any;
  items?: PurchaseOrderItem[];
}

export const purchaseOrdersApi = {
  getPurchaseOrders: async (filters?: { project_id?: string }) => {
    const params = new URLSearchParams();
    if (filters?.project_id) params.append('project_id', filters.project_id);
    const qs = params.toString();
    return apiClient.get<PurchaseOrder[]>(`/purchase-orders${qs ? `?${qs}` : ''}`);
  },
  
  getPurchaseOrder: async (id: string) => {
    return apiClient.get<PurchaseOrder>(`/purchase-orders/${id}`);
  },
  
  createPurchaseOrder: async (data: any) => {
    return apiClient.post<PurchaseOrder>('/purchase-orders', data);
  },
  
  updateStatus: async (id: string, status: string) => {
    return apiClient.patch<PurchaseOrder>(`/purchase-orders/${id}`, { status });
  },
};
