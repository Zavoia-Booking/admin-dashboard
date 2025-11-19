import type { CreateServicePayload, EditServicePayload } from "./types.ts";
import { apiClient } from "../../shared/lib/http";
import type { Service } from "../../shared/types/service.ts";
import type { FilterItem } from "../../shared/types/common.ts";

export const getServicesRequest = (payload: Array<FilterItem>, pagination?: { offset?: number; limit?: number }) => {
  return apiClient().post<{ services: Service[]; pagination: { offset: number; limit: number; total: number; hasMore: boolean } }>(`/services/list`, { 
    filters: payload,
    pagination: pagination || { offset: 0, limit: 20 }
  });
}

export const getServiceByIdRequest = (serviceId: number) => {
  return apiClient().get<Service>(`/services/${serviceId}`);
}

export const createServicesRequest = (payload: CreateServicePayload) => {
  return apiClient().post<{ message: string }>('/services/create', payload);
}

export const editServicesRequest = (serviceId: number, payload: Partial<EditServicePayload>) => {
  return apiClient().put<{ message: string }>(`/services/${serviceId}`, payload);
}

export const deleteServiceRequest = (serviceId: number) => {
  return apiClient().delete<{ message: string }>(`/services/${serviceId}`);
}