import { inviteTeamMemberRequest, inviteTeamMemberSuccess, inviteTeamMemberFailure } from "./actions";

type TeamMembersState = {
  isInviting: boolean;
  error: string | null;
  lastInvitation: any | null;
};

const initialState: TeamMembersState = {
  isInviting: false,
  error: null,
  lastInvitation: null,
};

export default function teamMembersReducer(state: TeamMembersState = initialState, action: any) {
  switch (action.type) {
    case inviteTeamMemberRequest.type:
      return { ...state, isInviting: true, error: null };
    case inviteTeamMemberSuccess.type:
      return { ...state, isInviting: false, lastInvitation: action.payload };
    case inviteTeamMemberFailure.type:
      return { ...state, isInviting: false, error: action.payload };
    default:
      return state;
  }
}


