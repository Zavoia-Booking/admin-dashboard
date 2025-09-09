import type { RootState } from "../../app/providers/store";

export const selectTeamMembersState = (s: RootState) => s.teamMembers;
export const selectTeamMembers = (s: RootState) => s.teamMembers.teamMembers;
export const selectTeamMembersError = (s: RootState) => s.teamMembers.error;


