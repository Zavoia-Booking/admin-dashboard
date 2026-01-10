import { apiClient } from '../lib/http';
import type { Industry } from '../types/industry';

export const industryApi = {
  getAll: async (): Promise<Industry[]> => {
    const response = await apiClient().get<Industry[]>('/industries');
    return response.data;
  },
};

