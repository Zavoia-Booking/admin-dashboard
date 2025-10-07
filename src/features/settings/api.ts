import { apiClient } from '../../shared/lib/http';
import type { PricingSummary, CheckoutPayload, CheckoutResponse, PendingPaymentCost, UpdateSeatsPayload, UpdateSeatsResponse } from './types';

export const getPricingSummary = async (): Promise<PricingSummary> => {
  const response = await apiClient().get<PricingSummary>('/billing/pricing-summary');
  return response.data;
};

export const getPendingPaymentCost = async (): Promise<PendingPaymentCost> => {
  const response = await apiClient().get<PendingPaymentCost>('/billing/pending-payment-cost');
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