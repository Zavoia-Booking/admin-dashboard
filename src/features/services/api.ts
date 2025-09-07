import type {CreateServicePayload, EditServicePayload} from "./types.ts";
import { apiClient } from "../../shared/lib/http";
import type {AuthResponse} from "../auth/types.ts";

export const getServicesRequest = () => {
     return apiClient().get<AuthResponse>(`/services`);
}

export const createServicesRequest = (payload: CreateServicePayload) => {
    return apiClient().post<AuthResponse>('/services', payload);
}

export const editServicesRequest = (serviceId: string, payload: Partial<EditServicePayload>) => {
    return apiClient().put<AuthResponse>(`/services/${serviceId}`, payload);
}

export const deleteServiceRequest = (serviceId: number | string) => {
    return apiClient().delete<AuthResponse>(`/services/${serviceId}`);
}