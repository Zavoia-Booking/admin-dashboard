import { createSelector } from "@reduxjs/toolkit";
import { getTeamMembersStateSelector } from "../../app/providers/selectors";

export const selectTeamMembers = createSelector(getTeamMembersStateSelector, (state) => state.teamMembers);
export const selectTeamMembersError = createSelector(getTeamMembersStateSelector, (state) => state.error);
export const selectTeamMembersSummary = createSelector(getTeamMembersStateSelector, (state) => state.summary);
export const selectIsInviting = createSelector(getTeamMembersStateSelector, (state) => state.isInviting);
export const selectInviteResponse = createSelector(getTeamMembersStateSelector, (state) => state.inviteResponse);
export const selectIsResending = createSelector(getTeamMembersStateSelector, (state) => state.isResending);
export const selectResendError = createSelector(getTeamMembersStateSelector, (state) => state.resendError);
export const selectIsDeleting = createSelector(
  getTeamMembersStateSelector,
  (state: any): boolean => state.isDeleting ?? false
);
export const selectDeleteError = createSelector(
  getTeamMembersStateSelector,
  (state: any): string | null => state.deleteError ?? null
);

export const selectDeleteResponse = createSelector(
  getTeamMembersStateSelector,
  (state: any) => state.deleteResponse
);

export const selectCurrentTeamMember = createSelector(
  getTeamMembersStateSelector,
  (state: any): any | null => state.currentTeamMember ?? null
);

export const selectIsFetchingTeamMember = createSelector(
  getTeamMembersStateSelector,
  (state: any): boolean => state.isFetchingTeamMember ?? false
);

export const selectFetchTeamMemberError = createSelector(
  getTeamMembersStateSelector,
  (state: any): string | null => state.fetchTeamMemberError ?? null
);

