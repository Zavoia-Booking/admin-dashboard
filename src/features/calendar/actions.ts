import { createAction, createAsyncAction } from "typesafe-actions";
import type {
    Appointment,
    LocationContextData,
    DaySummary,
    DayDataResponse,
    CalendarDayFilters,
    AdminCreateAppointmentPayload,
    CalendarBlockCreatePayload,
    CalendarBlockUpdatePayload,
} from "../../shared/types/calendar.ts";
import { AppointmentViewMode, AppointmentViewType, type CalendarFilters } from "./types.ts";

// ─────────────────────────────────────────────────────────────
// Legacy actions (kept during migration)
// ─────────────────────────────────────────────────────────────

export const fetchCalendarAppointments = createAsyncAction(
    'CALENDAR/GET/APPOINTMENTS/REQUEST',
    'CALENDAR/GET/APPOINTMENTS/SUCCESS',
    'CALENDAR/APPOINTMENTS/FAILURE',
)<void, Array<Appointment>, any>();

export const createCalendarAppointmentAction = createAsyncAction(
    'CALENDAR/CREATE/APPOINTMENTS/REQUEST',
    'CALENDAR/CREATE/APPOINTMENTS/SUCCESS',
    'CALENDAR/CREATE/FAILURE',
)<any, any, any>();

export const toggleAddForm = createAction('CALENDAR/CREATE/TOGGLE')<boolean>()

export const toggleEditFormAction = createAction('CALENDAR/EDIT/TOGGLE')<{
    open: boolean,
    item: Appointment | null,
}>()

export const setViewTypeAction = createAction('CALENDAR/VIEW_TYPE/SET')<AppointmentViewType>()
export const setViewModeAction = createAction('CALENDAR/VIEW_MODE/SET')<AppointmentViewMode>()
export const setCalendarFilterAction = createAsyncAction(
    'CALENDAR/FILTER/SET/REQUEST',
    'CALENDAR/FILTER/SET/SUCCESS',
    'CALENDAR/FILTER/SET/FAILURE',
)<CalendarFilters, CalendarFilters, void>()

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

/** Fetch calendar summary for a date range (month/week overview) */
export const fetchCalendarSummary = createAsyncAction(
    'CALENDAR/SUMMARY/REQUEST',
    'CALENDAR/SUMMARY/SUCCESS',
    'CALENDAR/SUMMARY/FAILURE',
)<{ locationId: number; startDate: string; endDate: string; includePreview?: boolean },
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

/** Set the selected appointment (for detail drawer) */
export const setSelectedAppointmentAction = createAction(
    'CALENDAR/SELECTED_APPOINTMENT/SET'
)<Appointment | null>()

/** Toggle the block form drawer */
export const toggleBlockFormAction = createAction(
    'CALENDAR/BLOCK_FORM/TOGGLE'
)<boolean>()

// ─────────────────────────────────────────────────────────────
// New actions: Admin appointment CRUD
// ─────────────────────────────────────────────────────────────

export const adminCreateAppointment = createAsyncAction(
    'CALENDAR/ADMIN_CREATE/REQUEST',
    'CALENDAR/ADMIN_CREATE/SUCCESS',
    'CALENDAR/ADMIN_CREATE/FAILURE',
)<AdminCreateAppointmentPayload, any, any>()

export const updateAppointmentStatus = createAsyncAction(
    'CALENDAR/UPDATE_STATUS/REQUEST',
    'CALENDAR/UPDATE_STATUS/SUCCESS',
    'CALENDAR/UPDATE_STATUS/FAILURE',
)<{ appointmentId: number; status: string }, any, any>()

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