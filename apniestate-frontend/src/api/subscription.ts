import { apiClient } from './client';

export interface CommercialPlan {
  id: "PLAN_30K" | "PLAN_50K" | "PLAN_100K";
  name: string;
  badge: string;
  base_price: number;
  max_active_projects: number | "Unlimited";
  has_crm: boolean;
  has_construction: boolean;
  allowed_durations: number[];
  description: string;
  features: string[];
  pricing_matrix: {
    duration_months: number;
    total_price: number;
    monthly_equivalent: number;
  }[];
}

export interface CompanyEntitlements {
  company_id: string | null;
  plan_id: "PLAN_30K" | "PLAN_50K" | "PLAN_100K" | null;
  plan_name: string;
  badge: string;
  base_price: number;
  status: string;
  is_demo: boolean;
  is_active: boolean;
  is_expired: boolean;
  starts_at: string | null;
  expires_at: string | null;
  days_remaining: number;
  max_projects: number; // -1 means unlimited
  active_projects_count: number;
  can_create_project: boolean;
  can_create_project_reason?: string;
  has_crm: boolean;
  has_construction: boolean;
}

export interface SubscriptionStatus {
  subscription_status: string;
  profile_completed: boolean;
  entitlements?: CompanyEntitlements;
  subscription: {
    id: string;
    plan?: string;
    duration_months?: number;
    type?: string;
    status: string;
    price?: number;
    is_demo?: boolean;
    starts_at: string;
    expires_at: string;
    days_remaining: number;
  } | null;
}

export interface CompleteProfileData {
  name: string;
  phone: string;
  city: string;
  state: string;
}

export interface PaymentVerification {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  plan_id?: string;
  duration_months?: number;
}

export const subscriptionApi = {
  getPlans: () =>
    apiClient.get<CommercialPlan[]>('/subscription/plans'),

  getEntitlements: () =>
    apiClient.get<CompanyEntitlements>('/subscription/entitlements'),

  completeProfile: (data: CompleteProfileData) =>
    apiClient.post<any>('/subscription/complete-profile', data),

  createOrder: (plan_id: string = "PLAN_30K", duration_months: number = 4) =>
    apiClient.post<any>('/subscription/create-order', { plan_id, duration_months }),

  verifyPayment: (data: PaymentVerification) =>
    apiClient.post<any>('/subscription/verify-payment', data),

  requestTrial: () =>
    apiClient.post<any>('/subscription/request-trial'),

  getStatus: () =>
    apiClient.get<SubscriptionStatus>('/subscription/status'),

  createRenewOrder: (plan_id: string = "PLAN_30K", duration_months: number = 4) =>
    apiClient.get<any>(`/subscription/renew?plan_id=${plan_id}&duration_months=${duration_months}`),

  verifyRenewal: (data: PaymentVerification) =>
    apiClient.post<any>('/subscription/renew', data),
};
