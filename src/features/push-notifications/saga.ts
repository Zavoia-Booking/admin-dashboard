import { eventChannel, type EventChannel } from "redux-saga";
import { takeEvery, call, all, fork, take } from "redux-saga/effects";
import { setAuthUserAction, logoutRequestAction } from "../auth/actions";
import { registerIfGranted } from "./service";
import { updateUserLocaleApi } from "./api";
import i18n, { preferredLanguage } from "../../shared/lib/i18n";
import type { AuthUser } from "../auth/types";

let lastRegisteredUserId: number | null = null;
let localeUserId: number | null = null;
let lastSyncedLocale: string | null = null;

// User.locale is the language business push (and emails) go out in. Keep it on
// the language this user runs the dashboard in: once per sign-in, and again on
// each pick from a language switcher.
function* syncUserLocale(): Generator<any, void, any> {
  if (localeUserId === null) return;
  const locale = preferredLanguage();
  if (!locale) return;
  const key = `${localeUserId}:${locale}`;
  if (lastSyncedLocale === key) return;
  lastSyncedLocale = key;
  try {
    yield call(updateUserLocaleApi, locale);
  } catch {
    lastSyncedLocale = null;
  }
}

function languageChanges(): EventChannel<string> {
  return eventChannel<string>((emit) => {
    const onChange = (lng: string) => emit(lng);
    i18n.on("languageChanged", onChange);
    return () => i18n.off("languageChanged", onChange);
  });
}

function* watchLanguageChanges(): Generator<any, void, any> {
  const channel: EventChannel<string> = yield call(languageChanges);
  while (true) {
    yield take(channel);
    yield fork(syncUserLocale);
  }
}

function* handleAuthUserSet(action: ReturnType<typeof setAuthUserAction>): Generator<any, void, any> {
  const user: AuthUser | null = action.payload?.user ?? null;
  if (!user || !user.id) return;
  if (user.role === "dashboard_user") return;
  localeUserId = user.id;
  yield fork(syncUserLocale);
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
  localeUserId = null;
  lastSyncedLocale = null;
}

export function* pushNotificationsSaga(): Generator<any, void, any> {
  yield all([
    takeEvery(setAuthUserAction, handleAuthUserSet),
    takeEvery(logoutRequestAction.request, handleLogoutRequest),
    fork(watchLanguageChanges),
  ]);
}
