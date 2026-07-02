import { apiClient } from '../../shared/lib/http';
import type {
  SubscriptionSummary,
  CheckoutPayload,
  CheckoutResponse,
  UpdateSeatsPayload,
  UpdateSeatsResponse,
  SmsPackagesResponse,
  SmsBalanceResponse,
  SmsPurchasesResponse,
  SmsCheckoutPayload,
  SmsCheckoutResponse,
  BusinessInvoicesResponse,
  PlansListResponse,
  ChangePlanResponse,
  CancelPlanChangeResponse,
} from './types';

export const getSubscriptionSummary = async (): Promise<SubscriptionSummary> => {
  const response = await apiClient().get<SubscriptionSummary>('/billing/subscription-summary');
  return response.data;
};

export const createCheckoutSession = async (payload: CheckoutPayload): Promise<CheckoutResponse> => {
  const response = await apiClient().post<CheckoutResponse>('/billing/checkout', payload);
  return response.data;
};

export const createLtdSeatsCheckoutSession = async (payload: CheckoutPayload): Promise<CheckoutResponse> => {
  const response = await apiClient().post<CheckoutResponse>('/billing/ltd-seats-checkout', payload);
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

export const abortPendingPayment = async (): Promise<{ success: boolean }> => {
  const response = await apiClient().post<{ success: boolean }>('/billing/abort-pending-payment');
  return response.data;
};

// Self-serve plans (STANDARD + PLUS) with pricing for the business's country
export const getPlansList = async (): Promise<PlansListResponse> => {
  const response = await apiClient().get<PlansListResponse>('/plans/list');
  return response.data;
};

// Change plan on an active subscription: upgrades apply immediately (prorated,
// SCA-capable), downgrades are scheduled at the end of the billing period.
export const changePlan = async (payload: { planId: number }): Promise<ChangePlanResponse> => {
  const response = await apiClient().post<ChangePlanResponse>('/billing/change-plan', payload);
  return response.data;
};

// Cancel a scheduled plan change. Releases the shared Stripe schedule, so it
// ALSO clears any scheduled seat change — the UI must surface this caveat.
export const cancelPlanChange = async (): Promise<CancelPlanChangeResponse> => {
  const response = await apiClient().post<CancelPlanChangeResponse>('/billing/cancel-plan-change');
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
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  websiteUrl?: string;
  pinterestUrl?: string;
}

export const updateBusinessInfo = async (payload: UpdateBusinessInfoPayload): Promise<{ success: boolean }> => {
  const response = await apiClient().put<{ success: boolean }>('/business-info', payload);
  return response.data;
};

// SMS API Functions
export const getSmsPackages = async (): Promise<SmsPackagesResponse> => {
  const response = await apiClient().get<SmsPackagesResponse>('/sms/packages');
  return response.data;
};

export const getSmsBalance = async (): Promise<SmsBalanceResponse> => {
  const response = await apiClient().get<SmsBalanceResponse>('/sms/balance');
  return response.data;
};

export const createSmsCheckout = async (payload: SmsCheckoutPayload): Promise<SmsCheckoutResponse> => {
  const response = await apiClient().post<SmsCheckoutResponse>('/sms/checkout', payload);
  return response.data;
};

export const getSmsPurchases = async (params?: { limit?: number; cursor?: number }): Promise<SmsPurchasesResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.cursor) queryParams.append('cursor', params.cursor.toString());

  const queryString = queryParams.toString();
  const url = queryString ? `/sms/purchases?${queryString}` : '/sms/purchases';

  const response = await apiClient().get<SmsPurchasesResponse>(url);
  return response.data;
};

export const getBusinessInvoices = async (params?: { limit?: number; cursor?: number }): Promise<BusinessInvoicesResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.cursor) queryParams.append('cursor', params.cursor.toString());

  const queryString = queryParams.toString();
  const url = queryString ? `/billing/invoices?${queryString}` : '/billing/invoices';

  const response = await apiClient().get<BusinessInvoicesResponse>(url);
  return response.data;
};

// ── Mobile push notification preference (business owner) ──
// Governs which appointment push notifications the owner receives on the
// Zavoia mobile app. Stored per-user in the API and read when sending pushes.
export type MobilePushPreference = 'my_notifications' | 'all_notifications' | 'no_notifications';

export const getMobilePushPreference = async (): Promise<{ preference: MobilePushPreference }> => {
  const response = await apiClient().get<{ preference: MobilePushPreference }>('/business-push/preference');
  return response.data;
};

export const updateMobilePushPreference = async (
  preference: MobilePushPreference,
): Promise<{ preference: MobilePushPreference }> => {
  const response = await apiClient().put<{ preference: MobilePushPreference }>('/business-push/preference', { preference });
  return response.data;
};