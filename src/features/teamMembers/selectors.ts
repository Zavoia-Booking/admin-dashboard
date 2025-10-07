import { createSelector } from "@reduxjs/toolkit";
import { getTeamMembersStateSelector } from "../../app/providers/selectors";

export const selectTeamMembers = createSelector(getTeamMembersStateSelector, (state) => state.teamMembers);
export const selectTeamMembersError = createSelector(getTeamMembersStateSelector, (state) => state.error);
export const selectTeamMembersSummary = createSelector(getTeamMembersStateSelector, (state) => state.summary);
export const selectInviteResponse = createSelector(getTeamMembersStateSelector, (state) => state.inviteResponse);
export const selectIsInviting = createSelector(getTeamMembersStateSelector, (state) => state.isInviting);


