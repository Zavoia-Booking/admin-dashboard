import { createSelector } from "@reduxjs/toolkit";
import { getCalendarViewStateSelector } from "../../app/providers/selectors.ts";
import { AppointmentViewMode } from "./types.ts";
import { getWeekStart } from "./utils.ts";

// ─────────────────────────────────────────────────────────────
// UI state selectors
// ─────────────────────────────────────────────────────────────

export const getAddFormSelector = createSelector(getCalendarViewStateSelector, (state) => {
    return state.addFormOpen
})

export const getAddFormPrefill = createSelector(getCalendarViewStateSelector, (state) => {
    return state.addFormPrefill
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

// ─────────────────────────────────────────────────────────────
// Location-first calendar selectors
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

/** First day of the displayed month (month view only). When null, month view uses selectedDate's month. */
export const getDisplayedMonthStart = createSelector(getCalendarViewStateSelector, (state) => {
    return state.displayedMonthStart;
})

/** Monday of the displayed week (week view only). When null, week view uses selectedDate's week. */
export const getDisplayedWeekStart = createSelector(getCalendarViewStateSelector, (state) => {
    return state.displayedWeekStart;
})

/** For month view grid/fetch: first day of the month to display. */
export const getMonthViewDisplayStart = createSelector(
    getCalendarViewStateSelector,
    getViewModeSelector,
    getSelectedDate,
    (state, viewMode, selectedDate) => {
        if (viewMode !== AppointmentViewMode.MONTH) return null;
        const d = state.displayedMonthStart;
        if (d) return d;
        return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    }
)

/** For week view grid/fetch: Monday of the displayed week. */
export const getWeekViewDisplayStart = createSelector(
    getCalendarViewStateSelector,
    getViewModeSelector,
    getSelectedDate,
    (state, viewMode, selectedDate) => {
        if (viewMode !== AppointmentViewMode.WEEK) return null;
        const d = state.displayedWeekStart;
        if (d) return d;
        return getWeekStart(selectedDate);
    }
)

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

// ─────────────────────────────────────────────────────────────
// New selectors: Week data, sidebar, staff filter
// ─────────────────────────────────────────────────────────────

/** Full week data (keyed by "YYYY-MM-DD") */
export const getWeekData = createSelector(getCalendarViewStateSelector, (state) => {
    return state.weekData;
})

export const getWeekDataLoading = createSelector(getCalendarViewStateSelector, (state) => {
    return state.weekDataLoading;
})

/** Calendar sidebar open state (for mobile) */
export const getSidebarOpen = createSelector(getCalendarViewStateSelector, (state) => {
    return state.sidebarOpen;
})

/** Staff filter — array of visible staff IDs (empty = all) */
export const getStaffFilter = createSelector(getCalendarViewStateSelector, (state) => {
    return state.staffFilter;
})

/** Pending 409 conflict offer (retry update with override). */
export const getUpdateConflictOffer = createSelector(getCalendarViewStateSelector, (state) => {
    return state.updateConflictOffer;
})

export const getPendingDrop = createSelector(getCalendarViewStateSelector, (state) => {
    return state.pendingDrop;
})
