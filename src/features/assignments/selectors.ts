import type { RootState } from "../../app/providers/store.ts";

// Loading states
export const getIsLoadingSelector = (state: RootState) => state.assignments.isLoading;
export const getIsSavingSelector = (state: RootState) => state.assignments.isSaving;

// Location selectors
export const getSelectedLocationIdSelector = (state: RootState) => state.assignments.selectedLocationId;
export const getSelectedLocationFullSelector = (state: RootState) => state.assignments.selectedLocationFullAssignment;

// Staff services at location (for drawer)
export const getStaffServicesSelector = (state: RootState) => state.assignments.staffServices;
export const getStaffServicesLoadingSelector = (state: RootState) => state.assignments.isStaffServicesLoading;
