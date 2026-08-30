import { apiClient, type ApiResponse } from './client';

// ─── Types ───────────────────────────────────────────────────

export interface CrmLead {
  id: string;
  company_id: string;
  project_id?: string | null;
  name: string;
  initials?: string;
  avatar_color?: string;
  phone?: string | null;
  email?: string | null;
  type: 'BUYER' | 'SELLER' | 'INVESTOR' | 'RENTER';
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'SITE_VISIT' | 'NEGOTIATION' | 'BOOKED' | 'LOST';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  source?: string | null;
  budget?: string | null;
  city?: string | null;
  tags: string[];
  assigned_to?: string | null;
  created_by: string;
  notes?: string | null;
  last_contacted_at?: string | null;
  created_at: string;
  updated_at: string;
  assignee?: { id: string; name: string; email?: string } | null;
  creator?: { id: string; name: string; email?: string } | null;
  project?: { id: string; name: string } | null;
  _count?: { followups: number; deals: number };
  followups?: CrmFollowup[];
  activities?: CrmActivity[];
  deals?: CrmDeal[];
}

export interface CrmFollowup {
  id: string;
  company_id: string;
  lead_id: string;
  created_by: string;
  note?: string | null;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  due_at: string;
  completed_at?: string | null;
  outcome?: string | null;
  created_at: string;
  lead?: Pick<CrmLead, 'id' | 'name' | 'initials' | 'avatar_color' | 'phone' | 'status' | 'assigned_to'>;
}

export interface CrmActivity {
  id: string;
  company_id: string;
  lead_id?: string | null;
  project_id?: string | null;
  created_by: string;
  type: 'TASK' | 'SITE_VISIT' | 'MEETING' | 'CALL' | 'NOTE';
  title: string;
  description?: string | null;
  due_at?: string | null;
  completed: boolean;
  completed_at?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at: string;
  lead?: Pick<CrmLead, 'id' | 'name' | 'initials' | 'avatar_color' | 'assigned_to'> | null;
}

export interface CrmDeal {
  id: string;
  company_id: string;
  lead_id: string;
  project_id?: string | null;
  created_by: string;
  customer_name: string;
  property_name?: string | null;
  deal_value: number;
  commission: number;
  amount_received: number;
  payment_mode?: string;
  transaction_id?: string | null;
  deal_date: string;
  notes?: string | null;
  created_at: string;
  lead?: Pick<CrmLead, 'id' | 'name' | 'initials' | 'avatar_color' | 'assigned_to'>;
  project?: { id: string; name: string } | null;
}

export interface CrmProperty {
  id: string;
  company_id: string;
  project_id?: string | null;
  name: string;
  address?: string | null;
  price?: string | null;
  type?: string;
  beds?: number;
  baths?: number;
  sqft?: string | null;
  status?: string;
  image_url?: string | null;
  featured: boolean;
  created_at: string;
  project?: { id: string; name: string } | null;
}

export interface CrmTeamMember {
  id: string;
  membership_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  crm_role: 'BUILDER' | 'CRM_MANAGER' | 'TELECALLER';
  roles: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'RESIGNED';
  assigned_leads_count: number;
  last_active_at?: string | null;
  created_at: string;
}

export interface CrmPendingInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
  invited_by: string;
}

export interface CrmTeamResponse {
  members: CrmTeamMember[];
  pendingInvitations: CrmPendingInvitation[];
  userCrmRole: 'BUILDER' | 'CRM_MANAGER' | 'TELECALLER';
}

export interface CrmAnalytics {
  crmRole?: 'BUILDER' | 'CRM_MANAGER' | 'TELECALLER';
  // Telecaller metrics
  myLeads?: number;
  myBookings?: number;
  mySiteVisits?: number;
  recentLeads?: any[];
  todayFollowupList?: any[];
  // Shared / Manager / Builder metrics
  totalLeads?: number;
  activeLeads?: number;
  totalCustomers?: number;
  totalDeals?: number;
  conversionRate: number;
  totalRevenue?: number;
  totalCommission?: number;
  totalReceived?: number;
  pendingFollowups?: number;
  overdueFollowups?: number;
  todayFollowups?: number;
  pendingActivities?: number;
  unassignedLeads?: number;
  crmTeamCount?: number;
  pipeline: { stage: string; count: number }[];
  sources?: { name: string; value: number; color: string }[];
  teamPerformance?: {
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    role: string;
    assignedLeads: number;
    bookedLeads: number;
    conversionRate: number;
  }[];
  recentActivityLogs?: any[];
}

// ─── API Client ──────────────────────────────────────────────

export const crmApi = {
  // Leads
  getLeads: (params?: { search?: string; status?: string; project_id?: string; assigned_to?: string }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.set('search', params.search);
    if (params?.status) sp.set('status', params.status);
    if (params?.project_id) sp.set('project_id', params.project_id);
    if (params?.assigned_to) sp.set('assigned_to', params.assigned_to);
    const qs = sp.toString();
    return apiClient.get<CrmLead[]>(`/crm/leads${qs ? `?${qs}` : ''}`);
  },
  getLead: (id: string) => apiClient.get<CrmLead>(`/crm/leads/${id}`),
  createLead: (data: Partial<CrmLead>) => apiClient.post<CrmLead>('/crm/leads', data),
  updateLead: (id: string, data: Partial<CrmLead>) => apiClient.put<CrmLead>(`/crm/leads/${id}`, data),
  deleteLead: (id: string) => apiClient.delete(`/crm/leads/${id}`),
  importLeads: (leads: any[]) => apiClient.post('/crm/leads/import', { leads }),

  // Followups
  getFollowups: (filter?: string) => {
    const qs = filter ? `?filter=${filter}` : '';
    return apiClient.get<CrmFollowup[]>(`/crm/followups${qs}`);
  },
  createFollowup: (data: { lead_id: string; due_at: string; note?: string }) =>
    apiClient.post<CrmFollowup>('/crm/followups', data),
  updateFollowup: (id: string, data: Partial<CrmFollowup>) =>
    apiClient.put<CrmFollowup>(`/crm/followups/${id}`, data),
  deleteFollowup: (id: string) => apiClient.delete(`/crm/followups/${id}`),

  // Activities
  getActivities: (params?: { type?: string; completed?: string }) => {
    const sp = new URLSearchParams();
    if (params?.type) sp.set('type', params.type);
    if (params?.completed) sp.set('completed', params.completed);
    const qs = sp.toString();
    return apiClient.get<CrmActivity[]>(`/crm/activities${qs ? `?${qs}` : ''}`);
  },
  createActivity: (data: Partial<CrmActivity>) =>
    apiClient.post<CrmActivity>('/crm/activities', data),
  updateActivity: (id: string, data: Partial<CrmActivity>) =>
    apiClient.put<CrmActivity>(`/crm/activities/${id}`, data),
  deleteActivity: (id: string) => apiClient.delete(`/crm/activities/${id}`),

  // Deals
  getDeals: () => apiClient.get<CrmDeal[]>('/crm/deals'),
  createDeal: (data: Partial<CrmDeal>) => apiClient.post<CrmDeal>('/crm/deals', data),
  deleteDeal: (id: string) => apiClient.delete(`/crm/deals/${id}`),

  // Properties
  getProperties: () => apiClient.get<CrmProperty[]>('/crm/properties'),
  createProperty: (data: Partial<CrmProperty>) => apiClient.post<CrmProperty>('/crm/properties', data),
  updateProperty: (id: string, data: Partial<CrmProperty>) =>
    apiClient.put<CrmProperty>(`/crm/properties/${id}`, data),
  deleteProperty: (id: string) => apiClient.delete(`/crm/properties/${id}`),

  // Analytics
  getAnalytics: () => apiClient.get<CrmAnalytics>('/crm/analytics'),

  // Team Management
  getTeam: () => apiClient.get<CrmTeamResponse>('/crm/team'),
  createTeamMember: (data: { name: string; email: string; password: string; role: string; phone?: string }) =>
    apiClient.post<any>('/crm/team', data),
  inviteTeamMember: (data: { name?: string; email: string; password?: string; role: string; phone?: string }) =>
    apiClient.post<any>('/crm/team', data),
  updateTeamMember: (userId: string, data: { action: 'suspend' | 'activate' | 'remove'; reassignToUserId?: string }) =>
    apiClient.patch<any>(`/crm/team/${userId}`, data),
  reassignLeads: (data: { from_user_id?: string; to_user_id: string; lead_ids?: string[]; unassigned_only?: boolean }) =>
    apiClient.post<any>('/crm/team/reassign', data),

  // Smart Lead Distribution & Bulk Operations
  distributeLeads: (data: {
    lead_ids?: string[];
    distribute_unassigned?: boolean;
    strategy: 'ROUND_ROBIN' | 'LOAD_BALANCED' | 'CUSTOM';
    target_user_ids?: string[];
    custom_allocations?: { user_id: string; count: number }[];
  }) => apiClient.post<{ success: boolean; total_distributed: number; summary: { userId: string; name: string; count: number }[]; message: string }>('/crm/leads/distribute', data),

  bulkUpdateLeads: (data: {
    lead_ids: string[];
    action: 'ASSIGN' | 'UNASSIGN' | 'STATUS_CHANGE' | 'DELETE';
    assigned_to?: string | null;
    status?: string;
  }) => apiClient.post<{ success: boolean; count: number; message: string }>('/crm/leads/bulk', data),
};
