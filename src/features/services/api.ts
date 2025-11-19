import type { CreateServicePayload, EditServicePayload } from "./types.ts";
import { apiClient } from "../../shared/lib/http";
import type { Service } from "../../shared/types/service.ts";
import type { FilterItem } from "../../shared/types/common.ts";

export const getServicesRequest = (payload: Array<FilterItem>) => {
  return apiClient().post<Service[]>(`/services/list`, { 
    filters: payload
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