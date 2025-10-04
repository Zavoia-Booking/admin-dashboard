import { createSelector } from "@reduxjs/toolkit";
import { getServicesStateSelector } from "../../app/providers/selectors.ts";

export const getServicesListSelector = createSelector(getServicesStateSelector, (state) => {
    return state.services
});