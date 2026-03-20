import { apiClient } from "../../shared/lib/http.ts";
import type {
    LocationContextData,
    CalendarSummaryResponse,
    DayDataResponse,
    CalendarWeekResponse,
    CalendarDayFilters,
    AdminCreateGroupAppointmentPayload,
    RescheduleGroupPayload,
    AvailableSlotsRequest,
    AvailableSlotsResponse,
    CalendarBlockCreatePayload,
    CalendarBlockUpdatePayload,
} from "../../shared/types/calendar.ts";

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
    };
    if (filters) {
        if (filters.staffUserId != null) body.staffUserId = filters.staffUserId;
        if (filters.serviceId != null) body.serviceId = filters.serviceId;
        if (filters.status != null) body.status = filters.status;
        if (filters.clientName != null) body.clientName = filters.clientName;
        if (filters.customerId != null) body.customerId = filters.customerId;
        if (filters.customerEmail != null) body.customerEmail = filters.customerEmail;
        if (filters.customerPhone != null) body.customerPhone = filters.customerPhone;
        if (filters.customerFullName != null) body.customerFullName = filters.customerFullName;
    }
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
        ...filters,
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
        ...filters,
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

/** GET /appointments/group/:bookingGroupId (all appointments in a booking group for edit slider) */
export const getAppointmentGroupRequest = async (bookingGroupId: string): Promise<any[]> => {
    const { data } = await apiClient().get(`/appointments/group/${bookingGroupId}`);
    return Array.isArray(data) ? data : [];
}

// ─────────────────────────────────────────────────────────────
// Admin Appointment CRUD
// ─────────────────────────────────────────────────────────────

/** POST /appointments/admin-create-group (multi-service/bundle booking group) */
export const adminCreateAppointmentGroupRequest = async (payload: AdminCreateGroupAppointmentPayload): Promise<any> => {
    const { data } = await apiClient().post(`/appointments/admin-create-group`, payload);
    return data;
}

/** PUT /appointments/group/:bookingGroupId/reschedule (reschedule whole group) */
export const rescheduleGroupRequest = async (bookingGroupId: string, payload: RescheduleGroupPayload): Promise<any> => {
    const { data } = await apiClient().put(`/appointments/group/${bookingGroupId}/reschedule`, payload);
    return data;
}

/** PUT /appointments/:id (update status, reschedule, reassign, etc.) */
export const updateAppointmentRequest = async (appointmentId: number, payload: any): Promise<any> => {
    const { data } = await apiClient().put(`/appointments/${appointmentId}`, payload);
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
