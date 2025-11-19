import type { RootState } from "../../app/providers/store.ts";

// Loading states
export const getIsLoadingSelector = (state: RootState) => state.assignments.isLoading;
export const getIsSavingSelector = (state: RootState) => state.assignments.isSaving;

// Team Members selectors
export const getTeamMemberAssignmentsSelector = (state: RootState) => state.assignments.teamMemberAssignments;
export const getSelectedTeamMemberIdSelector = (state: RootState) => state.assignments.selectedTeamMemberId;
export const getSelectedTeamMemberSelector = (state: RootState) => state.assignments.selectedTeamMemberAssignment;

// Services selectors
export const getSelectedServiceIdSelector = (state: RootState) => state.assignments.selectedServiceId;
export const getSelectedServiceSelector = (state: RootState) => state.assignments.selectedServiceAssignment;
