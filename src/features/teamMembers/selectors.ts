import { createSelector } from "@reduxjs/toolkit";
import { getTeamMembersStateSelector } from "../../app/providers/selectors";

export const selectTeamMembers = createSelector(getTeamMembersStateSelector, (state) => state.teamMembers);
export const selectTeamMembersError = createSelector(getTeamMembersStateSelector, (state) => state.error);


