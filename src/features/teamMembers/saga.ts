import { takeLatest, call, put, all } from "redux-saga/effects";
import { getSubscriptionSummaryAction } from "../settings/actions";
import { cancelInvitationAction, deleteTeamMemberAction, fetchTeamMemberByIdAction, inviteTeamMemberAction, listTeamMembersAction, resendInvitationAction } from "./actions";
import type { TeamMember, TeamMemberSummary } from "../../shared/types/team-member";
import { cancelInvitationApi, deleteTeamMemberApi, fetchTeamMemberByIdApi, inviteTeamMemberApi, listTeamMembersApi, resendInvitationApi } from "./api";
import type { InviteTeamMemberResponse } from "./types";
import { toast } from "sonner";
import type { DeleteResponse } from "../../shared/types/delete-response";
import { getErrorMessage, translateMessageCode } from "../../shared/utils/error";
import i18n from "../../shared/lib/i18n";

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
    const message = backendMessage || resp?.error || error?.message || i18n.t('teamMembers:toasts.inviteFailed');
    yield put(inviteTeamMemberAction.failure({ message }));
  }
}

function* handleListTeamMembers() {
  try {
    const response: { summary: TeamMemberSummary; teamMembers: TeamMember[] } = yield call(listTeamMembersApi);
    yield put(listTeamMembersAction.success(response));
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || i18n.t('teamMembers:toasts.listFailed');
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
    takeLatest(fetchTeamMemberByIdAction.request, handleFetchTeamMemberById),
  ]);
}

function* handleCancelInvitation(action: ReturnType<typeof cancelInvitationAction.request>) {
  try {
    yield call(cancelInvitationApi, action.payload.id);
    yield put(cancelInvitationAction.success());
    toast.success(translateMessageCode('TEAM.S02'));
    yield put(listTeamMembersAction.request());
    yield put(getSubscriptionSummaryAction.request());
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    toast.error(message);
    yield put(cancelInvitationAction.failure({ message }));
  }
}

function* handleResendInvitation(action: ReturnType<typeof resendInvitationAction.request>) {
  try {
    yield call(resendInvitationApi, action.payload.id);
    yield put(resendInvitationAction.success());
    toast.success(translateMessageCode('TEAM.S03'));
    yield put(listTeamMembersAction.request());
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    toast.error(message);
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
      toast.success(i18n.t('teamMembers:toasts.removeSuccess'));
      yield put(listTeamMembersAction.request());
    }
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || i18n.t('teamMembers:toasts.removeFailed');
    toast.error(message);
    yield put(deleteTeamMemberAction.failure({ message }));
  }
}

function* handleFetchTeamMemberById(action: ReturnType<typeof fetchTeamMemberByIdAction.request>) {
  try {
    const teamMember: TeamMember = yield call(fetchTeamMemberByIdApi, action.payload.id);
    yield put(fetchTeamMemberByIdAction.success({ teamMember }));
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || i18n.t('teamMembers:toasts.fetchFailed');
    toast.error(message);
    yield put(fetchTeamMemberByIdAction.failure({ message }));
  }
}
