import { createAsyncAction, createAction } from "typesafe-actions";
import type { RegisterOwnerPayload, AuthUser } from "./types";

export const setTokensAction = createAction(
  'auth/SET_TOKENS',
)<{ accessToken: string | null, csrfToken: string | null }>();

export const setAuthLoadingAction = createAction(
  'auth/SET_AUTH_LOADING',
)<{ isLoading: boolean }>();

export const setAuthUserAction = createAction(
  'auth/SET_AUTH_USER',
)<{ user: AuthUser | null }>();

export const setCsrfToken = createAction(
  'auth/SET_CSRF_TOKEN',
)<{ csrfToken: string | null }>();

export const setBusinessId = createAction(
  'auth/SET_BUSINESS_ID',
)<{ businessId: string | null }>();

export const setStatus = createAction(
  'auth/SET_STATUS',
)<{ status: "idle" | "loading" | "authenticated" | "unauthenticated" | "error" }>();

export const hydrateSessionAction = createAsyncAction(
  'auth/HYDRATE_SESSION_REQUEST',
  'auth/HYDRATE_SESSION_SUCCESS',
  'auth/HYDRATE_SESSION_FAILURE',
)<void, { accessToken: string, csrfToken: string | null, businessId: string | null, user: AuthUser | null }, { message: string }>();

export const registerOwnerRequestAction = createAsyncAction(
  'auth/REGISTER_OWNER_REQUEST',
  'auth/REGISTER_OWNER_SUCCESS',
  'auth/REGISTER_OWNER_FAILURE',
)<RegisterOwnerPayload, { user: AuthUser }, { message: string }>();

export const logoutRequestAction = createAsyncAction(
  'auth/LOGOUT_REQUEST',
  'auth/LOGOUT_SUCCESS',
  'auth/LOGOUT_FAILURE',
)<void, void, { message: string }>();

export const loginAction = createAsyncAction(
  'auth/LOGIN_REQUEST',
  'auth/LOGIN_SUCCESS',
  'auth/LOGIN_FAILURE',
)<{ email: string, password: string }, { accessToken: string, csrfToken: string | null, user: AuthUser | null }, { message: string }>();

export const fetchCurrentUserAction = createAsyncAction(
  'auth/FETCH_CURRENT_USER_REQUEST',
  'auth/FETCH_CURRENT_USER_SUCCESS',
  'auth/FETCH_CURRENT_USER_FAILURE',
)<void, { user: AuthUser }, { message: string }>();
