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
    navigateToCalendarDateAction,
    setDisplayedMonthAction,
    setDisplayedWeekAction,
    setViewModeAction,
    setSidebarMiniCalendarMonthAction,
    adminCreateAppointmentGroup,
    updateAppointmentStatus,
    updateAppointment,
    setUpdateConflictOffer,
    cancelAppointment,
    createCalendarBlock,
    deleteCalendarBlock,
    updateCalendarBlock,
    mergeCalendarSummaryAction,
} from "./actions.ts";
import {
    getLocationContextRequest,
    getCalendarSummaryRequest,
    getDayDataRequest,
    getWeekDataRequest,
    adminCreateAppointmentGroupRequest,
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
    getSidebarMiniCalendarMonthStart,
    getCalendarTimezone,
} from "./selectors.ts";
import { getDateRangeForMode } from "./utils.ts";
import { formatDateInTimezone } from "./timezone.ts";
import type { CalendarDayFilters, DayDataResponse, LocationContextData, CalendarSummaryResponse } from "../../shared/types/calendar.ts";
import { toast } from "sonner";
import i18n from "../../shared/lib/i18n";
import { translateMessageCode } from "../../shared/utils/error";

function calendarErrorMessage(error: any): string {
  const raw = error?.response?.data?.message;
  if (Array.isArray(raw)) return raw.map((m: string) => translateMessageCode(m)).join(' ');
  return translateMessageCode(raw ?? '');
}
import { dropSuccessHaptic } from "./haptics.ts";

function wallDateFromIso(iso: string): Date {
    const d = new Date(iso);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfLocalMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function localMonthKey(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}`;
}

function* mergeSummaryForCalendarMonth(
    locationId: number,
    monthStartDate: Date,
    filters: CalendarDayFilters,
): Generator<any, void, any> {
    const y = monthStartDate.getFullYear();
    const mo = monthStartDate.getMonth();
    const startDate = `${y}-${String(mo + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(y, mo + 1, 0).getDate();
    const endDate = `${y}-${String(mo + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const data: CalendarSummaryResponse = yield call(
        getCalendarSummaryRequest,
        locationId,
        startDate,
        endDate,
        false,
        filters,
    );
    yield put(mergeCalendarSummaryAction(data.days));
}

/** Refetch and merge summary rows for months that affect the sidebar mini calendar after block CRUD. */
function* refreshMiniSummaryAfterBlockMutation(extraWallDates: Date[]): Generator<any, void, any> {
    const locationId: number | null = yield select(getSelectedLocationId);
    if (!locationId) return;

    const selectedDate: Date = yield select(getSelectedDate);
    const dayFilters: CalendarDayFilters = yield select(getDayFilters);
    const sidebarMonth: Date | null = yield select(getSidebarMiniCalendarMonthStart);

    const monthStarts: Date[] = [startOfLocalMonth(selectedDate)];
    if (sidebarMonth) {
        monthStarts.push(startOfLocalMonth(sidebarMonth));
    }
    for (const w of extraWallDates) {
        monthStarts.push(startOfLocalMonth(w));
    }

    const seen = new Set<string>();
    for (const m of monthStarts) {
        const key = localMonthKey(m);
        if (seen.has(key)) continue;
        seen.add(key);
        yield call(mergeSummaryForCalendarMonth, locationId, m, dayFilters);
    }
}

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
    const tz: string = yield select(getCalendarTimezone);
    const { startDate, endDate } = getDateRangeForMode(selectedDate, viewMode, monthViewStart, weekViewStart, tz);

    if (viewMode === AppointmentViewMode.DAY) {
        yield put(fetchDayData.request({
            locationId,
            date: startDate,
            filters: dayFilters,
        }));
    } else if (viewMode === AppointmentViewMode.WEEK && weekViewStart) {
        const weekStartStr = formatDateInTimezone(weekViewStart, tz);
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
 * Refetch calendar data for the current Redux view mode + selected date (single request).
 * Used after date navigation, batched navigate-to-date, view mode change, filter change, and mutations.
 */
function* refetchCalendarForCurrentView(): Generator<any, void, any> {
    const locationId: number | null = yield select(getSelectedLocationId);
    if (!locationId) return;

    const selectedDate: Date = yield select(getSelectedDate);
    const viewMode: AppointmentViewMode = yield select(getViewModeSelector);
    const monthViewStart: Date | null = yield select(getMonthViewDisplayStart);
    const weekViewStart: Date | null = yield select(getWeekViewDisplayStart);
    const dayFilters: CalendarDayFilters = yield select(getDayFilters);
    const tz: string = yield select(getCalendarTimezone);
    const { startDate, endDate } = getDateRangeForMode(selectedDate, viewMode, monthViewStart, weekViewStart, tz);

    if (viewMode === AppointmentViewMode.DAY) {
        yield put(fetchDayData.request({
            locationId,
            date: startDate,
            filters: dayFilters,
        }));
    } else if (viewMode === AppointmentViewMode.WEEK && weekViewStart) {
        const weekStartStr = formatDateInTimezone(weekViewStart, tz);
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
 * When the selected date changes, refetch only the data for the current view (one call).
 */
function* handleSetSelectedDate(): Generator<any, void, any> {
    yield call(refetchCalendarForCurrentView);
}

/** Single fetch after atomic date + viewMode update (e.g. mini calendar → day view from week). */
function* handleNavigateToCalendarDate(): Generator<any, void, any> {
    yield call(refetchCalendarForCurrentView);
}

/**
 * When displayed month changes (month view prev/next), refetch summary for that month.
 */
function* handleSetDisplayedMonth(): Generator<any, void, any> {
    const locationId: number | null = yield select(getSelectedLocationId);
    if (!locationId) return;

    const monthViewStart: Date | null = yield select(getMonthViewDisplayStart);
    if (!monthViewStart) return;

    const dayFilters: CalendarDayFilters = yield select(getDayFilters);
    const tz: string = yield select(getCalendarTimezone);
    const { startDate, endDate } = getDateRangeForMode(monthViewStart, AppointmentViewMode.MONTH, monthViewStart, null, tz);
    yield put(fetchCalendarSummary.request({
        locationId,
        startDate,
        endDate,
        includePreview: false,
        filters: dayFilters,
    }));
}

/**
 * When the sidebar mini calendar month changes (prev/next), fetch and merge summary for that month.
 */
function* handleSetSidebarMiniCalendarMonth(): Generator<any, void, any> {
    const locationId: number | null = yield select(getSelectedLocationId);
    if (!locationId) return;

    const sidebarMonth: Date | null = yield select(getSidebarMiniCalendarMonthStart);
    if (!sidebarMonth) return;

    const dayFilters: CalendarDayFilters = yield select(getDayFilters);
    yield call(mergeSummaryForCalendarMonth, locationId, startOfLocalMonth(sidebarMonth), dayFilters);
}

/**
 * When displayed week changes (week view prev/next), refetch only week data (one call).
 */
function* handleSetDisplayedWeek(): Generator<any, void, any> {
    const locationId: number | null = yield select(getSelectedLocationId);
    if (!locationId) return;

    const weekViewStart: Date | null = yield select(getWeekViewDisplayStart);
    if (!weekViewStart) return;

    const dayFilters: CalendarDayFilters = yield select(getDayFilters);
    const tz: string = yield select(getCalendarTimezone);
    const weekStartStr = formatDateInTimezone(weekViewStart, tz);
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
function* handleSetViewMode(): Generator<any, void, any> {
    yield call(refetchCalendarForCurrentView);
}

/**
 * When day filters change, refetch only the data for the current view (one call per view).
 */
function* handleSetDayFilters(): Generator<any, void, any> {
    yield call(refetchCalendarForCurrentView);
}

// ─────────────────────────────────────────────────────────────
// New sagas: Admin appointment CRUD
// ─────────────────────────────────────────────────────────────

function* handleAdminCreateAppointmentGroup(action: ActionType<typeof adminCreateAppointmentGroup.request>): Generator<any, void, any> {
    try {
        const result: any = yield call(adminCreateAppointmentGroupRequest, action.payload);
        yield put(adminCreateAppointmentGroup.success(result));
        yield call(refetchCalendarForCurrentView);
        const count = result?.appointments?.length ?? 1;
        toast.success(count > 1 ? i18n.t("calendar:page.toasts.bookingGroupCreated", { count }) : i18n.t("calendar:page.toasts.bookingCreated"));
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
        toast.error(calendarErrorMessage(error) || i18n.t("calendar:page.toasts.bookingGroupCreationFailed"));
    }
}

function* handleUpdateAppointmentStatus(action: ActionType<typeof updateAppointmentStatus.request>): Generator<any, void, any> {
    const { appointmentId, status } = action.payload;

    try {
        const result: any = yield call(updateAppointmentRequest, appointmentId, { status });
        yield put(updateAppointmentStatus.success(result));
        yield call(refetchCalendarForCurrentView);
        const toastKey = status === 'completed'
            ? "calendar:page.toasts.appointmentStatusCompleted"
            : status === 'no_show'
                ? "calendar:page.toasts.appointmentStatusNoShow"
                : "calendar:page.toasts.appointmentStatusGeneric";
        toast.success(i18n.t(toastKey, { status }));
    } catch (error: any) {
        yield put(updateAppointmentStatus.failure(error));
        toast.error(calendarErrorMessage(error) || i18n.t("calendar:page.toasts.appointmentStatusUpdateFailed"));
    }
}

function* handleUpdateAppointment(action: ActionType<typeof updateAppointment.request>): Generator<any, void, any> {
    const { appointmentId, data } = action.payload;

    try {
        const result: any = yield call(updateAppointmentRequest, appointmentId, data);
        yield put(updateAppointment.success(result));
        dropSuccessHaptic();
        yield call(refetchCalendarForCurrentView);
        toast.success(i18n.t("calendar:page.toasts.appointmentUpdated"));
    } catch (error: any) {
        yield put(updateAppointment.failure(error));
        const status = error?.response?.status;
        if (status === 409) {
            const raw = error?.response?.data?.message;
            const firstRaw = Array.isArray(raw) ? (raw[0] ?? raw?.join?.(' ') ?? '') : (raw ?? '');
            const message = translateMessageCode(firstRaw) || i18n.t("calendar:page.toasts.timeSlotNotAvailable");
            const conflictType = error?.response?.data?.details?.conflictType as 'staff_appointment' | 'block' | undefined;
            yield put(setUpdateConflictOffer({ appointmentId, data, message, conflictType }));
            if (conflictType === 'staff_appointment') {
                toast.error(i18n.t("calendar:page.toasts.staffConflict"));
            } else {
                toast.info(i18n.t("calendar:page.toasts.slotUnavailable"), { description: i18n.t("calendar:page.toasts.slotUnavailableDesc") });
            }
        } else {
            toast.error(calendarErrorMessage(error) || i18n.t("calendar:page.toasts.appointmentUpdateFailed"));
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
        yield call(refetchCalendarForCurrentView);
        toast.success(i18n.t("calendar:page.toasts.appointmentCancelled"));
    } catch (error: any) {
        yield put(cancelAppointment.failure(error));
        toast.error(calendarErrorMessage(error) || i18n.t("calendar:page.toasts.appointmentCancelFailed"));
    }
}

// ─────────────────────────────────────────────────────────────
// New sagas: Calendar block CRUD
// ─────────────────────────────────────────────────────────────

function* handleCreateCalendarBlock(action: ActionType<typeof createCalendarBlock.request>): Generator<any, void, any> {
    try {
        const result: any = yield call(createCalendarBlockRequest, action.payload);
        yield put(createCalendarBlock.success(result));
        yield call(refetchCalendarForCurrentView);
        yield call(refreshMiniSummaryAfterBlockMutation, [wallDateFromIso(action.payload.startsAt)]);
        toast.success(i18n.t("calendar:page.toasts.blockCreated"));
    } catch (error: any) {
        yield put(createCalendarBlock.failure(error));
        toast.error(calendarErrorMessage(error) || i18n.t("calendar:page.toasts.blockCreateFailed"));
    }
}

function* handleDeleteCalendarBlock(action: ActionType<typeof deleteCalendarBlock.request>): Generator<any, void, any> {
    try {
        yield call(deleteCalendarBlockRequest, action.payload);
        yield put(deleteCalendarBlock.success(action.payload));
        yield call(refetchCalendarForCurrentView);
        yield call(refreshMiniSummaryAfterBlockMutation, []);
        toast.success(i18n.t("calendar:page.toasts.blockDeleted"));
    } catch (error: any) {
        yield put(deleteCalendarBlock.failure(error));
        toast.error(calendarErrorMessage(error) || i18n.t("calendar:page.toasts.blockDeleteFailed"));
    }
}

function* handleUpdateCalendarBlock(action: ActionType<typeof updateCalendarBlock.request>): Generator<any, void, any> {
    try {
        const { id, payload } = action.payload;
        const result: any = yield call(updateCalendarBlockRequest, id, payload);
        yield put(updateCalendarBlock.success(result));
        yield call(refetchCalendarForCurrentView);
        const extraWallDates: Date[] = [];
        if (payload.startsAt) {
            extraWallDates.push(wallDateFromIso(payload.startsAt));
        }
        const resBlock = result?.block ?? result;
        if (resBlock?.startsAt) {
            extraWallDates.push(wallDateFromIso(resBlock.startsAt));
        }
        yield call(refreshMiniSummaryAfterBlockMutation, extraWallDates);
        toast.success(i18n.t("calendar:page.toasts.blockUpdated"));
    } catch (error: any) {
        yield put(updateCalendarBlock.failure(error));
        toast.error(calendarErrorMessage(error) || i18n.t("calendar:page.toasts.blockUpdateFailed"));
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
        takeLatest(navigateToCalendarDateAction, handleNavigateToCalendarDate),
        takeLatest(setDisplayedMonthAction, handleSetDisplayedMonth),
        takeLatest(setSidebarMiniCalendarMonthAction, handleSetSidebarMiniCalendarMonth),
        takeLatest(setDisplayedWeekAction, handleSetDisplayedWeek),
        takeLatest(setDayFiltersAction, handleSetDayFilters),
        takeLatest(setViewModeAction, handleSetViewMode),

        // Admin appointment CRUD
        takeLatest(adminCreateAppointmentGroup.request, handleAdminCreateAppointmentGroup),
        takeLatest(updateAppointmentStatus.request, handleUpdateAppointmentStatus),
        takeLatest(updateAppointment.request, handleUpdateAppointment),
        takeLatest(cancelAppointment.request, handleCancelAppointment),

        // Calendar block CRUD
        takeLatest(createCalendarBlock.request, handleCreateCalendarBlock),
        takeLatest(deleteCalendarBlock.request, handleDeleteCalendarBlock),
        takeLatest(updateCalendarBlock.request, handleUpdateCalendarBlock),
    ]);
}

