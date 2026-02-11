import { createSelector } from "@reduxjs/toolkit";
import { getCalendarViewStateSelector } from "../../app/providers/selectors.ts";
import type { CalendarFilters } from "./types.ts";

// ─────────────────────────────────────────────────────────────
// Legacy selectors (kept during migration)
// ─────────────────────────────────────────────────────────────

export const getCalendarAppointmentsSelector = createSelector(getCalendarViewStateSelector, (state) => {
    return state.appointments
});

export const getAddFormSelector = createSelector(getCalendarViewStateSelector, (state) => {
    return state.addFormOpen
})

export const getEditFormSelector = createSelector(getCalendarViewStateSelector, (state) => {
    return state.editForm;
})

export const getViewTypeSelector = createSelector(getCalendarViewStateSelector, (state) => {
    return state.viewType;
})

export const getViewModeSelector = createSelector(getCalendarViewStateSelector, (state) => {
    return state.viewMode;
})

export const getFiltersSelector = createSelector(getCalendarViewStateSelector, (state): CalendarFilters => {
    return state.filters;
})

export const getFiltersSelectedDate = createSelector(getFiltersSelector, (state) => {
    return state.selectedDate;
})

// ─────────────────────────────────────────────────────────────
// New selectors: Location-first calendar
// ─────────────────────────────────────────────────────────────

/** Currently selected location ID */
export const getSelectedLocationId = createSelector(getCalendarViewStateSelector, (state) => {
    return state.selectedLocationId;
})

/** Location context (working hours, staff, booking settings) */
export const getLocationContext = createSelector(getCalendarViewStateSelector, (state) => {
    return state.locationContext;
})

export const getLocationContextLoading = createSelector(getCalendarViewStateSelector, (state) => {
    return state.locationContextLoading;
})

/** Staff members assigned to the selected location */
export const getLocationStaff = createSelector(getLocationContext, (context) => {
    return context?.staff ?? [];
})

/** Working hours for the selected location */
export const getLocationWorkingHours = createSelector(getLocationContext, (context) => {
    return context?.location.workingHours ?? null;
})

/** Whether the location is open 24/7 */
export const getLocationOpen247 = createSelector(getLocationContext, (context) => {
    return context?.location.open247 ?? false;
})

/** Booking settings for the business */
export const getBookingSettings = createSelector(getLocationContext, (context) => {
    return context?.bookingSettings ?? null;
})

/** Calendar summary data (keyed by "YYYY-MM-DD") */
export const getCalendarSummary = createSelector(getCalendarViewStateSelector, (state) => {
    return state.summary;
})

export const getSummaryLoading = createSelector(getCalendarViewStateSelector, (state) => {
    return state.summaryLoading;
})

/** Day data (appointments + blocks for the selected day) */
export const getDayData = createSelector(getCalendarViewStateSelector, (state) => {
    return state.dayData;
})

export const getDayDataLoading = createSelector(getCalendarViewStateSelector, (state) => {
    return state.dayDataLoading;
})

/** Day-level appointments from the day data response */
export const getDayAppointments = createSelector(getDayData, (dayData) => {
    return dayData?.appointments ?? [];
})

/** Day-level blocks from the day data response */
export const getDayBlocks = createSelector(getDayData, (dayData) => {
    return dayData?.blocks ?? [];
})

/** Active day filters */
export const getDayFilters = createSelector(getCalendarViewStateSelector, (state) => {
    return state.dayFilters;
})

/** The selected date for navigation */
export const getSelectedDate = createSelector(getCalendarViewStateSelector, (state) => {
    return state.selectedDate;
})

/** The selected appointment (for detail drawer) */
export const getSelectedAppointment = createSelector(getCalendarViewStateSelector, (state) => {
    return state.selectedAppointment;
})

export const getSelectedAppointmentLoading = createSelector(getCalendarViewStateSelector, (state) => {
    return state.selectedAppointmentLoading;
})

/** Block form drawer open state */
export const getBlockFormOpen = createSelector(getCalendarViewStateSelector, (state) => {
    return state.blockFormOpen;
})
