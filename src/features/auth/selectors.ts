import type { AuthState } from "./types";
import { UserRole } from "../../shared/types/auth";

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
export const selectTeamInvitationStatus = (s: { auth: AuthState }) => s.auth.teamInvitationStatus;
export const selectTeamInvitationData = (s: { auth: AuthState }) => s.auth.teamInvitationData;
export const selectTeamInvitationError = (s: { auth: AuthState }) => s.auth.teamInvitationError;
export const selectMemberRegistrationError = (s: { auth: AuthState }) => s.auth.memberRegistrationError;
export const selectIsMemberRegistrationLoading = (s: { auth: AuthState }) => s.auth.isMemberRegistrationLoading;

// Role selectors
export const selectUserRole = (s: { auth: AuthState }) => s.auth.user?.role as UserRole | undefined;
export const selectIsOwner = (s: { auth: AuthState }) => s.auth.user?.role === UserRole.OWNER;
export const selectIsTeamMember = (s: { auth: AuthState }) => s.auth.user?.role === UserRole.TEAM_MEMBER;