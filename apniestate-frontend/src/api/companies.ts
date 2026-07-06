import { apiClient } from './client';
import type { AuthUser } from './auth';

export interface CompanyInfo {
  id: string;
  name: string;
  created_at: string;
  _count?: {
    users: number;
    projects: number;
  };
}

export interface CompanySelectResponse {
  user: AuthUser;
  accessToken: string;
  company: CompanyInfo;
}

export const companiesApi = {
  getMyCompanies: () =>
    apiClient.get<CompanyInfo[]>('/companies'),

  selectCompany: (companyId: string) =>
    apiClient.post<CompanySelectResponse>('/companies/select', { company_id: companyId }),

  deleteCompany: (id: string) => apiClient.delete(`/companies/delete?id=${id}`),

  createCompany: (name: string) =>
    apiClient.post<CompanySelectResponse>('/companies/create', { name }),
};
