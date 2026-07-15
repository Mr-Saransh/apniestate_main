import { apiClient } from './client';

export interface SubscriptionStatus {
  subscription_status: string;
  profile_completed: boolean;
  subscription: {
    id: string;
    type: string;
    status: string;
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
}

export const subscriptionApi = {
  completeProfile: (data: CompleteProfileData) =>
    apiClient.post<any>('/subscription/complete-profile', data),

  createOrder: () =>
    apiClient.post<any>('/subscription/create-order'),

  verifyPayment: (data: PaymentVerification) =>
    apiClient.post<any>('/subscription/verify-payment', data),

  requestTrial: () =>
    apiClient.post<any>('/subscription/request-trial'),

  getStatus: () =>
    apiClient.get<SubscriptionStatus>('/subscription/status'),

  createRenewOrder: () =>
    apiClient.get<any>('/subscription/renew'),

  verifyRenewal: (data: PaymentVerification) =>
    apiClient.post<any>('/subscription/renew', data),
};
