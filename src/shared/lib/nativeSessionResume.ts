import type { Store } from "redux";
import type { AuthState } from "../../features/auth/types";
import { hydrateSessionAction } from "../../features/auth/actions";
import { isNativeApp } from "../../app/config/env";

const EXPIRY_SLACK_MS = 2 * 60_000;

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
 * Native only. The webview pauses JS timers while the app is backgrounded, so
 * the proactive-refresh timer (hydrateSession.saga) can be long overdue by the
 * time the user returns to the app - leaving a stale access token and 401s
 * with no page reload to recover from (unlike web, where F5 re-hydrates).
 *
 * On foreground we re-check the access token and hydrate only when it is
 * expired or about to expire; a quick app switch costs zero requests. A
 * successful hydrate also re-arms the proactive-refresh timer.
 */
export function initNativeSessionResume(store: Store<{ auth: AuthState } & any>): void {
  if (!isNativeApp() || typeof document === "undefined") return;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const accessToken = store.getState().auth.accessToken;
    if (!accessToken || !tokenExpiresSoon(accessToken)) return;
    store.dispatch(hydrateSessionAction.request());
  });
}
