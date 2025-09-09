import { takeLatest, call, put } from "redux-saga/effects";
import { listTeamMembersAction } from "./actions";
// import type { InviteTeamMemberResponse } from "./types";
import type { TeamMember } from "../../shared/types/team-member";
import { listTeamMembersApi } from "./api";

// function* handleInviteTeamMember(action: ReturnType<typeof inviteTeamMemberAction.request>) {
//   try {
//     const response: InviteTeamMemberResponse = yield call(inviteTeamMemberApi, action.payload);
//     yield put(inviteTeamMemberAction.success(response));
//   } catch (error: any) {
//     const message = error?.response?.data?.error || error?.message || 'Failed to invite team member';
//     yield put(inviteTeamMemberAction.failure({ message }));
//   }
// }

function* handleListTeamMembers(action: ReturnType<typeof listTeamMembersAction.request>) {
  try {
    const response: { teamMembers: TeamMember[] } = yield call(listTeamMembersApi);
    yield put(listTeamMembersAction.success(response));
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || 'Failed to list team members';
    yield put(listTeamMembersAction.failure({ message }));
  }
}

export function* teamMembersSaga() {
  // yield takeLatest(inviteTeamMemberAction.request, handleInviteTeamMember);
  yield takeLatest(listTeamMembersAction.request, handleListTeamMembers);
}



