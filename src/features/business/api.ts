import { apiClient } from '../../shared/lib/http';
import type { Business, UpdateBusinessDTO } from './types';

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

