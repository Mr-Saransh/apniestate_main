import { apiClient } from "./client";

export interface Vendor {
  id: string;
  name: string;
  type: "MATERIAL_SUPPLIER" | "EQUIPMENT_VENDOR" | "SERVICE_PROVIDER" | "SUBCONTRACTOR_VENDOR";
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  category: string | null;
  gst_number: string | null;
  pan_number: string | null;
  is_active: boolean;
  created_at: string;
}

export const vendorsApi = {
  getVendors: async () => {
    return apiClient.get<Vendor[]>("/vendors");
  },
  getVendorById: async (id: string) => {
    return apiClient.get<Vendor>(`/vendors/${id}`);
  },
  createVendor: async (data: Partial<Vendor>) => {
    return apiClient.post<Vendor>("/vendors", data);
  },
  updateVendor: async (id: string, data: Partial<Vendor>) => {
    return apiClient.patch<Vendor>(`/vendors/${id}`, data);
  },
  deleteVendor: async (id: string) => {
    return apiClient.delete(`/vendors/${id}`);
  }
};
