import { getType } from "typesafe-actions";
import { inviteTeamMemberAction, listTeamMembersAction, clearInviteResponseAction } from "./actions";
import type { TeamMember, TeamMemberSummary } from "../../shared/types/team-member";
import type { InviteTeamMemberResponse } from "./types";

type TeamMembersState = {
  teamMembers: TeamMember[];
  summary: TeamMemberSummary | null;
  error: string | null;
  inviteResponse: InviteTeamMemberResponse | null;
  isInviting: boolean;
};

const initialState: TeamMembersState = {
  teamMembers: [],
  summary: null,
  error: null,
  inviteResponse: null,
  isInviting: false,
};

export default function teamMembersReducer(state: TeamMembersState = initialState, action: any) {
  switch (action.type) {
    case getType(inviteTeamMemberAction.request):
      return { ...state, isInviting: true, inviteResponse: null, error: null };

    case getType(inviteTeamMemberAction.success):
      return { ...state, isInviting: false, inviteResponse: action.payload, error: null };

    case getType(inviteTeamMemberAction.failure):
      return { ...state, isInviting: false, error: action.payload.message, inviteResponse: null };

    case getType(clearInviteResponseAction):
      return { ...state, inviteResponse: null };

    case getType(listTeamMembersAction.success):
      return { ...state, teamMembers: action.payload.teamMembers, summary: action.payload.summary, error: null };

    case getType(listTeamMembersAction.failure):
      return { ...state, error: action.payload.message };
    default:
      return state;
  }
}


