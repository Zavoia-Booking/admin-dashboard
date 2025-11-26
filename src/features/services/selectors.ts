import { createSelector } from "@reduxjs/toolkit";
import { getServicesStateSelector } from "../../app/providers/selectors.ts";
import type { ServiceFilterState } from "./types.ts";

export const getServicesListSelector = createSelector(
  getServicesStateSelector,
  (state) => {
    return Array.isArray(state.services) ? state.services : [];
  }
);

export const getServicesFilterSelector = createSelector(
  getServicesStateSelector,
  (state): ServiceFilterState => {
    return state.filters;
  }
);

export const getAddFormSelector = createSelector(
  getServicesStateSelector,
  (state) => {
    return state.addFormOpen;
  }
);
export const getEditFormSelector = createSelector(
  getServicesStateSelector,
  (state) => {
    return state.editForm;
  }
);

export const getServicesErrorSelector = createSelector(
  getServicesStateSelector,
  (state) => {
    return state.error;
  }
);

export const getServicesLoadingSelector = createSelector(
  getServicesStateSelector,
  (state) => {
    return state.isLoading;
  }
);

export const getServicesDeletingSelector = createSelector(
  getServicesStateSelector,
  (state): boolean => {
    return state.isDeleting ?? false;
  }
);

export const getServicesDeleteResponseSelector = createSelector(
  getServicesStateSelector,
  (state) => {
    return state.deleteResponse;
  }
);

export const getServicesDeleteErrorSelector = createSelector(
  getServicesStateSelector,
  (state): string | null => {
    return state.deleteError ?? null;
  }
);
