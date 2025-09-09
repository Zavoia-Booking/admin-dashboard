import { getType } from "typesafe-actions";
import { inviteTeamMemberAction, listTeamMembersAction } from "./actions";
import type { TeamMember } from "../../shared/types/team-member";

type TeamMembersState = {
  teamMembers: TeamMember[];
  error: string | null;
};

const initialState: TeamMembersState = {
  teamMembers: [],
  error: null,
};

export default function teamMembersReducer(state: TeamMembersState = initialState, action: any) {
  switch (action.type) {
    case getType(inviteTeamMemberAction.failure):
      return { ...state, error: action.payload.message };

    case getType(listTeamMembersAction.success):
      return { ...state, teamMembers: action.payload.teamMembers, error: null };

    case getType(listTeamMembersAction.failure):
      return { ...state, error: action.payload.message };
    default:
      return state;
  }
}


