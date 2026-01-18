import { call, put, takeLatest, select, delay, all } from "redux-saga/effects";
import { refreshSession, readCookie, CSRF_COOKIE_NAME } from "../../shared/lib/http";
import { hydrateSessionAction, setTokensAction } from "./actions";
import type { RootState } from "../../app/providers/store";
import { isNativeApp } from "../../app/config/env";
// no-op


function* hydrateSessionWorker(): Generator<any, void, any> {
  try {
    // Skip hydrate during Google OAuth redirect callback (race avoidance)
    const urlHasCode = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("code");
    const hasAccessToken: string | null = yield select((s: RootState) => s.auth.accessToken);
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
      yield put(hydrateSessionAction.failure({ message: "No session to hydrate" }));
      return;
    }

    // Trigger refresh via single-flight helper (also updates redux)
    // refreshSession already updates Redux state; nothing else needed here
    yield call(refreshSession);
  } catch (e: any) {
    yield put(hydrateSessionAction.failure(e?.message || "Unable to hydrate session"));
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
  // takeLatest cancels the previous scheduled delay when any of these actions fire
  yield takeLatest([
    setTokensAction, 
    hydrateSessionAction.success, 
  ], scheduleProactiveRefresh);
}

export function* watchTokenHandler(): Generator<any, void, any> {
  yield all([
    watchHydrateSession(),
    watchProactiveRefresh(),
  ]);
}

