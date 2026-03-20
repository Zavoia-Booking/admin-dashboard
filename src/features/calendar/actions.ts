import { createAction, createAsyncAction } from "typesafe-actions";
import type {
    Appointment,
    LocationContextData,
    DaySummary,
    DayDataResponse,
    CalendarWeekResponse,
    CalendarDayFilters,
    AdminCreateGroupAppointmentPayload,
    RescheduleGroupPayload,
    CalendarBlockCreatePayload,
    CalendarBlockUpdatePayload,
} from "../../shared/types/calendar.ts";
import type { LocationService, LocationTeamMember } from "../assignments/types.ts";
import { AppointmentViewMode, AppointmentViewType, type AddFormPrefill, type PendingDrop } from "./types.ts";

export const toggleAddForm = createAction('CALENDAR/CREATE/TOGGLE')<{ open: boolean; prefill?: AddFormPrefill }>()

export const toggleEditFormAction = createAction('CALENDAR/EDIT/TOGGLE')<{
    open: boolean,
    item: Appointment | null,
    groupAppointments?: Appointment[],
}>()

export const setViewTypeAction = createAction('CALENDAR/VIEW_TYPE/SET')<AppointmentViewType>()
export const setViewModeAction = createAction('CALENDAR/VIEW_MODE/SET')<AppointmentViewMode>()

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
)<number, LocationContextData, any>()

/** Fetch location assignment (services + team for selected location). Fired after location context success; stored for sidebar and add form. */
export const fetchLocationAssignment = createAsyncAction(
    'CALENDAR/LOCATION_ASSIGNMENT/REQUEST',
    'CALENDAR/LOCATION_ASSIGNMENT/SUCCESS',
    'CALENDAR/LOCATION_ASSIGNMENT/FAILURE',
)<number, { services: LocationService[]; teamMembers: LocationTeamMember[] }, any>()

/** Fetch calendar summary for a date range (month/week overview) */
export const fetchCalendarSummary = createAsyncAction(
    'CALENDAR/SUMMARY/REQUEST',
    'CALENDAR/SUMMARY/SUCCESS',
    'CALENDAR/SUMMARY/FAILURE',
)<{ locationId: number; startDate: string; endDate: string; includePreview?: boolean; filters?: CalendarDayFilters },
    Record<string, DaySummary>,
    any>()

/** Fetch full day data (appointments + blocks for a single day) */
export const fetchDayData = createAsyncAction(
    'CALENDAR/DAY_DATA/REQUEST',
    'CALENDAR/DAY_DATA/SUCCESS',
    'CALENDAR/DAY_DATA/FAILURE',
)<{ locationId: number; date: string; filters?: CalendarDayFilters },
    DayDataResponse,
    any>()

/** Set day-level filters (staff, service, status, client name) */
export const setDayFiltersAction = createAction(
    'CALENDAR/DAY_FILTERS/SET'
)<CalendarDayFilters>()

/** Set the selected date (date navigation) */
export const setSelectedDateAction = createAction(
    'CALENDAR/SELECTED_DATE/SET'
)<Date>()

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
    any>()

// ─────────────────────────────────────────────────────────────
// New actions: Admin appointment CRUD
// ─────────────────────────────────────────────────────────────

export const adminCreateAppointmentGroup = createAsyncAction(
    'CALENDAR/ADMIN_CREATE_GROUP/REQUEST',
    'CALENDAR/ADMIN_CREATE_GROUP/SUCCESS',
    'CALENDAR/ADMIN_CREATE_GROUP/FAILURE',
)<AdminCreateGroupAppointmentPayload, any, any>()

export const rescheduleAppointmentGroup = createAsyncAction(
    'CALENDAR/RESCHEDULE_GROUP/REQUEST',
    'CALENDAR/RESCHEDULE_GROUP/SUCCESS',
    'CALENDAR/RESCHEDULE_GROUP/FAILURE',
)<{ bookingGroupId: string; payload: RescheduleGroupPayload }, any, any>()

export const updateAppointmentStatus = createAsyncAction(
    'CALENDAR/UPDATE_STATUS/REQUEST',
    'CALENDAR/UPDATE_STATUS/SUCCESS',
    'CALENDAR/UPDATE_STATUS/FAILURE',
)<{ appointmentId: number; status: string }, any, any>()

/** Offer to retry an update with override after 409 Conflict (set to null to clear). conflictType 'staff_appointment' = do not show override; 'block' or missing = show override. bookingGroupId: when set, confirm override should call reschedule group API. */
export const setUpdateConflictOffer = createAction(
    'CALENDAR/UPDATE_CONFLICT_OFFER/SET',
)<{ appointmentId: number; data: Record<string, unknown>; message: string; conflictType?: 'staff_appointment' | 'block'; bookingGroupId?: string } | null>()

/** Set/clear pending drag-drop (card preview). Cleared on update success or cancel. */
export const setCalendarPendingDrop = createAction(
    'CALENDAR/PENDING_DROP/SET',
)<PendingDrop>()

/** Update appointment (PUT /appointments/:id — reschedule, reassign, etc.). When rescheduling a group, pass bookingGroupId so conflict offer can use group reschedule. */
export const updateAppointment = createAsyncAction(
    'CALENDAR/UPDATE_APPOINTMENT/REQUEST',
    'CALENDAR/UPDATE_APPOINTMENT/SUCCESS',
    'CALENDAR/UPDATE_APPOINTMENT/FAILURE',
)<{ appointmentId: number; data: Record<string, any>; bookingGroupId?: string }, any, any>()

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

export const updateCalendarBlock = createAsyncAction(
    'CALENDAR/BLOCK/UPDATE/REQUEST',
    'CALENDAR/BLOCK/UPDATE/SUCCESS',
    'CALENDAR/BLOCK/UPDATE/FAILURE',
)<{ blockId: number; data: CalendarBlockUpdatePayload }, any, any>()

export const deleteCalendarBlock = createAsyncAction(
    'CALENDAR/BLOCK/DELETE/REQUEST',
    'CALENDAR/BLOCK/DELETE/SUCCESS',
    'CALENDAR/BLOCK/DELETE/FAILURE',
)<number, any, any>()