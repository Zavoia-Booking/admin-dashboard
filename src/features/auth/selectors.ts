import type { AuthState } from "./types";

export const selectAuth = (s: { auth: AuthState }) => s.auth;
export const selectAccessToken = (s: { auth: AuthState }) => s.auth.accessToken;
export const selectCsrfToken = (s: { auth: AuthState }) => s.auth.csrfToken;
export const selectIsAuthenticated = (s: { auth: AuthState }) => s.auth.isAuthenticated;
export const selectAuthStatus = (s: { auth: AuthState }) => s.auth.status;
export const selectAuthError = (s: { auth: AuthState }) => s.auth.error;
export const selectBusinessId = (s: { auth: AuthState }) => s.auth.businessId;
export const selectCurrentUser = (s: { auth: AuthState }) => s.auth.user;
export const selectAccountLinkingRequired = (s: { auth: AuthState }) => s.auth.accountLinkingRequired;
export const selectAuthIsLoading = (s: { auth: AuthState }) => s.auth.isLoading;
export const selectAuthIsRegistration = (s: { auth: AuthState }) => s.auth.isRegistration;