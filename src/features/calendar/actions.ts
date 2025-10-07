import { createAction, createAsyncAction } from "typesafe-actions";
import type { Appointment } from "../../shared/types/calendar.ts";
import { AppointmentViewMode, AppointmentViewType, type CalendarFilters } from "./types.ts";

export const fetchCalendarAppointments = createAsyncAction(
    'CALENDAR/GET/APPOINTMENTS/REQUEST',
    'CALENDAR/GET/APPOINTMENTS/SUCCESS',
    'CALENDAR/APPOINTMENTS/FAILURE',
)<void, Array<Appointment>, any>();


export const createCalendarAppointmentAction = createAsyncAction(
    'CALENDAR/CREATE/APPOINTMENTS/REQUEST',
    'CALENDAR/CREATE/APPOINTMENTS/SUCCESS',
    'CALENDAR/CREATE/FAILURE',
)<any, any,any>();

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