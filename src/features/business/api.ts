import { apiClient } from '../../shared/lib/http';
import type { BillingDetails, Business, UpdateBillingDetailsDTO, UpdateBusinessDTO } from './types';

export const getCurrentBusinessApi = async (): Promise<{ business: Business }> => {
  const { data } = await apiClient().get<{ business: Business }>('/business/profile');
  return data;
};

export interface UpdateBusinessResponse {
  message: string;
  shouldRedirectToMarketplace?: boolean;
}

export const updateBusinessApi = async (updateData: UpdateBusinessDTO): Promise<UpdateBusinessResponse> => {
  const { data } = await apiClient().post<UpdateBusinessResponse>('/business/update', updateData);
  return data;
};

export const getBillingDetailsApi = async (): Promise<BillingDetails> => {
  const { data } = await apiClient().get<{ billingDetails: BillingDetails }>(
    '/business/billing-details',
  );
  return data.billingDetails;
};

export const updateBillingDetailsApi = async (
  updateData: UpdateBillingDetailsDTO,
): Promise<{ message: string }> => {
  const { data } = await apiClient().put<{ message: string }>(
    '/business/billing-details',
    updateData,
  );
  return data;
};

