import { takeEvery, call, select, all } from "redux-saga/effects";
import { setAuthUserAction, logoutRequestAction } from "../auth/actions";
import { registerIfGranted, unregisterFromPush } from "./service";
import type { RootState } from "../../app/providers/store";
import type { AuthUser } from "../auth/types";

let lastRegisteredUserId: number | null = null;

function* handleAuthUserSet(action: ReturnType<typeof setAuthUserAction>): Generator<any, void, any> {
  const user: AuthUser | null = action.payload?.user ?? null;
  if (!user || !user.id) return;
  if (user.role === "dashboard_user") return;
  if (lastRegisteredUserId === user.id) return;

  // Silent only: registers when the OS permission is already granted. The
  // system prompt is never fired from auth flow — the primer owns that.
  lastRegisteredUserId = user.id;
  yield call(registerIfGranted);
}

function* handleLogoutRequest(): Generator<any, void, any> {
  const user: AuthUser | null = yield select((s: RootState) => s.auth.user);
  if (user) {
    yield call(unregisterFromPush);
  }
  lastRegisteredUserId = null;
}

export function* pushNotificationsSaga(): Generator<any, void, any> {
  yield all([
    takeEvery(setAuthUserAction, handleAuthUserSet),
    takeEvery(logoutRequestAction.request, handleLogoutRequest),
  ]);
}
