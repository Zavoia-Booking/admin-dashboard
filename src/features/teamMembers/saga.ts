import { takeLatest, call, put, all } from "redux-saga/effects";
import { cancelInvitationAction, deleteTeamMemberAction, inviteTeamMemberAction, listTeamMembersAction, resendInvitationAction } from "./actions";
import type { TeamMember, TeamMemberSummary } from "../../shared/types/team-member";
import { cancelInvitationApi, deleteTeamMemberApi, inviteTeamMemberApi, listTeamMembersApi, resendInvitationApi } from "./api";
import type { InviteTeamMemberResponse } from "./types";
import { toast } from "sonner";
import type { DeleteResponse } from "../../shared/types/delete-response";

function* handleInviteTeamMember(action: ReturnType<typeof inviteTeamMemberAction.request>) {
  try {
    const response: InviteTeamMemberResponse = yield call(inviteTeamMemberApi, action.payload);
    yield put(inviteTeamMemberAction.success(response));
    yield put(listTeamMembersAction.request());
 
  } catch (error: any) {
    const resp = error?.response?.data;
    const backendMessage = Array.isArray(resp?.message)
      ? resp?.message?.join(' ')
      : resp?.message;
    const message = backendMessage || resp?.error || error?.message || 'Failed to invite team member';
    yield put(inviteTeamMemberAction.failure({ message }));
  }
}

function* handleListTeamMembers() {
  try {
    const response: { summary: TeamMemberSummary; teamMembers: TeamMember[] } = yield call(listTeamMembersApi);
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
    takeLatest(resendInvitationAction.request, handleResendInvitation),
    takeLatest(deleteTeamMemberAction.request, handleDeleteTeamMember),
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

function* handleResendInvitation(action: ReturnType<typeof resendInvitationAction.request>) {
  try {
    yield call(resendInvitationApi, action.payload.id);
    yield put(resendInvitationAction.success());
    yield put(listTeamMembersAction.request());
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || 'Failed to resend invitation';
    yield put(resendInvitationAction.failure({ message }));
  }
}

function* handleDeleteTeamMember(action: ReturnType<typeof deleteTeamMemberAction.request>) {
  try {
    const response: DeleteResponse = yield call(deleteTeamMemberApi, action.payload.id);
    
    // Check if backend returned validation info (can't delete due to dependencies)
    if (response && response.canDelete === false) {
      // Cannot delete - return blocking info
      yield put(deleteTeamMemberAction.success({ deleteResponse: response }));
    } else {
      // Successfully deleted
      yield put(deleteTeamMemberAction.success({ deleteResponse: { canDelete: true } }));
      toast.success('Team member removed successfully');
      yield put(listTeamMembersAction.request());
    }
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || 'Failed to remove team member';
    toast.error(message);
    yield put(deleteTeamMemberAction.failure({ message }));
  }
}
