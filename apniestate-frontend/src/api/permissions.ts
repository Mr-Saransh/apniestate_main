import { apiClient } from "./client";

export interface PermissionsResponse {
  role: string;
  permissions: string[];
  isAdmin: boolean;
}

export const permissionsApi = {
  getMyPermissions: async () => {
    return apiClient.get<PermissionsResponse>("/permissions/my");
  },
  getRolePermissions: async (role: string) => {
    return apiClient.get<any>(`/permissions/${role}`);
  },
  updateRolePermissions: async (role: string, permissionIds: string[]) => {
    return apiClient.post<any>(`/permissions/${role}`, { permission_ids: permissionIds });
  },
  getAllPermissions: async () => {
    return apiClient.get<any>("/permissions");
  },
  seedPermissions: async () => {
    return apiClient.post<any>("/permissions");
  }
};
