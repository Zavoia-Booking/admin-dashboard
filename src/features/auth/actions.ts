import { createAsyncAction, createAction } from "typesafe-actions";
import type { 
  RegisterOwnerPayload, 
  AuthUser, 
  CheckTeamInvitationResponse,
  CompleteTeamInvitationPayload,
  CompleteTeamInvitationResponse,
} from "./types";

export const setTokensAction = createAction(
  'auth/SET_TOKENS',
)<{ accessToken: string | null, csrfToken: string | null, refreshToken?: string | null }>();

export const setAuthLoadingAction = createAction(
  'auth/SET_AUTH_LOADING',
)<{ isLoading: boolean }>();

export const setMemberRegistrationLoadingAction = createAction(
  'auth/SET_MEMBER_REGISTRATION_LOADING',
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

export const forgotPasswordAction = createAsyncAction(
  'auth/FORGOT_PASSWORD_REQUEST',
  'auth/FORGOT_PASSWORD_SUCCESS',
  'auth/FORGOT_PASSWORD_FAILURE',
)<{ email: string }, void, { message: string }>();

export const resetPasswordAction = createAsyncAction(
  'auth/RESET_PASSWORD_REQUEST',
  'auth/RESET_PASSWORD_SUCCESS',
  'auth/RESET_PASSWORD_FAILURE',
)<{ token: string, password: string }, void, { message: string }>();

export const clearAuthErrorAction = createAction(
  'auth/CLEAR_AUTH_ERROR',
)<void>();

export const googleLoginAction = createAsyncAction(
  'auth/GOOGLE_LOGIN_REQUEST',
  'auth/GOOGLE_LOGIN_SUCCESS',
  'auth/GOOGLE_LOGIN_FAILURE',
)<{ code: string, redirectUri: string }, { accessToken: string, csrfToken: string | null, user: AuthUser | null }, { message: string }>();

export const googleRegisterAction = createAsyncAction(
  'auth/GOOGLE_REGISTER_REQUEST',
  'auth/GOOGLE_REGISTER_SUCCESS',
  'auth/GOOGLE_REGISTER_FAILURE',
)<{ code: string, redirectUri: string }, { accessToken: string, csrfToken: string | null, user: AuthUser | null }, { message: string }>();

// In-flow Google collision modal controls
export const openAccountLinkingModal = createAction(
  'auth/OPEN_ACCOUNT_LINKING_MODAL',
)<{ suggestedNext?: string; txId?: string }>();

export const closeAccountLinkingModal = createAction(
  'auth/CLOSE_ACCOUNT_LINKING_MODAL',
)<void>();

// Re-auth then link actions
export const reauthForLinkAction = createAsyncAction(
  'auth/REAUTH_FOR_LINK_REQUEST',
  'auth/REAUTH_FOR_LINK_SUCCESS',
  'auth/REAUTH_FOR_LINK_FAILURE',
)<{ email: string; password: string }, { proof: string }, { message: string }>();

export const linkGoogleAction = createAsyncAction(
  'auth/LINK_GOOGLE_REQUEST',
  'auth/LINK_GOOGLE_SUCCESS',
  'auth/LINK_GOOGLE_FAILURE',
)<{ tx_id: string; proof: string }, { message: string }, { message: string }>();

export const unlinkGoogleAction = createAsyncAction(
  'auth/UNLINK_GOOGLE_REQUEST',
  'auth/UNLINK_GOOGLE_SUCCESS',
  'auth/UNLINK_GOOGLE_FAILURE',
)<{ password: string }, { message: string }, { message: string }>();

// Link Google from Settings by exchanging auth code (authenticated user)
export const linkGoogleByCodeAction = createAsyncAction(
  'auth/LINK_GOOGLE_BY_CODE_REQUEST',
  'auth/LINK_GOOGLE_BY_CODE_SUCCESS',
  'auth/LINK_GOOGLE_BY_CODE_FAILURE',
)<{ code: string; redirectUri: string }, { message: string; user: AuthUser; accessToken?: string; csrfToken?: string | null }, { message: string }>();

export const selectBusinessAction = createAsyncAction(
  'auth/SELECT_BUSINESS_REQUEST',
  'auth/SELECT_BUSINESS_SUCCESS',
  'auth/SELECT_BUSINESS_FAILURE',
)<{ selectionToken: string; businessId: number }, { accessToken: string; csrfToken: string | null; user: AuthUser | null }, { message: string }>();

export const sendBusinessLinkEmailAction = createAsyncAction(
  'auth/SEND_BUSINESS_LINK_EMAIL_REQUEST',
  'auth/SEND_BUSINESS_LINK_EMAIL_SUCCESS',
  'auth/SEND_BUSINESS_LINK_EMAIL_FAILURE',
)<{ email: string }, { message: string }, { message: string }>();

export const closeAccountLinkingRequiredModal = createAction(
  'auth/CLOSE_ACCOUNT_LINKING_REQUIRED_MODAL',
)<void>();

export const dismissBusinessSelectorModal = createAction(
  'auth/DISMISS_BUSINESS_SELECTOR_MODAL',
)<void>();

export const resetRegistrationFlag = createAction(
  'auth/RESET_REGISTRATION_FLAG',
)<void>();

// Team Invitation Actions
export const checkTeamInvitationAction = createAsyncAction(
  'auth/CHECK_TEAM_INVITATION_REQUEST',
  'auth/CHECK_TEAM_INVITATION_SUCCESS',
  'auth/CHECK_TEAM_INVITATION_FAILURE',
)<{ token: string }, CheckTeamInvitationResponse, { message: string }>();

export const completeTeamInvitationAction = createAsyncAction(
  'auth/COMPLETE_TEAM_INVITATION_REQUEST',
  'auth/COMPLETE_TEAM_INVITATION_SUCCESS',
  'auth/COMPLETE_TEAM_INVITATION_FAILURE',
)<CompleteTeamInvitationPayload, CompleteTeamInvitationResponse, { message: string }>();
