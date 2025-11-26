import { apiClient } from '../../shared/lib/http';
import type { Business, UpdateBusinessDTO } from './types';

export const getCurrentBusinessApi = async (): Promise<{ business: Business }> => {
  const { data } = await apiClient().get<{ business: Business }>('/business/profile');
  return data;
};

export const updateBusinessApi = async (updateData: UpdateBusinessDTO): Promise<{ message: string }> => {
  const { data } = await apiClient().post<{ message: string }>('/business/update', updateData);
  return data;
};

