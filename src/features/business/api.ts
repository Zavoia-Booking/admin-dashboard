import { apiClient } from '../../shared/lib/http';
import type { Business } from './types';

export const getCurrentBusinessApi = async (): Promise<{ business: Business }> => {
  const { data } = await apiClient().get<{ business: Business }>('/business/me');
  return data;
};

