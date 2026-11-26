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
export const selectCurrentUserId = (s: { auth: AuthState }) => s.auth.user?.id;
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
export const selectIsDashboardUser = (s: { auth: AuthState }) => s.auth.user?.role === UserRole.DASHBOARD_USER;
export const selectIsLimitedAccess = (s: { auth: AuthState }) => s.auth.user?.limitedAccess === true;

// Entitlement selectors
export const selectEntitlements = (s: { auth: AuthState }) => s.auth.user?.entitlements;
export const selectIsEntitled = (s: { auth: AuthState }) => s.auth.user?.entitlements?.entitled ?? false;
export const selectEntitlementStatus = (s: { auth: AuthState }) => s.auth.user?.entitlements?.status ?? null;
export const selectIsLtd = (s: { auth: AuthState }) => s.auth.user?.entitlements?.status === 'ltd';
export const selectIsOnTrial = (s: { auth: AuthState }) => s.auth.user?.entitlements?.status === 'trial';
export const selectTrialDaysRemaining = (s: { auth: AuthState }) => s.auth.user?.entitlements?.daysRemaining ?? 0;
export const selectPaidTeamSeats = (s: { auth: AuthState }) => s.auth.user?.entitlements?.paidTeamSeats ?? 0;
export const selectHasWebsiteBuilder = (s: { auth: AuthState }) =>
  s.auth.user?.entitlements?.features?.websiteBuilder ?? false;