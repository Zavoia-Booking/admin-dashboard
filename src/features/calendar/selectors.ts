import { createSelector } from "@reduxjs/toolkit";
import { getCalendarViewStateSelector } from "../../app/providers/selectors.ts";
import type { CalendarFilters } from "./types.ts";

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
