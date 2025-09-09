import type { CreateServicePayload, EditServicePayload } from "./types.ts";
import { apiClient } from "../../shared/lib/http";
import type { Service } from "../../shared/types/service.ts";

export const getServicesRequest = () => {
  return apiClient().get<Service[]>(`/services`);
}

export const createServicesRequest = (payload: CreateServicePayload) => {
  return apiClient().post<{ message: string }>('/services/create', payload);
}

export const editServicesRequest = (serviceId: number, payload: Partial<EditServicePayload>) => {
  return apiClient().post<{ message: string }>(`/services/edit/${serviceId}`, payload);
}

export const deleteServiceRequest = (serviceId: number) => {
  return apiClient().delete<{ message: string }>(`/services/${serviceId}`);
}