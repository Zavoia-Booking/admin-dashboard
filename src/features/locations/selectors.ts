import { getLocationStateSelector } from "../../app/providers/selectors";
import { createSelector } from "@reduxjs/toolkit";

export const getAllLocationsSelector = createSelector(getLocationStateSelector, (state) => {
    return state.allLocations
});

export const getCurrentLocationSelector = createSelector(getLocationStateSelector, (state) => {
    return state.current
});

export const getLocationLoadingSelector = createSelector(getLocationStateSelector, (state) => {
    return state.isLoading
});

export const getLocationErrorSelector = createSelector(getLocationStateSelector, (state) => {
    return state.error
});
