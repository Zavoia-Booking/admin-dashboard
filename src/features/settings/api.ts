import { apiClient } from '../../shared/lib/http';
import type { SubscriptionSummary, CheckoutPayload, CheckoutResponse, UpdateSeatsPayload, UpdateSeatsResponse } from './types';

export const getSubscriptionSummary = async (): Promise<SubscriptionSummary> => {
  const response = await apiClient().get<SubscriptionSummary>('/billing/subscription-summary');
  return response.data;
};

export const createCheckoutSession = async (payload: CheckoutPayload): Promise<CheckoutResponse> => {
  const response = await apiClient().post<CheckoutResponse>('/billing/checkout', payload);
  return response.data;
};

export const updateSeats = async (payload: UpdateSeatsPayload): Promise<UpdateSeatsResponse> => {
  const response = await apiClient().post<UpdateSeatsResponse>('/billing/update-seats', payload);
  return response.data;
};

export const getCustomerPortalUrl = async (returnUrl: string): Promise<{ url: string }> => {
  const response = await apiClient().post<{ url: string }>('/billing/customer-portal', { returnUrl });
  return response.data;
};

export const modifySubscription = async (action: 'cancel' | 'keep'): Promise<{ success: boolean }> => {
  const response = await apiClient().post<{ success: boolean }>(`/billing/modify-subscription?action=${action}`);
  return response.data;
};

export const cancelRemoval = async (): Promise<{ success: boolean }> => {
  const response = await apiClient().post<{ success: boolean }>('/billing/cancel-removal');
  return response.data;
};

// Logo upload for business info
export const uploadBusinessLogo = async (file: File): Promise<{ success: boolean; logo: string; logoKey: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Don't set Content-Type header manually - let axios handle it with the boundary
  const response = await apiClient().post<{ success: boolean; logo: string; logoKey: string }>(
    '/business/upload-logo',
    formData
  );
  return response.data;
};

// Update business info (including logo)
export interface UpdateBusinessInfoPayload {
  businessName?: string;
  industry?: string;
  businessEmail?: string;
  businessPhone?: string;
  timeZone?: string;
  bookingSlug?: string;
  logo?: string;
  logoKey?: string;
}

export const updateBusinessInfo = async (payload: UpdateBusinessInfoPayload): Promise<{ success: boolean }> => {
  const response = await apiClient().put<{ success: boolean }>('/business-info', payload);
  return response.data;
};