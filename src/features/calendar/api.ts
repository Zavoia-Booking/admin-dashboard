import { apiClient } from "../../shared/lib/http.ts";
import type {
    LocationContextData,
    CalendarSummaryResponse,
    DayDataResponse,
    CalendarWeekResponse,
    CalendarDayFilters,
    AdminCreateGroupAppointmentPayload,
    AvailableSlotsRequest,
    AvailableSlotsResponse,
    CalendarBlockCreatePayload,
    CalendarBlockUpdatePayload,
} from "../../shared/types/calendar.ts";
import { serializeCalendarDayFilters } from "./calendarFilters.ts";

/** Re-export for callers that import from api.ts */
export { serializeCalendarDayFilters };

// ─────────────────────────────────────────────────────────────
// Calendar API layer (view-driven data loading)
// ─────────────────────────────────────────────────────────────

/** GET /calendar/location-context/:locationId */
export const getLocationContextRequest = async (locationId: number): Promise<LocationContextData> => {
    const { data } = await apiClient().get<LocationContextData>(`/calendar/location-context/${locationId}`);
    return data;
}

/** POST /calendar/summary — optional filters apply to counts and previews */
export const getCalendarSummaryRequest = async (
    locationId: number,
    startDate: string,
    endDate: string,
    includePreview: boolean = false,
    filters?: CalendarDayFilters,
): Promise<CalendarSummaryResponse> => {
    const body: Record<string, unknown> = {
        locationId,
        startDate,
        endDate,
        includePreview,
        ...serializeCalendarDayFilters(filters),
    };
    const { data } = await apiClient().post<CalendarSummaryResponse>(`/calendar/summary`, body);
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
        ...serializeCalendarDayFilters(filters),
    });
    return data;
}

/** POST /calendar/week — returns { days, miniSummary } for grid + sidebar mini calendar */
export const getWeekDataRequest = async (
    locationId: number,
    weekStart: string,
    filters?: CalendarDayFilters,
): Promise<CalendarWeekResponse> => {
    const { data } = await apiClient().post<CalendarWeekResponse>(`/calendar/week`, {
        locationId,
        weekStart,
        ...serializeCalendarDayFilters(filters),
    });
    return data;
}

/** POST /calendar/available-slots — returns slot start times (ISO) where an appointment can be booked */
export const getAvailableSlotsRequest = async (
    payload: AvailableSlotsRequest,
    signal?: AbortSignal,
): Promise<AvailableSlotsResponse> => {
    const { data } = await apiClient().post<AvailableSlotsResponse>(`/calendar/available-slots`, payload, { signal });
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

/** POST /appointments/admin-create-group (multi-service/bundle booking group) */
export const adminCreateAppointmentGroupRequest = async (payload: AdminCreateGroupAppointmentPayload): Promise<any> => {
    const { data } = await apiClient().post(`/appointments/admin-create-group`, payload);
    return data;
}

/** PUT /appointments/:id (update status, reschedule, reassign, etc.) */
export const updateAppointmentRequest = async (appointmentId: string | number, payload: any): Promise<any> => {
    const { data } = await apiClient().put(`/appointments/${appointmentId}`, payload);
    return data;
}

/** PUT /appointments/bulk-status (bulk update status for multiple appointments) */
export const bulkUpdateAppointmentStatusRequest = async (ids: number[], status: string): Promise<any> => {
    const { data } = await apiClient().put('/appointments/bulk-status', { ids, status });
    return data;
}

/** POST /appointments/:id/cancel (cancel with reason + notification) */
export const cancelAppointmentRequest = async (
    appointmentId: number,
    payload: { reason: string; notifyCustomer: boolean; notificationMethods: string[] },
): Promise<any> => {
    const { data } = await apiClient().post(`/appointments/${appointmentId}/cancel`, payload);
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

/** DELETE /calendar-blocks/:id */
export const deleteCalendarBlockRequest = async (blockId: number): Promise<any> => {
    const { data } = await apiClient().delete(`/calendar-blocks/${blockId}`);
    return data;
}

/** PUT /calendar-blocks/:id */
export const updateCalendarBlockRequest = async (
    blockId: number,
    payload: CalendarBlockUpdatePayload,
): Promise<any> => {
    const { data } = await apiClient().put(`/calendar-blocks/${blockId}`, payload);
    return data;
}
