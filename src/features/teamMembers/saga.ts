import { takeLatest, call, put } from "redux-saga/effects";
import { inviteTeamMemberRequest, inviteTeamMemberSuccess, inviteTeamMemberFailure } from "./actions";
import type { InviteTeamMemberResponse } from "./types";
import { inviteTeamMember } from "./api";

function* handleInviteTeamMember(action: ReturnType<typeof inviteTeamMemberRequest>) {
  try {
    const response: InviteTeamMemberResponse = yield call(inviteTeamMember, action.payload);
    yield put(inviteTeamMemberSuccess(response));
  } catch (error: any) {
    yield put(inviteTeamMemberFailure(error?.message || 'Failed to invite team member'));
  }
}

export function* teamMembersSaga() {
  yield takeLatest(inviteTeamMemberRequest.type, handleInviteTeamMember);
}


