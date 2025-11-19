import { createSelector } from "@reduxjs/toolkit";
import { getServicesStateSelector } from "../../app/providers/selectors.ts";
import type { ServiceFilterState } from "./types.ts";

export const getServicesListSelector = createSelector(getServicesStateSelector, (state) => {
    return Array.isArray(state.services) ? state.services : []
});

export const getServicesFilterSelector = createSelector(getServicesStateSelector, (state): ServiceFilterState => {
    return state.filters
});

export const getAddFormSelector = createSelector(getServicesStateSelector, (state) => {
    return state.addFormOpen
})
export const getEditFormSelector = createSelector(getServicesStateSelector, (state) => {
    return state.editForm;
})