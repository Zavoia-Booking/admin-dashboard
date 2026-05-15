import { apiClient } from '../../shared/lib/http';
import type { PreviewRequest, PreviewResult, SendRequest, TemplateMetadata } from './types';

export const emailTestApi = {
  getTemplates: async (): Promise<TemplateMetadata[]> => {
    const response = await apiClient().get<TemplateMetadata[]>('/email-test/templates');
    return response.data;
  },
  preview: async (payload: PreviewRequest): Promise<PreviewResult> => {
    const response = await apiClient().post<PreviewResult>('/email-test/preview', payload);
    return response.data;
  },
  send: async (payload: SendRequest): Promise<{ ok: true }> => {
    const response = await apiClient().post<{ ok: true }>('/email-test/send', payload);
    return response.data;
  },
};
