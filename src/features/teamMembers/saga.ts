import { takeLatest, call, put, all } from "redux-saga/effects";
import { cancelInvitationAction, inviteTeamMemberAction, listTeamMembersAction } from "./actions";
import type { TeamMember } from "../../shared/types/team-member";
import { cancelInvitationApi, inviteTeamMemberApi, listTeamMembersApi } from "./api";

function* handleInviteTeamMember(action: ReturnType<typeof inviteTeamMemberAction.request>) {
  try {
    yield call(inviteTeamMemberApi, action.payload);
    yield put(listTeamMembersAction.request());
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || 'Failed to invite team member';
    yield put(inviteTeamMemberAction.failure({ message }));
  }
} 

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
  yield all([
    takeLatest(listTeamMembersAction.request, handleListTeamMembers), 
    takeLatest(inviteTeamMemberAction.request, handleInviteTeamMember),
    takeLatest(cancelInvitationAction.request, handleCancelInvitation),
  ]);
}

function* handleCancelInvitation(action: ReturnType<typeof cancelInvitationAction.request>) {
  try {
    yield call(cancelInvitationApi, action.payload.id);
    yield put(cancelInvitationAction.success());
    yield put(listTeamMembersAction.request());
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || 'Failed to cancel invitation';
    yield put(cancelInvitationAction.failure({ message }));
  }
}
