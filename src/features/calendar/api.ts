import { apiClient } from "../../shared/lib/http.ts";
import type {
    LocationContextData,
    CalendarSummaryResponse,
    DayDataResponse,
    CalendarDayFilters,
    AdminCreateAppointmentPayload,
    CalendarBlockCreatePayload,
    CalendarBlockUpdatePayload,
} from "../../shared/types/calendar.ts";

// ─────────────────────────────────────────────────────────────
// Legacy API (kept during migration)
// ─────────────────────────────────────────────────────────────

export const getAppointmentsRequest = async (filters: any): Promise<unknown> => {
    const { data } = await apiClient().post(`/appointments/list`, filters);
    return data;
}

export const createAppointmentsRequest = async (appointment: any): Promise<unknown> => {
    const { data } = await apiClient().post(`/appointments/book`, appointment);
    return data;
}

// ─────────────────────────────────────────────────────────────
// New calendar API layer (view-driven data loading)
// ─────────────────────────────────────────────────────────────

/** GET /calendar/location-context/:locationId */
export const getLocationContextRequest = async (locationId: number): Promise<LocationContextData> => {
    const { data } = await apiClient().get<LocationContextData>(`/calendar/location-context/${locationId}`);
    return data;
}

/** POST /calendar/summary */
export const getCalendarSummaryRequest = async (
    locationId: number,
    startDate: string,
    endDate: string,
    includePreview: boolean = false,
): Promise<CalendarSummaryResponse> => {
    const { data } = await apiClient().post<CalendarSummaryResponse>(`/calendar/summary`, {
        locationId,
        startDate,
        endDate,
        includePreview,
    });
    return data;
}

/** POST /calendar/day */
export const getDayDataRequest = async (
    locationId: number,
    date: string,
    filters?: CalendarDayFilters,
): Promise<DayDataResponse> => {
    const { data } = await apiClient().post<DayDataResponse>(`/calendar/day`, {
        locationId,
        date,
        ...filters,
    });
    return data;
}

/** GET /appointments/:id (existing endpoint, for appointment detail) */
export const getAppointmentDetailRequest = async (appointmentId: number): Promise<any> => {
    const { data } = await apiClient().get(`/appointments/${appointmentId}`);
    return data;
}

// ─────────────────────────────────────────────────────────────
// Admin Appointment CRUD
// ─────────────────────────────────────────────────────────────

/** POST /appointments/admin-create */
export const adminCreateAppointmentRequest = async (payload: AdminCreateAppointmentPayload): Promise<any> => {
    const { data } = await apiClient().post(`/appointments/admin-create`, payload);
    return data;
}

/** PATCH /appointments/:id (update status, reschedule, etc.) */
export const updateAppointmentRequest = async (appointmentId: number, payload: any): Promise<any> => {
    const { data } = await apiClient().patch(`/appointments/${appointmentId}`, payload);
    return data;
}

// ─────────────────────────────────────────────────────────────
// Calendar Block CRUD
// ─────────────────────────────────────────────────────────────

/** POST /calendar-blocks */
export const createCalendarBlockRequest = async (payload: CalendarBlockCreatePayload): Promise<any> => {
    const { data } = await apiClient().post(`/calendar-blocks`, payload);
    return data;
}

/** PUT /calendar-blocks/:id */
export const updateCalendarBlockRequest = async (blockId: number, payload: CalendarBlockUpdatePayload): Promise<any> => {
    const { data } = await apiClient().put(`/calendar-blocks/${blockId}`, payload);
    return data;
}

/** DELETE /calendar-blocks/:id */
export const deleteCalendarBlockRequest = async (blockId: number): Promise<any> => {
    const { data } = await apiClient().delete(`/calendar-blocks/${blockId}`);
    return data;
}
