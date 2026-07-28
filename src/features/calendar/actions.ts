import { createAction, createAsyncAction } from "typesafe-actions";
import type {
    Appointment,
    LocationContextData,
    DaySummary,
    DayDataResponse,
    CalendarWeekResponse,
    CalendarDayFilters,
    AdminCreateGroupAppointmentPayload,
    CalendarBlockCreatePayload,
    CalendarBlockUpdatePayload,
    CalendarBlockDto,
} from "../../shared/types/calendar.ts";
import { AppointmentViewMode, AppointmentViewType, type AddFormPrefill, type PendingDrop } from "./types.ts";

export const toggleAddForm = createAction('CALENDAR/CREATE/TOGGLE')<{ open: boolean; prefill?: AddFormPrefill }>()

export const toggleEditFormAction = createAction('CALENDAR/EDIT/TOGGLE')<{
    open: boolean,
    item: Appointment | null,
}>()

export const setViewTypeAction = createAction('CALENDAR/VIEW_TYPE/SET')<AppointmentViewType>()
export const setViewModeAction = createAction('CALENDAR/VIEW_MODE/SET')<AppointmentViewMode>()

/**
 * Apply saved view mode + list/grid type without refetching calendar data.
 * Use on calendar page mount; user-driven changes use {@link setViewModeAction} (saga loads data).
 */
export const hydrateCalendarDisplayPreferencesAction = createAction(
    'CALENDAR/DISPLAY_PREFERENCES/HYDRATE',
)<{ viewMode: AppointmentViewMode; viewType: AppointmentViewType }>()

// ─────────────────────────────────────────────────────────────
// New actions: Location-first calendar
// ─────────────────────────────────────────────────────────────

/** Set the active location (triggers context + data fetches via saga) */
export const setSelectedLocationAction = createAction(
    'CALENDAR/LOCATION/SET'
)<number | null>()

/** Fetch location context (working hours, staff, booking settings) */
export const fetchLocationContext = createAsyncAction(
    'CALENDAR/LOCATION_CONTEXT/REQUEST',
    'CALENDAR/LOCATION_CONTEXT/SUCCESS',
    'CALENDAR/LOCATION_CONTEXT/FAILURE',
)<number, LocationContextData, { message: string }>()

/** Fetch calendar summary for a date range (month/week overview) */
export const fetchCalendarSummary = createAsyncAction(
    'CALENDAR/SUMMARY/REQUEST',
    'CALENDAR/SUMMARY/SUCCESS',
    'CALENDAR/SUMMARY/FAILURE',
)<{ locationId: number; startDate: string; endDate: string; includePreview?: boolean; filters?: CalendarDayFilters },
    Record<string, DaySummary>,
    { message: string }>()

/** Merge summary rows into {@link CalendarViewState.summary} (e.g. after block CRUD so the sidebar mini month updates). */
export const mergeCalendarSummaryAction = createAction(
    'CALENDAR/SUMMARY/MERGE',
)<Record<string, DaySummary>>()

/** First day of the month shown in the sidebar mini calendar (independent from main month view). */
export const setSidebarMiniCalendarMonthAction = createAction(
    'CALENDAR/SIDEBAR_MINI_MONTH/SET',
)<Date>()

/** Fetch full day data (appointments + blocks for a single day) */
export const fetchDayData = createAsyncAction(
    'CALENDAR/DAY_DATA/REQUEST',
    'CALENDAR/DAY_DATA/SUCCESS',
    'CALENDAR/DAY_DATA/FAILURE',
)<{ locationId: number; date: string; filters?: CalendarDayFilters },
    DayDataResponse,
    { message: string }>()

/** Set day-level filters (staff, service, status, client name) */
export const setDayFiltersAction = createAction(
    'CALENDAR/DAY_FILTERS/SET'
)<CalendarDayFilters>()

/** Set the selected date (date navigation) */
export const setSelectedDateAction = createAction(
    'CALENDAR/SELECTED_DATE/SET'
)<Date>()

/** Signal the grid to scroll to "now" after the next load (set by Today button, cleared after scrolling). */
export const setScrollToNow = createAction(
    'CALENDAR/SCROLL_TO_NOW/SET'
)<boolean>()

/**
 * Atomically set selected date + view mode and trigger a single data fetch (avoids week+day double fetch when switching from week/month to day).
 */
export const navigateToCalendarDateAction = createAction(
    'CALENDAR/NAVIGATE_DATE',
)<{ date: Date; viewMode: AppointmentViewMode }>()

/** Set the displayed month (month view only; first day of that month). */
export const setDisplayedMonthAction = createAction(
    'CALENDAR/DISPLAYED_MONTH/SET'
)<Date>()

/** Set the displayed week (week view only; Monday of that week). */
export const setDisplayedWeekAction = createAction(
    'CALENDAR/DISPLAYED_WEEK/SET'
)<Date>()

/** Set the selected appointment (for detail drawer) */
export const setSelectedAppointmentAction = createAction(
    'CALENDAR/SELECTED_APPOINTMENT/SET'
)<Appointment | null>()

/** Toggle the block form drawer */
export const toggleBlockFormAction = createAction(
    'CALENDAR/BLOCK_FORM/TOGGLE'
)<boolean>()

/** Block being edited in the drawer; null = create mode. Cleared when drawer closes. */
export const setBlockFormEditingAction = createAction(
    'CALENDAR/BLOCK_FORM/EDITING_SET',
)<CalendarBlockDto | null>()

/** Toggle the calendar sidebar (mobile collapse) */
export const toggleCalendarSidebar = createAction(
    'CALENDAR/SIDEBAR/TOGGLE'
)<boolean>()

/** Set staff filter (array of visible staff IDs, empty = show all) */
export const setStaffFilter = createAction(
    'CALENDAR/STAFF_FILTER/SET'
)<number[]>()

/** Fetch full week data (7 days of appointments + blocks + optional miniSummary) */
export const fetchWeekData = createAsyncAction(
    'CALENDAR/WEEK_DATA/REQUEST',
    'CALENDAR/WEEK_DATA/SUCCESS',
    'CALENDAR/WEEK_DATA/FAILURE',
)<{ locationId: number; weekStart: string; filters?: CalendarDayFilters },
    CalendarWeekResponse,
    { message: string }>()

// ─────────────────────────────────────────────────────────────
// New actions: Admin appointment CRUD
// ─────────────────────────────────────────────────────────────

export const adminCreateAppointmentGroup = createAsyncAction(
    'CALENDAR/ADMIN_CREATE_GROUP/REQUEST',
    'CALENDAR/ADMIN_CREATE_GROUP/SUCCESS',
    'CALENDAR/ADMIN_CREATE_GROUP/FAILURE',
)<AdminCreateGroupAppointmentPayload, any, any>()

export const updateAppointmentStatus = createAsyncAction(
    'CALENDAR/UPDATE_STATUS/REQUEST',
    'CALENDAR/UPDATE_STATUS/SUCCESS',
    'CALENDAR/UPDATE_STATUS/FAILURE',
)<{ appointmentId: number; status: string }, any, any>()

/** Offer to retry an update with override after 409 Conflict (set to null to clear). conflictType 'staff_appointment' = do not show override; 'block' or missing = show override. */
export const setUpdateConflictOffer = createAction(
    'CALENDAR/UPDATE_CONFLICT_OFFER/SET',
)<{ appointmentId: number; data: Record<string, unknown>; message: string; conflictType?: 'staff_appointment' | 'block' } | null>()

/** Set/clear pending drag-drop (card preview). Cleared on update success or cancel. */
export const setCalendarPendingDrop = createAction(
    'CALENDAR/PENDING_DROP/SET',
)<PendingDrop>()

/** Add appointment slider: expect this many successful update/reschedule mutations before reducer auto-closes the form. */
export const beginAddFormCloseAfterMutations = createAction(
    'CALENDAR/ADD_FORM/BEGIN_CLOSE_AFTER_MUTATIONS',
)<number>()

/** Update appointment (PUT /appointments/:id — reschedule, reassign, etc.). */
export const updateAppointment = createAsyncAction(
    'CALENDAR/UPDATE_APPOINTMENT/REQUEST',
    'CALENDAR/UPDATE_APPOINTMENT/SUCCESS',
    'CALENDAR/UPDATE_APPOINTMENT/FAILURE',
)<{ appointmentId: number; data: Record<string, any> }, any, any>()

/** Cancel appointment with reason and notification preferences (POST /appointments/:id/cancel) */
export const cancelAppointment = createAsyncAction(
    'CALENDAR/CANCEL/REQUEST',
    'CALENDAR/CANCEL/SUCCESS',
    'CALENDAR/CANCEL/FAILURE',
)<{ appointmentId: number; reason: string; notifyCustomer: boolean; notificationMethods: string[] }, any, any>()

// ─────────────────────────────────────────────────────────────
// New actions: Calendar block CRUD
// ─────────────────────────────────────────────────────────────

export const createCalendarBlock = createAsyncAction(
    'CALENDAR/BLOCK/CREATE/REQUEST',
    'CALENDAR/BLOCK/CREATE/SUCCESS',
    'CALENDAR/BLOCK/CREATE/FAILURE',
)<CalendarBlockCreatePayload, any, any>()

export const deleteCalendarBlock = createAsyncAction(
    'CALENDAR/BLOCK/DELETE/REQUEST',
    'CALENDAR/BLOCK/DELETE/SUCCESS',
    'CALENDAR/BLOCK/DELETE/FAILURE',
)<number, any, any>()

export const updateCalendarBlock = createAsyncAction(
    'CALENDAR/BLOCK/UPDATE/REQUEST',
    'CALENDAR/BLOCK/UPDATE/SUCCESS',
    'CALENDAR/BLOCK/UPDATE/FAILURE',
)<{ id: number; payload: CalendarBlockUpdatePayload }, any, any>()
