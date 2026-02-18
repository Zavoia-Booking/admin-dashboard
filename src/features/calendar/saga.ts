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
    adminCreateAppointment,
    updateAppointmentStatus,
    updateAppointment,
    setUpdateConflictOffer,
    cancelAppointment,
    createCalendarBlock,
    updateCalendarBlock,
    deleteCalendarBlock,
} from "./actions.ts";
import {
    getLocationContextRequest,
    getCalendarSummaryRequest,
    getDayDataRequest,
    getWeekDataRequest,
    adminCreateAppointmentRequest,
    updateAppointmentRequest,
    cancelAppointmentRequest,
    createCalendarBlockRequest,
    updateCalendarBlockRequest,
    deleteCalendarBlockRequest,
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
 * When a location is selected, fetch its context then load the
 * summary + day data for the currently selected date/mode.
 */
function* handleSetSelectedLocation(action: ActionType<typeof setSelectedLocationAction>): Generator<any, void, any> {
    const locationId = action.payload;
    if (!locationId) return;

    // 1. Fetch location context
    yield put(fetchLocationContext.request(locationId));

    // 2. After context loads, fetch summary for current view range
    const selectedDate: Date = yield select(getSelectedDate);
    const viewMode: AppointmentViewMode = yield select(getViewModeSelector);
    const monthViewStart: Date | null = yield select(getMonthViewDisplayStart);
    const weekViewStart: Date | null = yield select(getWeekViewDisplayStart);
    const { startDate, endDate } = getDateRangeForMode(selectedDate, viewMode, monthViewStart, weekViewStart);

    yield put(fetchCalendarSummary.request({
        locationId,
        startDate,
        endDate,
        includePreview: viewMode === AppointmentViewMode.WEEK,
    }));

    // 3. Fetch view-specific data
    if (viewMode === AppointmentViewMode.DAY) {
        const dayFilters: CalendarDayFilters = yield select(getDayFilters);
        yield put(fetchDayData.request({
            locationId,
            date: startDate,
            filters: dayFilters,
        }));
    } else if (viewMode === AppointmentViewMode.WEEK && weekViewStart) {
        const weekStartStr = toLocalDateString(weekViewStart);
        yield put(fetchWeekData.request({ locationId, weekStart: weekStartStr }));
    }
}

/**
 * Fetch location context (working hours, staff, booking settings).
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
    const { locationId, startDate, endDate, includePreview } = action.payload;

    try {
        const data: CalendarSummaryResponse = yield call(
            getCalendarSummaryRequest,
            locationId,
            startDate,
            endDate,
            includePreview,
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
 * When the selected date changes, refetch summary + day/week data.
 */
function* handleSetSelectedDate(_action: ActionType<typeof setSelectedDateAction>): Generator<any, void, any> {
    const locationId: number | null = yield select(getSelectedLocationId);
    if (!locationId) return;

    const selectedDate: Date = yield select(getSelectedDate);
    const viewMode: AppointmentViewMode = yield select(getViewModeSelector);
    const monthViewStart: Date | null = yield select(getMonthViewDisplayStart);
    const weekViewStart: Date | null = yield select(getWeekViewDisplayStart);
    const { startDate, endDate } = getDateRangeForMode(selectedDate, viewMode, monthViewStart, weekViewStart);

    // Refetch summary for the new date range
    yield put(fetchCalendarSummary.request({
        locationId,
        startDate,
        endDate,
        includePreview: viewMode === AppointmentViewMode.WEEK,
    }));

    // Fetch view-specific data
    if (viewMode === AppointmentViewMode.DAY) {
        const dayFilters: CalendarDayFilters = yield select(getDayFilters);
        yield put(fetchDayData.request({
            locationId,
            date: startDate,
            filters: dayFilters,
        }));
    } else if (viewMode === AppointmentViewMode.WEEK && weekViewStart) {
        const weekStartStr = toLocalDateString(weekViewStart);
        yield put(fetchWeekData.request({ locationId, weekStart: weekStartStr }));
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

    const { startDate, endDate } = getDateRangeForMode(monthViewStart, AppointmentViewMode.MONTH, monthViewStart);
    yield put(fetchCalendarSummary.request({
        locationId,
        startDate,
        endDate,
        includePreview: false,
    }));
}

/**
 * When displayed week changes (week view prev/next), refetch summary for that week
 * and week data (same pattern as handleSetDisplayedMonth; week view also has a dedicated week endpoint).
 */
function* handleSetDisplayedWeek(_action: ActionType<typeof setDisplayedWeekAction>): Generator<any, void, any> {
    const locationId: number | null = yield select(getSelectedLocationId);
    if (!locationId) return;

    const weekViewStart: Date | null = yield select(getWeekViewDisplayStart);
    if (!weekViewStart) return;

    const { startDate, endDate } = getDateRangeForMode(weekViewStart, AppointmentViewMode.WEEK, undefined, weekViewStart);
    yield put(fetchCalendarSummary.request({
        locationId,
        startDate,
        endDate,
        includePreview: true,
    }));

    const weekStartStr = toLocalDateString(weekViewStart);
    yield put(fetchWeekData.request({ locationId, weekStart: weekStartStr }));
}

/**
 * Fetch full week data via dedicated week endpoint (single request).
 */
function* handleFetchWeekData(action: ActionType<typeof fetchWeekData.request>): Generator<any, void, any> {
    const { locationId, weekStart } = action.payload;

    try {
        const dayFilters: CalendarDayFilters = yield select(getDayFilters);
        const merged: Record<string, DayDataResponse> = yield call(
            getWeekDataRequest,
            locationId,
            weekStart,
            dayFilters,
        );
        yield put(fetchWeekData.success(merged));
    } catch (error: any) {
        yield put(fetchWeekData.failure(error));
    }
}

/**
 * When view mode changes, fetch appropriate data for the new mode.
 */
function* handleSetViewMode(_action: ActionType<typeof setViewModeAction>): Generator<any, void, any> {
    const locationId: number | null = yield select(getSelectedLocationId);
    if (!locationId) return;

    const selectedDate: Date = yield select(getSelectedDate);
    const viewMode: AppointmentViewMode = yield select(getViewModeSelector);
    const monthViewStart: Date | null = yield select(getMonthViewDisplayStart);
    const weekViewStart: Date | null = yield select(getWeekViewDisplayStart);
    const { startDate, endDate } = getDateRangeForMode(selectedDate, viewMode, monthViewStart, weekViewStart);

    // Refetch summary for the new date range
    yield put(fetchCalendarSummary.request({
        locationId,
        startDate,
        endDate,
        includePreview: viewMode === AppointmentViewMode.WEEK,
    }));

    if (viewMode === AppointmentViewMode.DAY) {
        const dayFilters: CalendarDayFilters = yield select(getDayFilters);
        yield put(fetchDayData.request({
            locationId,
            date: startDate,
            filters: dayFilters,
        }));
    } else if (viewMode === AppointmentViewMode.WEEK && weekViewStart) {
        const weekStartStr = toLocalDateString(weekViewStart);
        yield put(fetchWeekData.request({ locationId, weekStart: weekStartStr }));
    }
}

/**
 * When day filters change, refetch day data.
 */
function* handleSetDayFilters(_action: ActionType<typeof setDayFiltersAction>): Generator<any, void, any> {
    const locationId: number | null = yield select(getSelectedLocationId);
    if (!locationId) return;

    const selectedDate: Date = yield select(getSelectedDate);
    const dayFilters: CalendarDayFilters = yield select(getDayFilters);
    const dateStr = toLocalDateString(selectedDate);

    yield put(fetchDayData.request({
        locationId,
        date: dateStr,
        filters: dayFilters,
    }));
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

    if (viewMode === AppointmentViewMode.DAY) {
        const dayFilters: CalendarDayFilters = yield select(getDayFilters);
        const dateStr = toLocalDateString(selectedDate);
        yield put(fetchDayData.request({ locationId, date: dateStr, filters: dayFilters }));
    } else if (viewMode === AppointmentViewMode.WEEK && weekViewStart) {
        const weekStartStr = toLocalDateString(weekViewStart);
        yield put(fetchWeekData.request({ locationId, weekStart: weekStartStr }));
    }

    // Also refresh summary
    const { startDate, endDate } = getDateRangeForMode(selectedDate, viewMode, monthViewStart, weekViewStart);
    yield put(fetchCalendarSummary.request({
        locationId,
        startDate,
        endDate,
        includePreview: viewMode === AppointmentViewMode.WEEK,
    }));
}

// ─────────────────────────────────────────────────────────────
// New sagas: Admin appointment CRUD
// ─────────────────────────────────────────────────────────────

function* handleAdminCreateAppointment(action: ActionType<typeof adminCreateAppointment.request>): Generator<any, void, any> {
    try {
        const result: any = yield call(adminCreateAppointmentRequest, action.payload);
        yield put(adminCreateAppointment.success(result));
        yield call(refreshCalendarData);
        toast.success('Appointment created');
    } catch (error: any) {
        yield put(adminCreateAppointment.failure(error));
        toast.error(error?.response?.data?.message || 'Failed to create appointment');
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
            yield put(setUpdateConflictOffer({ appointmentId, data, message }));
            toast.info('Slot unavailable', { description: 'You can reschedule anyway with an override.' });
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

function* handleUpdateCalendarBlock(action: ActionType<typeof updateCalendarBlock.request>): Generator<any, void, any> {
    const { blockId, data } = action.payload;

    try {
        const result: any = yield call(updateCalendarBlockRequest, blockId, data);
        yield put(updateCalendarBlock.success(result));
        yield call(refreshCalendarData);
        toast.success('Block updated');
    } catch (error: any) {
        yield put(updateCalendarBlock.failure(error));
        toast.error(error?.response?.data?.message || 'Failed to update block');
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
        takeLatest(adminCreateAppointment.request, handleAdminCreateAppointment),
        takeLatest(updateAppointmentStatus.request, handleUpdateAppointmentStatus),
        takeLatest(updateAppointment.request, handleUpdateAppointment),
        takeLatest(cancelAppointment.request, handleCancelAppointment),

        // Calendar block CRUD
        takeLatest(createCalendarBlock.request, handleCreateCalendarBlock),
        takeLatest(updateCalendarBlock.request, handleUpdateCalendarBlock),
        takeLatest(deleteCalendarBlock.request, handleDeleteCalendarBlock),
    ]);
}

