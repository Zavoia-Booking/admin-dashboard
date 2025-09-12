import type { LocationType } from "../../shared/types/location.ts";
import { apiClient } from "../../shared/lib/http.ts";

export const getAppointmentsRequest = async (filters: any): Promise<unknown> => {
    const { data } = await apiClient().post<LocationType>(`/appointments/list`, filters);
    return data;
}

export const createAppointmentsRequest = async (appointment: any): Promise<unknown> => {
    const { data } = await apiClient().post<LocationType>(`/appointments/book`, appointment);
    return data;
}
