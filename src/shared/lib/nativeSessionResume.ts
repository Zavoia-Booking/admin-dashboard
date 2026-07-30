import type { Store } from "redux";
import type { AuthState, AuthUser } from "../../features/auth/types";
import { hydrateSessionAction, fetchCurrentUserAction } from "../../features/auth/actions";
import { isNativeApp } from "../../app/config/env";

const EXPIRY_SLACK_MS = 2 * 60_000;

/** How long a /me snapshot stays trusted across a foreground. */
const USER_STALE_MS = 30 * 60_000;

/**
 * Floor for the boundary path below. The billing webhook can trail the boundary
 * it crossed, and until it lands /me keeps returning the same passed date - the
 * floor stops that window from costing a request on every app switch.
 */
const USER_REFETCH_FLOOR_MS = 60_000;

function tokenExpiresSoon(token: string): boolean {
  try {
    const [, payload] = token.split(".");
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof json?.exp !== "number") return false;
    return json.exp * 1000 - Date.now() < EXPIRY_SLACK_MS;
  } catch {
    return false;
  }
}

/**
 * True once wall-clock has passed an entitlement boundary the cached user told
 * us about - trial end, or the end of the paid period. The server recomputes
 * entitlements per request, so a cached `entitled: true` is provably stale past
 * that instant and is worth a refetch even inside the staleness window.
 *
 * Team members get a trimmed /me with no subscription block; they fall back to
 * the time-based check alone.
 */
function entitlementBoundaryPassed(user: AuthUser, now: number): boolean {
  if (!user.entitlements?.entitled) return false;
  const boundaries = [user.subscription?.trialEndsAt, user.subscription?.currentPeriodEnd];
  return boundaries.some((iso) => {
    if (!iso) return false;
    const ts = Date.parse(iso);
    return Number.isFinite(ts) && now > ts;
  });
}

/**
 * Native only. The webview pauses JS timers while the app is backgrounded, so
 * the proactive-refresh timer (hydrateSession.saga) can be long overdue by the
 * time the user returns to the app - leaving a stale access token and 401s
 * with no page reload to recover from (unlike web, where F5 re-hydrates).
 *
 * On foreground we do two independent checks:
 *
 * 1. Access token - hydrate only when it is expired or about to expire; a quick
 *    app switch costs zero requests. A successful hydrate also re-arms the
 *    proactive-refresh timer.
 * 2. User snapshot - entitlements (trial state, plan tier, seat counts) reach
 *    the client only through /me; a refresh mints a token from JWT claims and
 *    carries none of them. A native webview survives for days, so without this
 *    the app keeps acting on whatever the last /me said - showing write
 *    affordances after a trial lapsed, or staying read-only after the owner
 *    paid somewhere else.
 */
export function initNativeSessionResume(store: Store<{ auth: AuthState } & any>): void {
  if (!isNativeApp() || typeof document === "undefined") return;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const { accessToken, user, lastUserFetchAt } = store.getState().auth;
    if (!accessToken) return;

    if (tokenExpiresSoon(accessToken)) {
      store.dispatch(hydrateSessionAction.request());
    }

    // No cached user - AuthGate already fetches one on that path.
    if (!user) return;

    const now = Date.now();
    const age = lastUserFetchAt ? now - lastUserFetchAt : Number.POSITIVE_INFINITY;
    const stale =
      age > USER_STALE_MS ||
      (age > USER_REFETCH_FLOOR_MS && entitlementBoundaryPassed(user, now));
    if (!stale) return;

    // Sent with the current token: if it just expired, the 401 interceptor
    // joins the same single-flight refresh above and replays this request.
    store.dispatch(fetchCurrentUserAction.request());
  });
}
