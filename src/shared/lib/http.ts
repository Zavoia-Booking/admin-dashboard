import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import type { Store } from "redux";
import { toast } from "sonner";
import {
  setTokensAction,
  setCsrfToken as setCsrfTokenAction,
  logoutRequestAction,
  hydrateSessionAction,
} from "../../features/auth/actions";
import type { AuthState } from "../../features/auth/types";
import config, { isNativeApp } from "../../app/config/env";
import { tokenStorage } from "./tokenStorage";
import i18n from "./i18n";
import { markGlobalHttpErrorToastHandled } from "../utils/error";

// ---- CONFIG ----
const API_BASE_URL = config.API_URL;
export const REFRESH_ENDPOINT = "/auth/refresh";
export const LOGOUT_ENDPOINT = "/auth/logout";
export const CSRF_COOKIE_NAME = "csrfToken";
export const READ_REQUEST_TIMEOUT_MS = 30_000;

// ---- INTERNAL STATE (single-flight refresh) ----
let refreshPromise: Promise<string> | null = null;
let _storeRef: Store<{ auth: AuthState }> | null = null;

// ---- COOKIE UTILS ----
export function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string): void {
  // Expire under both variants the API may have set: host-only (local dev)
  // and the shared parent domain (staging/production).
  document.cookie = `${name}=; Max-Age=0; path=/`;
  const host = window.location.hostname;
  if (host.endsWith("zavoia.com")) {
    document.cookie = `${name}=; Max-Age=0; path=/; domain=.zavoia.com`;
  }
}

/**
 * CSRF value to send with refresh/logout. Cookie FIRST: the server rotates the
 * csrf cookie on every refresh, and another tab's refresh updates the (shared)
 * cookie while this tab's Redux copy goes stale — sending the Redux value then
 * fails the double-submit check ("Invalid CSRF token" after switching tabs).
 * Redux is only a fallback for the edge where the cookie is unreadable.
 */
function currentCsrfToken(state: { auth: AuthState }): string | null {
  return readCookie(CSRF_COOKIE_NAME) || state.auth.csrfToken;
}

// ---- OPTIONAL: decode JWT payload for UX-only claims ----
function decodeJwt<T = any>(token: string): T | null {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

// We pass the store in, so interceptors can access/getState/dispatch without circular deps
export function createApiClient(store: Store<{ auth: AuthState } & any>): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
  });

  // REQUEST: attach Authorization & (if calling refresh/logout) the CSRF header
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // Bound GET loads so a hung connection surfaces as an error instead of an
    // infinite skeleton. Mutations and uploads keep no timeout (slow uploads
    // and payment flows must never be aborted client-side). Read-style POST
    // endpoints opt into READ_REQUEST_TIMEOUT_MS in their feature API layer.
    // (axios defaults timeout to 0 = disabled, so a falsy check is the right guard)
    if ((config.method ?? "get").toLowerCase() === "get" && !config.timeout) {
      config.timeout = READ_REQUEST_TIMEOUT_MS;
    }
    const state = store.getState();
    const accessToken = state.auth.accessToken;
    const url = config.url ?? "";
    const isRefreshCall = url.startsWith(REFRESH_ENDPOINT);
    const isLogoutCall = url.startsWith(LOGOUT_ENDPOINT);
    const csrfHeaderNeeded = isRefreshCall || isLogoutCall;

    if (accessToken && config.headers) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    // The UI language being rendered right now, sent on EVERY request as the
    // x-locale header — the backend treats it as a fallback wherever a request
    // body carries no explicit `locale`, so transactional emails triggered by
    // this request (welcome, verification, reset, …) come back in the same
    // language the user was looking at.
    const uiLang = i18n.language?.slice(0, 2).toLowerCase();
    if (config.headers && (uiLang === "en" || uiLang === "ro")) {
      config.headers["x-locale"] = uiLang;
    }

    // Mark requests from native apps (for backend to skip CSRF validation)
    if (isNativeApp() && config.headers) {
      config.headers["X-Native-App"] = "capacitor";
    }
    
    // Always try to send CSRF token for protected endpoints (web only)
    if (csrfHeaderNeeded && config.headers && !isNativeApp()) {
      const csrf = currentCsrfToken(state);
      if (csrf) {
        config.headers["x-csrf-token"] = csrf;
      }
    }
    return config;
  });

  // RESPONSE: 401 → refresh (only when token expired) → replay (single-flight).
  //           402 subscription_required → soft-block toast (read-only mode safety net).
  client.interceptors.response.use(
    (res: AxiosResponse) => res,
    async (error) => {
      const original = error.config;

      const status = error?.response?.status;
      const code: string | undefined = error?.response?.data?.code;

      // 402 subscription_required: a write slipped through the proactive disable
      // (deep link, race, manual API call). Show a neutral toast and reject.
      if (status === 402 && code === "subscription_required") {
        const message = i18n.t("common:limitedUsage.blockedMessage");
        markGlobalHttpErrorToastHandled(error, "subscription_required");
        toast.error(message, {
          id: "subscription-required",
          closeButton: true,
          duration: 7000,
        });
        return Promise.reject(error);
      }

      const is401 = status === 401;
      const isRefreshCall = (original?.url ?? "").startsWith(REFRESH_ENDPOINT);
      const isLogoutCall = (original?.url ?? "").startsWith(LOGOUT_ENDPOINT);
      // Determine if 401 is due to an expired token
      const www: string | undefined = error?.response?.headers?.["www-authenticate"];
      const errStr: string | undefined = error?.response?.data?.error || error?.response?.data?.message;
      const isExpiredHeader = typeof www === "string" && /error="invalid_token"/i.test(www) && /expired/i.test(www);
      const isExpiredBody = code === "token_expired" || (typeof errStr === "string" && /expired/i.test(errStr));
      const isExpired = isExpiredHeader || isExpiredBody;

      // A 401 on a request that carried a Bearer token means our session is
      // stale even when the JWT itself hasn't expired (e.g. the access-token
      // record was revoked server-side) - the refresh flow re-mints it.
      // Credential 401s (wrong password on login / link confirmation) carry no
      // Authorization header and are rejected untouched, as before.
      const sentBearer = typeof original?.headers?.get === "function"
        ? !!original.headers.get("Authorization")
        : !!original?.headers?.["Authorization"];

      // Do not attempt refresh for refresh/logout calls or already-retried requests
      if (!is401 || isRefreshCall || isLogoutCall || original?._retry || !(isExpired || sentBearer)) {
        return Promise.reject(error);
      }

      original._retry = true;
      // ensure a single refresh is running and wait for it
      try {
        const token = await ensureRefreshInFlight();
        if (!original.headers) original.headers = {};
        original.headers["Authorization"] = `Bearer ${token}`;
        return client(original);
      } catch (e) {
        return Promise.reject(e);
      }
    }
  );

  return client;
}

// Convenience: a singleton client you can import after store is created
let _client: AxiosInstance | null = null;
export function initApiClient(store: Store<{ auth: AuthState }>) {
  _client = createApiClient(store);
  _storeRef = store;
  return _client;
}
export function apiClient(): AxiosInstance {
  if (!_client) throw new Error("apiClient not initialized. Call initApiClient(store) first.");
  return _client;
}

// ---- Single-flight refresh helper (shared by saga and interceptor) ----
async function performRefresh(): Promise<string> {
  if (!_storeRef) throw new Error("API client not initialized");
  const isNative = isNativeApp();

  // Cross-tab mutex (web only): /auth/refresh rotates the shared refresh +
  // csrf cookies, so two tabs refreshing concurrently consume the same
  // refresh token — the loser gets refresh_token_invalid and the server
  // clears the cookies, killing the session in every tab. Web Locks
  // serializes the tabs; each one then reads the freshly rotated cookies
  // inside its own turn. Browsers without Web Locks keep the in-tab
  // single-flight behavior.
  const locks = typeof navigator !== "undefined" ? (navigator as any).locks : undefined;
  if (!isNative && typeof locks?.request === "function") {
    return locks.request("zv-session-refresh", () => doPerformRefresh(isNative)) as Promise<string>;
  }
  return doPerformRefresh(isNative);
}

async function doPerformRefresh(isNative: boolean): Promise<string> {
  if (!_storeRef) throw new Error("API client not initialized");
  const state = _storeRef.getState();
  // Read the csrf cookie here, INSIDE the cross-tab lock — after another tab's
  // refresh rotated the cookies, this picks up the value the server expects.
  const csrf = !isNative ? currentCsrfToken(state) : null;

  // Build headers based on platform
  const headers: Record<string, string> = {};
  if (csrf) {
    headers["x-csrf-token"] = csrf;
  }
  if (isNative) {
    headers["X-Native-App"] = "capacitor";
  }

  // For native apps, get refresh token from Redux or persistent storage
  let refreshToken = state.auth.refreshToken;
  if (isNative && !refreshToken) {
    refreshToken = await tokenStorage.loadRefreshToken();
  }

  // For native apps, send refresh token in body (cookies don't work cross-origin)
  const body = isNative && refreshToken
    ? { refreshToken }
    : {};

  const { data } = await axios.post(
    `${API_BASE_URL}${REFRESH_ENDPOINT}`,
    body,
    {
      withCredentials: true, // send refresh cookie on /auth/refresh (web only)
      headers,
      timeout: READ_REQUEST_TIMEOUT_MS,
    }
  );

  const newAccessToken: string = data.accessToken;
  const newCsrfToken: string | null = data.csrfToken ?? null;
  const newRefreshToken: string | null = data.refreshToken ?? null; // For native apps

  // Persist refresh token to storage for native apps
  if (isNative && newRefreshToken) {
    await tokenStorage.saveRefreshToken(newRefreshToken);
  }

  // The access token's claims are { userId, userGuid, userRole, businessId } — there is no
  // tid claim. businessId is numeric in the JWT; normalize to string to match auth state.
  const decoded = decodeJwt<{ businessId?: number | string; sub?: string; roles?: string[]; email?: string }>(newAccessToken);
  const claimBusinessId = decoded?.businessId ?? (decoded as any)?.tid;
  const businessId = claimBusinessId != null ? String(claimBusinessId) : _storeRef.getState().auth.businessId;
  const user = decoded?.sub ? { id: decoded.sub, email: decoded?.email, roles: decoded?.roles } : undefined;

  _storeRef.dispatch(setTokensAction({ accessToken: newAccessToken, csrfToken: newCsrfToken, refreshToken: newRefreshToken }));
  _storeRef.dispatch(setCsrfTokenAction({ csrfToken: newCsrfToken }));
  _storeRef.dispatch(
    hydrateSessionAction.success({
      accessToken: newAccessToken,
      csrfToken: newCsrfToken,
      businessId,
      user: user as any,
    })
  );

  return newAccessToken;
}

async function ensureRefreshInFlight(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = performRefresh()
      .catch((error: any) => {
        // Only a definitive token rejection invalidates the session. During a
        // network outage or a server failure, reject the waiting requests but
        // keep the current session so the UI can show recoverable load errors.
        const rejectedByServer = [400, 401, 403].includes(error?.response?.status);
        if (isNativeApp() && rejectedByServer) {
          tokenStorage.clearRefreshToken().catch(() => {});
        }
        if (_storeRef && rejectedByServer) {
          // Drop the csrf cookie so the boot-time hasCsrf guard sees no
          // session (the server already cleared the refresh cookie on
          // refresh-token failures; this covers the csrf-failure path where
          // it doesn't).
          if (!isNativeApp()) {
            deleteCookie(CSRF_COOKIE_NAME);
          }
          // Order matters: logout.success resets auth state to IDLE, which
          // makes AuthGate immediately re-dispatch hydration — dispatching
          // the failure AFTER it leaves the state terminally UNAUTHENTICATED
          // (with the session-expired message for the login screen) instead
          // of looping refresh → fail → reset → refresh.
          _storeRef.dispatch(logoutRequestAction.success());
          _storeRef.dispatch(hydrateSessionAction.failure({ message: i18n.t("auth:page.errors.sessionExpired") }));
        }
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function refreshSession(): Promise<string> {
  return ensureRefreshInFlight();
}
