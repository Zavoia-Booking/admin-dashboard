import { getLocationStateSelector } from "../../app/providers/selectors";
import { createSelector } from "@reduxjs/toolkit";
import type { LocationType } from "../../shared/types/location.ts";

export const getAllLocationsSelector = createSelector(getLocationStateSelector, (state): Array<LocationType> => {
    return state.allLocations
});

export const getLocationLoadingSelector = createSelector(getLocationStateSelector, (state) => {
    return state.isLoading
});

export const getLocationErrorSelector = createSelector(getLocationStateSelector, (state) => {
    return state.error
});

export const getDeleteResponseSelector = createSelector(getLocationStateSelector, (state) => {
    return state.deleteResponse
});

export const getIsDeletingSelector = createSelector(getLocationStateSelector, (state): boolean => {
    return state.isDeleting ?? false;
});

export const getDeleteErrorSelector = createSelector(getLocationStateSelector, (state): string | null => {
    return state.deleteError ?? null;
});

export const getUpdateResponseSelector = createSelector(getLocationStateSelector, (state) => {
    return state.updateResponse ?? null;
});