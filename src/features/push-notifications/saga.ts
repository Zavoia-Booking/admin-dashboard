import { takeEvery, call, all } from "redux-saga/effects";
import { setAuthUserAction, logoutRequestAction } from "../auth/actions";
import { registerIfGranted } from "./service";
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

// The device's token is unregistered by the logout saga itself (auth.saga
// handleLogout), ahead of /auth/logout; here we only forget the user so the
// next login registers again.
function handleLogoutRequest(): void {
  lastRegisteredUserId = null;
}

export function* pushNotificationsSaga(): Generator<any, void, any> {
  yield all([
    takeEvery(setAuthUserAction, handleAuthUserSet),
    takeEvery(logoutRequestAction.request, handleLogoutRequest),
  ]);
}
