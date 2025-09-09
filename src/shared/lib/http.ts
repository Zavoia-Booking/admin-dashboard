import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import type { Store } from "redux";
import {
  setTokensAction,
  setCsrfToken as setCsrfTokenAction,
  logoutRequestAction,
  hydrateSessionAction,
} from "../../features/auth/actions";
import type { AuthState } from "../../features/auth/types";

// ---- CONFIG ----
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
export const REFRESH_ENDPOINT = "/auth/refresh";
export const LOGOUT_ENDPOINT = "/auth/logout";
export const CSRF_COOKIE_NAME = "csrfToken";

// ---- INTERNAL STATE (single-flight refresh) ----
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];
let _storeRef: Store<{ auth: AuthState }> | null = null;

// ---- COOKIE UTILS ----
export function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
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
    const state = store.getState();
    const accessToken = state.auth.accessToken;
    let currentLocationId: number | null = state?.locations?.current?.id;
    // Fallback to persisted id on hard refresh before locations state hydrates
    if (!currentLocationId) {
      try {
        const storedId = localStorage.getItem('currentLocationId');
        if (storedId) currentLocationId = parseInt(storedId);
      } catch {}
    }
    const url = config.url ?? "";
    const isRefreshCall = url.startsWith(REFRESH_ENDPOINT);
    const isLogoutCall = url.startsWith(LOGOUT_ENDPOINT);
    const csrfHeaderNeeded = isRefreshCall || isLogoutCall;

    if (accessToken && config.headers) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    if (csrfHeaderNeeded && config.headers) {
      const csrf = state.auth.csrfToken ?? readCookie(CSRF_COOKIE_NAME);
      if (csrf) config.headers["x-csrf-token"] = csrf;
    }
    if (currentLocationId && config.headers) {
      (config.headers as any)["x-location-id"] = currentLocationId;
    }
    return config;
  });

  // RESPONSE: 401 → refresh (only when token expired) → replay (single-flight)
  client.interceptors.response.use(
    (res: AxiosResponse) => res,
    async (error) => {
      const original = error.config;

      const is401 = error?.response?.status === 401;
      const isRefreshCall = (original?.url ?? "").startsWith(REFRESH_ENDPOINT);
      const isLogoutCall = (original?.url ?? "").startsWith(LOGOUT_ENDPOINT);
      // Determine if 401 is due to an expired token
      const www: string | undefined = error?.response?.headers?.["www-authenticate"];
      const code: string | undefined = error?.response?.data?.code;
      const errStr: string | undefined = error?.response?.data?.error || error?.response?.data?.message;
      const isExpiredHeader = typeof www === "string" && /error=\"invalid_token\"/i.test(www) && /expired/i.test(www);
      const isExpiredBody = code === "token_expired" || (typeof errStr === "string" && /expired/i.test(errStr));
      const isExpired = isExpiredHeader || isExpiredBody;

      // Do not attempt refresh for logout calls
      if (!is401 || isRefreshCall || isLogoutCall || original?._retry || !isExpired) {
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
  const state = _storeRef.getState();
  const csrf = state.auth.csrfToken ?? readCookie(CSRF_COOKIE_NAME);
  const { data } = await axios.post(
    `${API_BASE_URL}${REFRESH_ENDPOINT}`,
    {},
    {
      withCredentials: true, // send refresh cookie on /auth/refresh
      headers: csrf ? { "x-csrf-token": csrf } : {},
    }
  );

  const newAccessToken: string = data.accessToken;
  const newCsrfToken: string | null = data.csrfToken ?? null;

  const decoded = decodeJwt<{ tid?: string; sub?: string; roles?: string[]; email?: string }>(newAccessToken);
  const businessId = (decoded as any)?.tid ?? _storeRef.getState().auth.businessId;
  const user = decoded?.sub ? { id: decoded.sub, email: decoded?.email, roles: decoded?.roles } : undefined;

  _storeRef.dispatch(setTokensAction({ accessToken: newAccessToken, csrfToken: newCsrfToken }));
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

function waitForRefresh(): Promise<string> {
  return new Promise((resolve, reject) => {
    refreshQueue.push((token) => {
      if (!token) {
        reject(new Error("Session refresh failed"));
        return;
      }
      resolve(token);
    });
  });
}

async function ensureRefreshInFlight(): Promise<string> {
  if (!isRefreshing) {
    isRefreshing = true;
    // kick off the refresh, but do not await it here; callers wait via queue
    (async () => {
      try {
        const token = await performRefresh();
        refreshQueue.forEach((cb) => cb(token));
        refreshQueue = [];
      } catch (e: any) {
        refreshQueue.forEach((cb) => cb(null));
        refreshQueue = [];
        if (_storeRef) {
          _storeRef.dispatch(hydrateSessionAction.failure(e?.message || "Session refresh failed"));
          _storeRef.dispatch(logoutRequestAction.success());
        }
      } finally {
        isRefreshing = false;
      }
    })();
  }
  return waitForRefresh();
}

export async function refreshSession(): Promise<string> {
  return ensureRefreshInFlight();
}
