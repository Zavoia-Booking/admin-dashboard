import { getType } from "typesafe-actions";
import { inviteTeamMemberAction, listTeamMembersAction, clearInviteResponseAction, resendInvitationAction, cancelInvitationAction, deleteTeamMemberAction } from "./actions";
import type { TeamMember, TeamMemberSummary } from "../../shared/types/team-member";
import type { InviteTeamMemberResponse } from "./types";

type TeamMembersState = {
  teamMembers: TeamMember[];
  summary: TeamMemberSummary | null;
  error: string | null;
  inviteResponse: InviteTeamMemberResponse | null;
  isInviting: boolean;
  isResending: boolean;
  resendError: string | null;
  isDeleting: boolean;
  deleteError: string | null;
};

const initialState: TeamMembersState = {
  teamMembers: [],
  summary: null,
  error: null,
  inviteResponse: null,
  isInviting: false,
  isResending: false,
  resendError: null,
  isDeleting: false,
  deleteError: null,
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

    case getType(resendInvitationAction.request):
      return { ...state, isResending: true, resendError: null };

    case getType(resendInvitationAction.success):
      return { ...state, isResending: false, resendError: null };

    case getType(resendInvitationAction.failure):
      return { ...state, isResending: false, resendError: action.payload.message };

    case getType(cancelInvitationAction.request):
      return { ...state, error: null };

    case getType(cancelInvitationAction.success):
      return { ...state, error: null };

    case getType(cancelInvitationAction.failure):
      return { ...state, error: action.payload.message };

    case getType(deleteTeamMemberAction.request):
      return { ...state, isDeleting: true, deleteError: null };

    case getType(deleteTeamMemberAction.success):
      return { ...state, isDeleting: false, deleteError: null };

    case getType(deleteTeamMemberAction.failure):
      return { ...state, isDeleting: false, deleteError: action.payload.message };

    default:
      return state;
  }
}


