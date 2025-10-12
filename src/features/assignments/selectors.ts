import type { RootState } from "../../app/providers/store.ts";
import type { AssignmentFilterState } from "./types.ts";

export const getAssignmentsSelector = (state: RootState) => state.assignments.assignments;
export const getAssignmentsSummarySelector = (state: RootState) => state.assignments.summary;
export const getAssignmentsFiltersSelector = (state: RootState): AssignmentFilterState => state.assignments.filters;
export const getAddAssignmentFormSelector = (state: RootState) => state.assignments.addForm;
export const getEditAssignmentFormSelector = (state: RootState) => state.assignments.editForm;
export const getViewDetailsPopupSelector = (state: RootState) => state.assignments.viewDetailsPopup;
