import { all, call, put, select, takeLatest } from "redux-saga/effects";
import type { ActionType } from "typesafe-actions";
import {
    setSelectedLocationAction,
    fetchLocationContext,
    fetchCalendarSummary,
    fetchDayData,
    fetchWeekData,
    setDayFiltersAction,
    setSelectedDateAction,
    setDisplayedMonthAction,
    setDisplayedWeekAction,
    setViewModeAction,
    adminCreateAppointmentGroup,
    rescheduleAppointmentGroup,
    updateAppointmentStatus,
    updateAppointment,
    setUpdateConflictOffer,
    cancelAppointment,
    createCalendarBlock,
    deleteCalendarBlock,
    updateCalendarBlock,
} from "./actions.ts";
import {
    getLocationContextRequest,
    getCalendarSummaryRequest,
    getDayDataRequest,
    getWeekDataRequest,
    adminCreateAppointmentGroupRequest,
    rescheduleGroupRequest,
    updateAppointmentRequest,
    cancelAppointmentRequest,
    createCalendarBlockRequest,
    deleteCalendarBlockRequest,
    updateCalendarBlockRequest,
} from "./api.ts";
import { AppointmentViewMode } from "./types.ts";
import {
    getSelectedLocationId,
    getSelectedDate,
    getViewModeSelector,
    getDayFilters,
    getMonthViewDisplayStart,
    getWeekViewDisplayStart,
} from "./selectors.ts";
import { getDateRangeForMode, toLocalDateString } from "./utils.ts";
import type { CalendarDayFilters, DayDataResponse, LocationContextData, CalendarSummaryResponse } from "../../shared/types/calendar.ts";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────
// Location-first calendar sagas
// ─────────────────────────────────────────────────────────────

/**
 * When a location is selected, fetch its context then load only the data
 * for the current view (one call: day, week, or summary).
 */
function* handleSetSelectedLocation(action: ActionType<typeof setSelectedLocationAction>): Generator<any, void, any> {
    const locationId = action.payload;
    if (!locationId) return;

    // 1. Fetch location context
    yield put(fetchLocationContext.request(locationId));

    // 2. Fetch only the data for the current view
    const selectedDate: Date = yield select(getSelectedDate);
    const viewMode: AppointmentViewMode = yield select(getViewModeSelector);
    const monthViewStart: Date | null = yield select(getMonthViewDisplayStart);
    const weekViewStart: Date | null = yield select(getWeekViewDisplayStart);
    const dayFilters: CalendarDayFilters = yield select(getDayFilters);
    const { startDate, endDate } = getDateRangeForMode(selectedDate, viewMode, monthViewStart, weekViewStart);

    if (viewMode === AppointmentViewMode.DAY) {
        yield put(fetchDayData.request({
            locationId,
            date: startDate,
            filters: dayFilters,
        }));
    } else if (viewMode === AppointmentViewMode.WEEK && weekViewStart) {
        const weekStartStr = toLocalDateString(weekViewStart);
        yield put(fetchWeekData.request({ locationId, weekStart: weekStartStr, filters: dayFilters }));
    } else if (viewMode === AppointmentViewMode.MONTH) {
        yield put(fetchCalendarSummary.request({
            locationId,
            startDate,
            endDate,
            includePreview: false,
            filters: dayFilters,
        }));
    }
}

/**
 * Fetch location context (working hours, staff, booking settings, and when extended: services + teamMembers).
 * Single call per location; reducer stores both context and assignment data from the response.
 */
function* handleFetchLocationContext(action: ActionType<typeof fetchLocationContext.request>): Generator<any, void, any> {
    try {
        const data: LocationContextData = yield call(getLocationContextRequest, action.payload);
        yield put(fetchLocationContext.success(data));
    } catch (error: any) {
        yield put(fetchLocationContext.failure(error));
    }
}

/**
 * Fetch calendar summary (month/week overview with counts).
 */
function* handleFetchCalendarSummary(action: ActionType<typeof fetchCalendarSummary.request>): Generator<any, void, any> {
    const { locationId, startDate, endDate, includePreview, filters } = action.payload;

    try {
        const data: CalendarSummaryResponse = yield call(
            getCalendarSummaryRequest,
            locationId,
            startDate,
            endDate,
            includePreview,
            filters,
        );
        yield put(fetchCalendarSummary.success(data.days));
    } catch (error: any) {
        yield put(fetchCalendarSummary.failure(error));
    }
}

/**
 * Fetch day data (all appointments + blocks for a single day).
 */
function* handleFetchDayData(action: ActionType<typeof fetchDayData.request>): Generator<any, void, any> {
    const { locationId, date, filters } = action.payload;

    try {
        const data: DayDataResponse = yield call(getDayDataRequest, locationId, date, filters);
        yield put(fetchDayData.success(data));
    } catch (error: any) {
        yield put(fetchDayData.failure(error));
    }
}

/**
 * When the selected date changes, refetch only the data for the current view (one call).
 */
function* handleSetSelectedDate(_action: ActionType<typeof setSelectedDateAction>): Generator<any, void, any> {
    const locationId: number | null = yield select(getSelectedLocationId);
    if (!locationId) return;

    const selectedDate: Date = yield select(getSelectedDate);
    const viewMode: AppointmentViewMode = yield select(getViewModeSelector);
    const monthViewStart: Date | null = yield select(getMonthViewDisplayStart);
    const weekViewStart: Date | null = yield select(getWeekViewDisplayStart);
    const dayFilters: CalendarDayFilters = yield select(getDayFilters);
    const { startDate, endDate } = getDateRangeForMode(selectedDate, viewMode, monthViewStart, weekViewStart);

    if (viewMode === AppointmentViewMode.DAY) {
        yield put(fetchDayData.request({
            locationId,
            date: startDate,
            filters: dayFilters,
        }));
    } else if (viewMode === AppointmentViewMode.WEEK && weekViewStart) {
        const weekStartStr = toLocalDateString(weekViewStart);
        yield put(fetchWeekData.request({ locationId, weekStart: weekStartStr, filters: dayFilters }));
    } else if (viewMode === AppointmentViewMode.MONTH) {
        yield put(fetchCalendarSummary.request({
            locationId,
            startDate,
            endDate,
            includePreview: false,
            filters: dayFilters,
        }));
    }
}

/**
 * When displayed month changes (month view prev/next), refetch summary for that month.
 */
function* handleSetDisplayedMonth(_action: ActionType<typeof setDisplayedMonthAction>): Generator<any, void, any> {
    const locationId: number | null = yield select(getSelectedLocationId);
    if (!locationId) return;

    const monthViewStart: Date | null = yield select(getMonthViewDisplayStart);
    if (!monthViewStart) return;

    const dayFilters: CalendarDayFilters = yield select(getDayFilters);
    const { startDate, endDate } = getDateRangeForMode(monthViewStart, AppointmentViewMode.MONTH, monthViewStart);
    yield put(fetchCalendarSummary.request({
        locationId,
        startDate,
        endDate,
        includePreview: false,
        filters: dayFilters,
    }));
}

/**
 * When displayed week changes (week view prev/next), refetch only week data (one call).
 */
function* handleSetDisplayedWeek(_action: ActionType<typeof setDisplayedWeekAction>): Generator<any, void, any> {
    const locationId: number | null = yield select(getSelectedLocationId);
    if (!locationId) return;

    const weekViewStart: Date | null = yield select(getWeekViewDisplayStart);
    if (!weekViewStart) return;

    const dayFilters: CalendarDayFilters = yield select(getDayFilters);
    const weekStartStr = toLocalDateString(weekViewStart);
    yield put(fetchWeekData.request({ locationId, weekStart: weekStartStr, filters: dayFilters }));
}

/**
 * Fetch full week data via dedicated week endpoint (single request).
 */
function* handleFetchWeekData(action: ActionType<typeof fetchWeekData.request>): Generator<any, void, any> {
    const { locationId, weekStart, filters } = action.payload;

    try {
        const dayFilters: CalendarDayFilters = filters ?? (yield select(getDayFilters));
        const response = yield call(
            getWeekDataRequest,
            locationId,
            weekStart,
            dayFilters,
        );
        yield put(fetchWeekData.success(response));
    } catch (error: any) {
        yield put(fetchWeekData.failure(error));
    }
}

/**
 * When view mode changes, fetch only the data for the new view (one call).
 */
function* handleSetViewMode(_action: ActionType<typeof setViewModeAction>): Generator<any, void, any> {
    const locationId: number | null = yield select(getSelectedLocationId);
    if (!locationId) return;

    const selectedDate: Date = yield select(getSelectedDate);
    const viewMode: AppointmentViewMode = yield select(getViewModeSelector);
    const monthViewStart: Date | null = yield select(getMonthViewDisplayStart);
    const weekViewStart: Date | null = yield select(getWeekViewDisplayStart);
    const dayFilters: CalendarDayFilters = yield select(getDayFilters);
    const { startDate, endDate } = getDateRangeForMode(selectedDate, viewMode, monthViewStart, weekViewStart);

    if (viewMode === AppointmentViewMode.DAY) {
        yield put(fetchDayData.request({
            locationId,
            date: startDate,
            filters: dayFilters,
        }));
    } else if (viewMode === AppointmentViewMode.WEEK && weekViewStart) {
        const weekStartStr = toLocalDateString(weekViewStart);
        yield put(fetchWeekData.request({ locationId, weekStart: weekStartStr, filters: dayFilters }));
    } else if (viewMode === AppointmentViewMode.MONTH) {
        yield put(fetchCalendarSummary.request({
            locationId,
            startDate,
            endDate,
            includePreview: false,
            filters: dayFilters,
        }));
    }
}

/**
 * When day filters change, refetch only the data for the current view (one call per view).
 */
function* handleSetDayFilters(_action: ActionType<typeof setDayFiltersAction>): Generator<any, void, any> {
    const locationId: number | null = yield select(getSelectedLocationId);
    if (!locationId) return;

    const selectedDate: Date = yield select(getSelectedDate);
    const dayFilters: CalendarDayFilters = yield select(getDayFilters);
    const viewMode: AppointmentViewMode = yield select(getViewModeSelector);
    const monthViewStart: Date | null = yield select(getMonthViewDisplayStart);
    const weekViewStart: Date | null = yield select(getWeekViewDisplayStart);
    const dateStr = toLocalDateString(selectedDate);

    if (viewMode === AppointmentViewMode.DAY) {
        yield put(fetchDayData.request({
            locationId,
            date: dateStr,
            filters: dayFilters,
        }));
    } else if (viewMode === AppointmentViewMode.WEEK && weekViewStart) {
        const weekStartStr = toLocalDateString(weekViewStart);
        yield put(fetchWeekData.request({ locationId, weekStart: weekStartStr, filters: dayFilters }));
    } else if (viewMode === AppointmentViewMode.MONTH) {
        const { startDate, endDate } = getDateRangeForMode(selectedDate, viewMode, monthViewStart, weekViewStart);
        yield put(fetchCalendarSummary.request({
            locationId,
            startDate,
            endDate,
            includePreview: false,
            filters: dayFilters,
        }));
    }
}

// ─────────────────────────────────────────────────────────────
// Helper: Refresh calendar data after a mutation (create / update / delete)
// ─────────────────────────────────────────────────────────────

function* refreshCalendarData(): Generator<any, void, any> {
    const locationId: number | null = yield select(getSelectedLocationId);
    if (!locationId) return;

    const selectedDate: Date = yield select(getSelectedDate);
    const viewMode: AppointmentViewMode = yield select(getViewModeSelector);
    const monthViewStart: Date | null = yield select(getMonthViewDisplayStart);
    const weekViewStart: Date | null = yield select(getWeekViewDisplayStart);
    const dayFilters: CalendarDayFilters = yield select(getDayFilters);
    const dateStr = toLocalDateString(selectedDate);
    const { startDate, endDate } = getDateRangeForMode(selectedDate, viewMode, monthViewStart, weekViewStart);

    if (viewMode === AppointmentViewMode.DAY) {
        yield put(fetchDayData.request({ locationId, date: dateStr, filters: dayFilters }));
    } else if (viewMode === AppointmentViewMode.WEEK && weekViewStart) {
        const weekStartStr = toLocalDateString(weekViewStart);
        yield put(fetchWeekData.request({ locationId, weekStart: weekStartStr, filters: dayFilters }));
    } else if (viewMode === AppointmentViewMode.MONTH) {
        yield put(fetchCalendarSummary.request({
            locationId,
            startDate,
            endDate,
            includePreview: false,
            filters: dayFilters,
        }));
    }
}

// ─────────────────────────────────────────────────────────────
// New sagas: Admin appointment CRUD
// ─────────────────────────────────────────────────────────────

function* handleAdminCreateAppointmentGroup(action: ActionType<typeof adminCreateAppointmentGroup.request>): Generator<any, void, any> {
    try {
        const result: any = yield call(adminCreateAppointmentGroupRequest, action.payload);
        yield put(adminCreateAppointmentGroup.success(result));
        yield call(refreshCalendarData);
        const count = result?.appointments?.length ?? 1;
        toast.success(count > 1 ? `Booking group created (${count} items)` : 'Booking created');
    } catch (error: any) {
        yield put(adminCreateAppointmentGroup.failure(error));
        const status = error?.response?.status;
        const message = error?.response?.data?.message;
        const details = error?.response?.data?.details;
        if (status === 409) {
            console.error('[APPOINTMENT] create-group:conflict', {
                payload: action.payload,
                message,
                details,
            });
        }
        toast.error(error?.response?.data?.message || 'Failed to create booking group');
    }
}

function* handleRescheduleAppointmentGroup(action: ActionType<typeof rescheduleAppointmentGroup.request>): Generator<any, void, any> {
    const { bookingGroupId, payload } = action.payload;
    try {
        const result: any = yield call(rescheduleGroupRequest, bookingGroupId, payload);
        yield put(rescheduleAppointmentGroup.success(result));
        yield call(refreshCalendarData);
        toast.success('Booking group rescheduled');
    } catch (error: any) {
        yield put(rescheduleAppointmentGroup.failure(error));
        const status = error?.response?.status;
        if (status === 409) {
            const raw = error?.response?.data?.message;
            const message = Array.isArray(raw) ? (raw[0] ?? raw?.join?.(' ') ?? 'Time slot not available') : (raw || 'Time slot not available');
            const conflictType = error?.response?.data?.details?.conflictType as 'staff_appointment' | 'block' | undefined;
            yield put(setUpdateConflictOffer({
                appointmentId: 0,
                data: { scheduledAt: payload.scheduledAt, allowOutOfHours: payload.allowOutOfHours },
                message,
                conflictType,
                bookingGroupId,
            }));
            if (conflictType === 'staff_appointment') {
                toast.error('This team member already has an appointment at this time. Choose another time or team member.');
            } else {
                toast.info('Slot unavailable', { description: 'You can reschedule anyway with an override.' });
            }
        } else {
            toast.error(error?.response?.data?.message || 'Failed to reschedule group');
        }
    }
}

function* handleUpdateAppointmentStatus(action: ActionType<typeof updateAppointmentStatus.request>): Generator<any, void, any> {
    const { appointmentId, status } = action.payload;

    try {
        const result: any = yield call(updateAppointmentRequest, appointmentId, { status });
        yield put(updateAppointmentStatus.success(result));
        yield call(refreshCalendarData);
        const label = status === 'completed' ? 'completed' : status === 'no_show' ? 'marked as no-show' : `updated to ${status}`;
        toast.success(`Appointment ${label}`);
    } catch (error: any) {
        yield put(updateAppointmentStatus.failure(error));
        toast.error(error?.response?.data?.message || 'Failed to update appointment status');
    }
}

function* handleUpdateAppointment(action: ActionType<typeof updateAppointment.request>): Generator<any, void, any> {
    const { appointmentId, data } = action.payload;

    try {
        const result: any = yield call(updateAppointmentRequest, appointmentId, data);
        yield put(updateAppointment.success(result));
        yield call(refreshCalendarData);
        toast.success('Appointment updated');
    } catch (error: any) {
        yield put(updateAppointment.failure(error));
        const status = error?.response?.status;
        if (status === 409) {
            const raw = error?.response?.data?.message;
            const message = Array.isArray(raw) ? (raw[0] ?? raw?.join?.(' ') ?? 'Time slot not available') : (raw || 'Time slot not available');
            const conflictType = error?.response?.data?.details?.conflictType as 'staff_appointment' | 'block' | undefined;
            yield put(setUpdateConflictOffer({ appointmentId, data, message, conflictType, bookingGroupId: action.payload.bookingGroupId }));
            if (conflictType === 'staff_appointment') {
                toast.error('This team member already has an appointment at this time. Choose another time or team member.');
            } else {
                toast.info('Slot unavailable', { description: 'You can reschedule anyway with an override.' });
            }
        } else {
            toast.error(error?.response?.data?.message || 'Failed to update appointment');
        }
    }
}

function* handleCancelAppointment(action: ActionType<typeof cancelAppointment.request>): Generator<any, void, any> {
    const { appointmentId, reason, notifyCustomer, notificationMethods } = action.payload;

    try {
        const result: any = yield call(cancelAppointmentRequest, appointmentId, {
            reason,
            notifyCustomer,
            notificationMethods,
        });
        yield put(cancelAppointment.success(result));
        yield call(refreshCalendarData);
        toast.success('Appointment cancelled');
    } catch (error: any) {
        yield put(cancelAppointment.failure(error));
        toast.error(error?.response?.data?.message || 'Failed to cancel appointment');
    }
}

// ─────────────────────────────────────────────────────────────
// New sagas: Calendar block CRUD
// ─────────────────────────────────────────────────────────────

function* handleCreateCalendarBlock(action: ActionType<typeof createCalendarBlock.request>): Generator<any, void, any> {
    try {
        const result: any = yield call(createCalendarBlockRequest, action.payload);
        yield put(createCalendarBlock.success(result));
        yield call(refreshCalendarData);
        toast.success('Block created');
    } catch (error: any) {
        yield put(createCalendarBlock.failure(error));
        toast.error(error?.response?.data?.message || 'Failed to create block');
    }
}

function* handleDeleteCalendarBlock(action: ActionType<typeof deleteCalendarBlock.request>): Generator<any, void, any> {
    try {
        yield call(deleteCalendarBlockRequest, action.payload);
        yield put(deleteCalendarBlock.success(action.payload));
        yield call(refreshCalendarData);
        toast.success('Block deleted');
    } catch (error: any) {
        yield put(deleteCalendarBlock.failure(error));
        toast.error(error?.response?.data?.message || 'Failed to delete block');
    }
}

function* handleUpdateCalendarBlock(action: ActionType<typeof updateCalendarBlock.request>): Generator<any, void, any> {
    try {
        const { id, payload } = action.payload;
        const result: any = yield call(updateCalendarBlockRequest, id, payload);
        yield put(updateCalendarBlock.success(result));
        yield call(refreshCalendarData);
        toast.success('Block updated');
    } catch (error: any) {
        yield put(updateCalendarBlock.failure(error));
        toast.error(error?.response?.data?.message || 'Failed to update block');
    }
}

// ─────────────────────────────────────────────────────────────
// Root calendar saga
// ─────────────────────────────────────────────────────────────

export function* calendarSaga(): Generator<any, void, any> {
    yield all([
        // Location-first flow
        takeLatest(setSelectedLocationAction, handleSetSelectedLocation),
        takeLatest(fetchLocationContext.request, handleFetchLocationContext),
        takeLatest(fetchCalendarSummary.request, handleFetchCalendarSummary),
        takeLatest(fetchDayData.request, handleFetchDayData),
        takeLatest(fetchWeekData.request, handleFetchWeekData),
        takeLatest(setSelectedDateAction, handleSetSelectedDate),
        takeLatest(setDisplayedMonthAction, handleSetDisplayedMonth),
        takeLatest(setDisplayedWeekAction, handleSetDisplayedWeek),
        takeLatest(setDayFiltersAction, handleSetDayFilters),
        takeLatest(setViewModeAction, handleSetViewMode),

        // Admin appointment CRUD
        takeLatest(adminCreateAppointmentGroup.request, handleAdminCreateAppointmentGroup),
        takeLatest(rescheduleAppointmentGroup.request, handleRescheduleAppointmentGroup),
        takeLatest(updateAppointmentStatus.request, handleUpdateAppointmentStatus),
        takeLatest(updateAppointment.request, handleUpdateAppointment),
        takeLatest(cancelAppointment.request, handleCancelAppointment),

        // Calendar block CRUD
        takeLatest(createCalendarBlock.request, handleCreateCalendarBlock),
        takeLatest(deleteCalendarBlock.request, handleDeleteCalendarBlock),
        takeLatest(updateCalendarBlock.request, handleUpdateCalendarBlock),
    ]);
}

