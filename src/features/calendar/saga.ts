import { all, call, put, select, takeLatest } from "redux-saga/effects";
import type { ActionType } from "typesafe-actions";
import {
    // Legacy
    createCalendarAppointmentAction,
    fetchCalendarAppointments,
    setCalendarFilterAction,
    // New
    setSelectedLocationAction,
    fetchLocationContext,
    fetchCalendarSummary,
    fetchDayData,
    setDayFiltersAction,
    setSelectedDateAction,
    adminCreateAppointment,
    updateAppointmentStatus,
    createCalendarBlock,
    updateCalendarBlock,
    deleteCalendarBlock,
} from "./actions.ts";
import {
    // Legacy
    createAppointmentsRequest,
    getAppointmentsRequest,
    // New
    getLocationContextRequest,
    getCalendarSummaryRequest,
    getDayDataRequest,
    adminCreateAppointmentRequest,
    updateAppointmentRequest,
    createCalendarBlockRequest,
    updateCalendarBlockRequest,
    deleteCalendarBlockRequest,
} from "./api.ts";
import { AppointmentViewMode, type CalendarFilters } from "./types.ts";
import {
    getFiltersSelector,
    getSelectedLocationId,
    getSelectedDate,
    getViewModeSelector,
    getDayFilters,
} from "./selectors.ts";
import { getFilterPayload, mapToAppointmentList, getDateRangeForMode } from "./utils.ts";
import type { CalendarDayFilters, DayDataResponse, LocationContextData, CalendarSummaryResponse } from "../../shared/types/calendar.ts";

// ─────────────────────────────────────────────────────────────
// Legacy sagas (kept during migration)
// ─────────────────────────────────────────────────────────────

function* handleGetAppointments(): Generator<any, void, any> {
    const filters: CalendarFilters = yield select(getFiltersSelector);

    try {
        const getResponse: unknown = yield call(getAppointmentsRequest, getFilterPayload(filters));
        yield put(fetchCalendarAppointments.success(mapToAppointmentList(getResponse as any)));
    } catch (error: any) {
        console.log(error);
    }
}

function* handleCreateAppointments(action: ActionType<typeof createCalendarAppointmentAction.request>): Generator<any, void, any> {
    try {
        const appointments: unknown = yield call(createAppointmentsRequest, action.payload);
        console.log(appointments);
    } catch (error: any) {
        console.log(error);
    }
}

function* handleSetCalendarFilters(action: ActionType<typeof setCalendarFilterAction.request>): Generator<any, void, any> {
    yield put(setCalendarFilterAction.success(action.payload))
    yield put(fetchCalendarAppointments.request())
}

// ─────────────────────────────────────────────────────────────
// New sagas: Location-first calendar
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
    const { startDate, endDate } = getDateRangeForMode(selectedDate, viewMode);

    yield put(fetchCalendarSummary.request({
        locationId,
        startDate,
        endDate,
        includePreview: viewMode === AppointmentViewMode.WEEK,
    }));

    // 3. If in day view, also fetch day data
    if (viewMode === AppointmentViewMode.DAY) {
        const dayFilters: CalendarDayFilters = yield select(getDayFilters);
        yield put(fetchDayData.request({
            locationId,
            date: startDate,
            filters: dayFilters,
        }));
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
 * When the selected date changes, refetch summary + day data.
 */
function* handleSetSelectedDate(_action: ActionType<typeof setSelectedDateAction>): Generator<any, void, any> {
    const locationId: number | null = yield select(getSelectedLocationId);
    if (!locationId) return;

    const selectedDate: Date = yield select(getSelectedDate);
    const viewMode: AppointmentViewMode = yield select(getViewModeSelector);
    const { startDate, endDate } = getDateRangeForMode(selectedDate, viewMode);

    // Refetch summary for the new date range
    yield put(fetchCalendarSummary.request({
        locationId,
        startDate,
        endDate,
        includePreview: viewMode === AppointmentViewMode.WEEK,
    }));

    // If in day view, also fetch day data
    if (viewMode === AppointmentViewMode.DAY) {
        const dayFilters: CalendarDayFilters = yield select(getDayFilters);
        yield put(fetchDayData.request({
            locationId,
            date: startDate,
            filters: dayFilters,
        }));
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
    const dateStr = selectedDate.toISOString().split('T')[0];

    yield put(fetchDayData.request({
        locationId,
        date: dateStr,
        filters: dayFilters,
    }));
}

// ─────────────────────────────────────────────────────────────
// New sagas: Admin appointment CRUD
// ─────────────────────────────────────────────────────────────

function* handleAdminCreateAppointment(action: ActionType<typeof adminCreateAppointment.request>): Generator<any, void, any> {
    try {
        const result: any = yield call(adminCreateAppointmentRequest, action.payload);
        yield put(adminCreateAppointment.success(result));

        // Refresh day data after creation
        const locationId: number | null = yield select(getSelectedLocationId);
        if (locationId) {
            const selectedDate: Date = yield select(getSelectedDate);
            const dayFilters: CalendarDayFilters = yield select(getDayFilters);
            const dateStr = selectedDate.toISOString().split('T')[0];
            yield put(fetchDayData.request({ locationId, date: dateStr, filters: dayFilters }));
        }
    } catch (error: any) {
        yield put(adminCreateAppointment.failure(error));
    }
}

function* handleUpdateAppointmentStatus(action: ActionType<typeof updateAppointmentStatus.request>): Generator<any, void, any> {
    const { appointmentId, status } = action.payload;

    try {
        const result: any = yield call(updateAppointmentRequest, appointmentId, { status });
        yield put(updateAppointmentStatus.success(result));

        // Refresh day data after status change
        const locationId: number | null = yield select(getSelectedLocationId);
        if (locationId) {
            const selectedDate: Date = yield select(getSelectedDate);
            const dayFilters: CalendarDayFilters = yield select(getDayFilters);
            const dateStr = selectedDate.toISOString().split('T')[0];
            yield put(fetchDayData.request({ locationId, date: dateStr, filters: dayFilters }));
        }
    } catch (error: any) {
        yield put(updateAppointmentStatus.failure(error));
    }
}

// ─────────────────────────────────────────────────────────────
// New sagas: Calendar block CRUD
// ─────────────────────────────────────────────────────────────

function* handleCreateCalendarBlock(action: ActionType<typeof createCalendarBlock.request>): Generator<any, void, any> {
    try {
        const result: any = yield call(createCalendarBlockRequest, action.payload);
        yield put(createCalendarBlock.success(result));

        // Refresh day data after block creation
        const locationId: number | null = yield select(getSelectedLocationId);
        if (locationId) {
            const selectedDate: Date = yield select(getSelectedDate);
            const dayFilters: CalendarDayFilters = yield select(getDayFilters);
            const dateStr = selectedDate.toISOString().split('T')[0];
            yield put(fetchDayData.request({ locationId, date: dateStr, filters: dayFilters }));
        }
    } catch (error: any) {
        yield put(createCalendarBlock.failure(error));
    }
}

function* handleUpdateCalendarBlock(action: ActionType<typeof updateCalendarBlock.request>): Generator<any, void, any> {
    const { blockId, data } = action.payload;

    try {
        const result: any = yield call(updateCalendarBlockRequest, blockId, data);
        yield put(updateCalendarBlock.success(result));

        // Refresh day data
        const locationId: number | null = yield select(getSelectedLocationId);
        if (locationId) {
            const selectedDate: Date = yield select(getSelectedDate);
            const dayFilters: CalendarDayFilters = yield select(getDayFilters);
            const dateStr = selectedDate.toISOString().split('T')[0];
            yield put(fetchDayData.request({ locationId, date: dateStr, filters: dayFilters }));
        }
    } catch (error: any) {
        yield put(updateCalendarBlock.failure(error));
    }
}

function* handleDeleteCalendarBlock(action: ActionType<typeof deleteCalendarBlock.request>): Generator<any, void, any> {
    try {
        yield call(deleteCalendarBlockRequest, action.payload);
        yield put(deleteCalendarBlock.success(action.payload));

        // Refresh day data
        const locationId: number | null = yield select(getSelectedLocationId);
        if (locationId) {
            const selectedDate: Date = yield select(getSelectedDate);
            const dayFilters: CalendarDayFilters = yield select(getDayFilters);
            const dateStr = selectedDate.toISOString().split('T')[0];
            yield put(fetchDayData.request({ locationId, date: dateStr, filters: dayFilters }));
        }
    } catch (error: any) {
        yield put(deleteCalendarBlock.failure(error));
    }
}

// ─────────────────────────────────────────────────────────────
// Root calendar saga
// ─────────────────────────────────────────────────────────────

export function* calendarSaga(): Generator<any, void, any> {
    yield all([
        // Legacy
        takeLatest(fetchCalendarAppointments.request, handleGetAppointments),
        takeLatest(createCalendarAppointmentAction.request, handleCreateAppointments),
        takeLatest(setCalendarFilterAction.request, handleSetCalendarFilters),

        // Location-first flow
        takeLatest(setSelectedLocationAction, handleSetSelectedLocation),
        takeLatest(fetchLocationContext.request, handleFetchLocationContext),
        takeLatest(fetchCalendarSummary.request, handleFetchCalendarSummary),
        takeLatest(fetchDayData.request, handleFetchDayData),
        takeLatest(setSelectedDateAction, handleSetSelectedDate),
        takeLatest(setDayFiltersAction, handleSetDayFilters),

        // Admin appointment CRUD
        takeLatest(adminCreateAppointment.request, handleAdminCreateAppointment),
        takeLatest(updateAppointmentStatus.request, handleUpdateAppointmentStatus),

        // Calendar block CRUD
        takeLatest(createCalendarBlock.request, handleCreateCalendarBlock),
        takeLatest(updateCalendarBlock.request, handleUpdateCalendarBlock),
        takeLatest(deleteCalendarBlock.request, handleDeleteCalendarBlock),
    ]);
}

