import { call, put, takeLatest, select, delay, all } from "redux-saga/effects";
import { refreshSession, readCookie, CSRF_COOKIE_NAME } from "../../shared/lib/http";
import { hydrateSessionAction, setTokensAction, logoutRequestAction } from "./actions";
import type { RootState } from "../../app/providers/store";
import { isNativeApp } from "../../app/config/env";
import { tokenStorage } from "../../shared/lib/tokenStorage";
import i18n from "../../shared/lib/i18n";
import { isAxiosError } from "axios";
// no-op


function* hydrateSessionWorker(): Generator<any, void, any> {
  let hadAccessToken = false;
  try {
    // Skip hydrate during Google OAuth redirect callback (race avoidance)
    const urlHasCode = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("code");
    const hasAccessToken: string | null = yield select((s: RootState) => s.auth.accessToken);
    hadAccessToken = !!hasAccessToken;
    if (urlHasCode && !hasAccessToken) {
      return;
    }

    // Skip hydrate on team invitation page (public route with token-based auth)
    const isTeamInvitation = typeof window !== "undefined" && window.location.pathname === "/team-invitation";
    if (isTeamInvitation) {
      // Set status to UNAUTHENTICATED so UI doesn't stay in loading state
      // Team invitation page handles its own authentication flow
      yield put(hydrateSessionAction.failure({ message: "Skipped hydration on public invitation page" }));
      return;
    }

    // Skip hydrate if no CSRF token is available (user never logged in or session cleared)
    // This prevents "CSRF invalid" errors when accessing through Cloudflare Zero Trust
    // before having a valid app session
    const csrfInRedux: string | null = yield select((s: RootState) => s.auth.csrfToken);
    const csrfInCookie = readCookie(CSRF_COOKIE_NAME);
    const hasCsrf = !!(csrfInRedux || csrfInCookie);
    
    // For web apps, require CSRF token. Native apps don't use CSRF.
    if (!isNativeApp() && !hasCsrf) {
      // Use "Skipped" in message to prevent error toast (see reducer)
      yield put(hydrateSessionAction.failure({ message: "Skipped hydration - no active session" }));
      return;
    }

    // Native equivalent of the CSRF guard above: with no token in Redux and no
    // persisted refresh token there is no session to restore - refreshing would
    // just 400 and surface an error toast on the login screen.
    if (isNativeApp()) {
      const storedRefreshToken: string | null = hasAccessToken
        ? null
        : yield call([tokenStorage, 'loadRefreshToken']);
      if (!hasAccessToken && !storedRefreshToken) {
        yield put(hydrateSessionAction.failure({ message: "Skipped hydration - no active session" }));
        return;
      }
    }

    // Trigger refresh via single-flight helper (also updates redux)
    // refreshSession already updates Redux state; nothing else needed here
    yield call(refreshSession);
  } catch (error) {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    const rejectedByServer = status != null && [400, 401, 403].includes(status);

    // Definitive token rejection is handled centrally by the single-flight
    // refresh helper. With an existing access token, every other refresh
    // pipeline failure (network, server, or native storage) preserves the
    // session and lets page requests settle into retryable errors.
    if (rejectedByServer || hadAccessToken) {
      return;
    }

    // Never surface internal error strings ("Session refresh failed") - the
    // login form toasts whatever lands in auth.error verbatim.
    yield put(hydrateSessionAction.failure({ message: i18n.t('auth:page.errors.hydrateSessionFailed') }));
  }
}

function* watchHydrateSession(): Generator<any, void, any> {
  yield takeLatest(hydrateSessionAction.request, hydrateSessionWorker);
}

// -------- Proactive refresh (schedule ~60s before exp) --------
function decodeExp(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json?.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

// Reschedules on new tokens and successful hydrate; cancelled on logout by restarting the task
function* scheduleProactiveRefresh(_action?: any): Generator<any, void, any> {
  const accessToken: string | null = yield select((s: RootState) => s.auth.accessToken);
  if (!accessToken) return;

  const exp = decodeExp(accessToken);
  if (!exp) return;

  const msUntil = exp * 1000 - Date.now() - 60_000;
  if (msUntil <= 0) {
    yield put(hydrateSessionAction.request());
    return;
  }
  yield delay(msUntil);
  yield put(hydrateSessionAction.request());
}

function* watchProactiveRefresh(): Generator<any, void, any> {
  // takeLatest cancels the previous scheduled delay when any of these actions
  // fire. logoutRequestAction.success is included so a timer armed during the
  // previous session can't fire on the login screen (the restarted task sees
  // no access token and exits immediately).
  yield takeLatest([
    setTokensAction,
    hydrateSessionAction.success,
    logoutRequestAction.success,
  ], scheduleProactiveRefresh);
}

export function* watchTokenHandler(): Generator<any, void, any> {
  yield all([
    watchHydrateSession(),
    watchProactiveRefresh(),
  ]);
}

