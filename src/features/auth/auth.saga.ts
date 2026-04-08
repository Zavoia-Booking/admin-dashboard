import { takeLatest, call, put, all } from "redux-saga/effects";
import {
  registerOwnerRequestAction,
  setAuthLoadingAction,
  setAuthUserAction,
  setTokensAction,
  setCsrfToken,
  logoutRequestAction,
  loginAction,
  fetchCurrentUserAction,
  forgotPasswordAction,
  resetPasswordAction,
  googleLoginAction,
  googleRegisterAction,
  openAccountLinkingModal,
  selectBusinessAction,
  sendBusinessLinkEmailAction,
  setMemberRegistrationLoadingAction,
  checkTeamInvitationAction,
  completeTeamInvitationAction,
  clearAuthErrorAction,
  showAccountStatusPromptAction,
  acceptAccountStatusPromptAction,
  declineAccountStatusPromptAction,
  clearAccountStatusPromptAction,
  dismissBusinessSelectorModal,
} from "./actions";
import { logoutApi, registerOwnerRequestApi, loginApi, getCurrentUserApi, forgotPasswordApi, resetPasswordApi, googleLoginApi, googleRegisterApi, reauthForLinkApi, linkGoogleApi, unlinkGoogleApi, linkGoogleByCodeApi, selectBusinessApi, sendBusinessLinkEmailApi, checkTeamInvitationApi, completeTeamInvitationApi, reactivateAccountApi, cancelAccountDeletionApi } from "./api";
import type { RegisterOwnerPayload, AuthResponse, AuthUser } from "./types";
import { reauthForLinkAction, linkGoogleAction, closeAccountLinkingModal, unlinkGoogleAction, linkGoogleByCodeAction } from "./actions";
import { listLocationsAction } from "../locations/actions";
import { select } from "redux-saga/effects";
import type { RootState } from "../../app/providers/store";
import { refreshSession } from "../../shared/lib/http";
import { tokenStorage } from "../../shared/lib/tokenStorage";
import { getErrorMessage } from "../../shared/utils/error";

function* handleRegisterOwnerRequest(action: { type: string; payload: RegisterOwnerPayload }): Generator<any, void, any> {
  try {
    yield put(setAuthLoadingAction({ isLoading: true }));
    const response: AuthResponse = (yield call(registerOwnerRequestApi, action.payload)) as AuthResponse;

    // Store access token in Redux (memory) + optional CSRF token + refresh token for native apps
    yield put(setTokensAction({ accessToken: response.accessToken, csrfToken: response.csrfToken ?? null, refreshToken: response.refreshToken ?? null }));
    
    // Persist refresh token to storage for native apps
    if (response.refreshToken) {
      yield call([tokenStorage, 'saveRefreshToken'], response.refreshToken);
    }
    
    if (response.csrfToken) {
        yield put(setCsrfToken({ csrfToken: response.csrfToken }));
    }

    // Store user
    yield put(setAuthUserAction({ user: response.user }));
    yield put(registerOwnerRequestAction.success({ user: response.user }));
  } catch (error: any) {
    const statusCode = error?.response?.status;
    const code = error?.response?.data?.code;
    
    // Handle account needs business owner account (409 status)
    if (statusCode === 409 && code === 'account_exists_needs_business_owner_account') {
      const details = error.response.data.details;
      yield put(registerOwnerRequestAction.failure({ 
        message: 'account_exists_needs_business_owner_account',
        accountLinkingDetails: details
      } as any));
      yield put(setAuthLoadingAction({ isLoading: false }));
      return;
    }
    
    const message = getErrorMessage(error);
    
    yield put(registerOwnerRequestAction.failure({ message }));
  } finally {
    yield put(setAuthLoadingAction({ isLoading: false }));
  }
}

function* handleLogout(): Generator<any, void, any> {
  try {
    // Clear stored refresh token for native apps
    yield call([tokenStorage, 'clearRefreshToken']);
    
    yield call(logoutApi);
    yield put(logoutRequestAction.success());
  } catch (error: any) {
    // Still clear the token even if API call fails
    yield call([tokenStorage, 'clearRefreshToken']);
    
    const message = error?.response?.data?.error || error?.message || "Logout failed";
    yield put(logoutRequestAction.failure(message));
  }
}

function* handleLogin(action: { type: string; payload: { email: string, password: string } }): Generator<any, void, any> {
  try {
    yield put(setAuthLoadingAction({ isLoading: true }));
    const response: AuthResponse = (yield call(loginApi, action.payload)) as AuthResponse;

    // Check for disabled or scheduled-for-deletion account
    if (response.accountDisabled || response.accountScheduledForDeletion) {
      // Store tokens so we can call reactivate/cancel-delete APIs
      yield put(setTokensAction({ accessToken: response.accessToken, csrfToken: response.csrfToken ?? null, refreshToken: response.refreshToken ?? null }));
      if (response.refreshToken) {
        yield call([tokenStorage, 'saveRefreshToken'], response.refreshToken);
      }
      if (response.csrfToken) {
        yield put(setCsrfToken({ csrfToken: response.csrfToken }));
      }
      yield put(setAuthUserAction({ user: response.user }));

      // Show the account status prompt dialog instead of completing login
      yield put(showAccountStatusPromptAction({
        type: response.accountDisabled ? 'disabled' : 'scheduled_for_deletion',
      }));
      yield put(setAuthLoadingAction({ isLoading: false }));
      return;
    }

    // Store access token in Redux (memory) + optional CSRF token + refresh token for native apps
    yield put(setTokensAction({ accessToken: response.accessToken, csrfToken: response.csrfToken ?? null, refreshToken: response.refreshToken ?? null }));
    
    // Persist refresh token to storage for native apps
    if (response.refreshToken) {
      yield call([tokenStorage, 'saveRefreshToken'], response.refreshToken);
    }

    // Fetch locations post-login
    yield put(listLocationsAction.request());
    if (response.csrfToken) {
      yield put(setCsrfToken({ csrfToken: response.csrfToken }));
    }

    // Store user
    yield put(setAuthUserAction({ user: response.user }));
    // Ensure latest user data
    yield put(fetchCurrentUserAction.request());
    yield put(loginAction.success({
      accessToken: response.accessToken, 
      csrfToken: response.csrfToken ?? null, 
      user: response.user 
    }));
  } catch (error: any) {
    const statusCode = error?.response?.status;
    const code = error?.response?.data?.code;
    
    // Handle business selection required (300 status)
    if (statusCode === 300 && code === 'business_selection_required') {
      const details = error.response.data.details;
      yield put(loginAction.failure({ 
        message: 'business_selection_required',
        selectionToken: details.selectionToken,
        businesses: details.businesses
      } as any));
      yield put(setAuthLoadingAction({ isLoading: false }));
      return;
    }
    
    // Handle account needs business owner account (409 status)
    if (statusCode === 409 && code === 'account_exists_needs_business_owner_account') {
      const details = error.response.data.details;
      yield put(loginAction.failure({ 
        message: 'account_exists_needs_business_owner_account',
        accountLinkingDetails: details
      } as any));
      yield put(setAuthLoadingAction({ isLoading: false }));
      return;
    }
    
    const message = getErrorMessage(error);
    
    yield put(loginAction.failure({ message }));
  } finally {
    yield put(setAuthLoadingAction({ isLoading: false }));
  }
}

export function* authSaga(): Generator<any, void, any> {
  yield all([
    takeLatest(registerOwnerRequestAction.request, handleRegisterOwnerRequest),
    takeLatest(logoutRequestAction.request, handleLogout),
    takeLatest(loginAction.request, handleLogin),
    takeLatest(fetchCurrentUserAction.request, handleFetchCurrentUser),
    takeLatest(forgotPasswordAction.request, handleForgotPassword),
    takeLatest(resetPasswordAction.request, handleResetPassword),
    takeLatest(googleLoginAction.request, handleGoogleLogin),
    takeLatest(googleRegisterAction.request, handleGoogleRegister),
    takeLatest(reauthForLinkAction.request, handleReauthForLink),
    takeLatest(linkGoogleAction.request, handleLinkGoogle),
    takeLatest(linkGoogleByCodeAction.request, handleLinkGoogleByCode),
    takeLatest(unlinkGoogleAction.request, handleUnlinkGoogle),
    takeLatest(selectBusinessAction.request, handleSelectBusiness),
    takeLatest(sendBusinessLinkEmailAction.request, handleSendBusinessLinkEmail),
    takeLatest(checkTeamInvitationAction.request, handleCheckTeamInvitation),
    takeLatest(completeTeamInvitationAction.request, handleCompleteTeamInvitation),
    takeLatest(acceptAccountStatusPromptAction, handleAcceptAccountStatusPrompt),
    takeLatest(declineAccountStatusPromptAction, handleDeclineAccountStatusPrompt),
  ]);
}

function* handleFetchCurrentUser(): Generator<any, void, any> {
  try {
    const user: AuthUser = (yield call(getCurrentUserApi)) as any;
    yield put(setAuthUserAction({ user }));
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Fetch current user failed";
    yield put(fetchCurrentUserAction.failure({ message }));
  }
}

function* handleForgotPassword(action: { type: string; payload: { email: string } }) {
  try {
    yield call(forgotPasswordApi, action.payload);
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Forgot password failed";
    yield put(forgotPasswordAction.failure(message));
  }
}

function* handleResetPassword(action: { type: string; payload: { token: string, password: string } }) {
  try {
    yield call(resetPasswordApi, action.payload);
    yield put(resetPasswordAction.success());
  } catch (error: any) {
    const message = getErrorMessage(error);
    yield put(resetPasswordAction.failure({ message }));
  }
}

function* handleGoogleLogin(action: ReturnType<typeof googleLoginAction.request>) {
  try {
    yield put(setAuthLoadingAction({ isLoading: true }));
    const response: AuthResponse = yield call(googleLoginApi, action.payload);

    // Check for disabled or scheduled-for-deletion account
    if (response.accountDisabled || response.accountScheduledForDeletion) {
      // Store tokens so we can call reactivate/cancel-delete APIs
      yield put(setTokensAction({ accessToken: response.accessToken, csrfToken: response.csrfToken ?? null, refreshToken: response.refreshToken ?? null }));
      if (response.refreshToken) {
        yield call([tokenStorage, 'saveRefreshToken'], response.refreshToken);
      }
      if (response.csrfToken) {
        yield put(setCsrfToken({ csrfToken: response.csrfToken }));
      }
      yield put(setAuthUserAction({ user: response.user }));

      // Show the account status prompt dialog instead of completing login
      yield put(showAccountStatusPromptAction({
        type: response.accountDisabled ? 'disabled' : 'scheduled_for_deletion',
      }));
      yield put(setAuthLoadingAction({ isLoading: false }));
      return;
    }

    // Store access token in Redux (memory) + optional CSRF token + refresh token for native apps
    yield put(setTokensAction({ accessToken: response.accessToken, csrfToken: response.csrfToken ?? null, refreshToken: response.refreshToken ?? null }));
    
    // Persist refresh token to storage for native apps
    if (response.refreshToken) {
      yield call([tokenStorage, 'saveRefreshToken'], response.refreshToken);
    }
    
    // Fetch locations post-authentication only if user has a business
    const hasBusinessGoogle = Boolean(response.user?.businessId || (response.user as any)?.business?.id);
    if (hasBusinessGoogle) {
      yield put(listLocationsAction.request());
    }
    if (response.csrfToken) {
      yield put(setCsrfToken({ csrfToken: response.csrfToken }));
    }

    // Store user from login response first
    yield put(setAuthUserAction({ user: response.user }));

    // Fetch fresh user data (with full entitlements) before completing login
    // This prevents the SubscriptionGate from flashing during redirect
    let userForSuccess = response.user;
    try {
      const freshUser: AuthUser = (yield call(getCurrentUserApi)) as AuthUser;
      yield put(setAuthUserAction({ user: freshUser }));
      userForSuccess = freshUser;
    } catch {
      // Fall back to login response user data (already set above)
    }

    // Use isNewUser from backend response to determine if this is a registration
    yield put(googleLoginAction.success({
      accessToken: response.accessToken,
      csrfToken: response.csrfToken ?? null,
      user: userForSuccess,
      isNewUser: response.isNewUser ?? false
    } as any));
  } catch (error: any) {
    const statusCode = error?.response?.status;
    const code = error?.response?.data?.code;
    const details = error?.response?.data?.details;

    // Handle business selection required (300 status)
    if (statusCode === 300 && code === 'business_selection_required') {
      const details = error.response.data.details;
      yield put(googleLoginAction.failure({
        message: 'business_selection_required',
        selectionToken: details.selectionToken,
        businesses: details.businesses
      } as any));
      yield put(setAuthLoadingAction({ isLoading: false }));
      return;
    }

    // Handle account needs business owner account (409 status)
    if (statusCode === 409 && code === 'account_exists_needs_business_owner_account') {
      yield put(googleLoginAction.failure({
        message: 'account_exists_needs_business_owner_account',
        accountLinkingDetails: details
      } as any));
      yield put(setAuthLoadingAction({ isLoading: false }));
      return;
    }

    // Handle existing account with unlinked Google
    if (code === 'account_exists_unlinked_google') {
      try { sessionStorage.setItem('linkContext', 'login'); } catch { /* empty */ }
      yield put(clearAuthErrorAction()); // Clear error so error handler doesn't redirect
      yield put(openAccountLinkingModal({ suggestedNext: details?.suggestedNext, txId: details?.tx_id }));
      yield put(setAuthLoadingAction({ isLoading: false }));
      return;
    }

    // Handle pending team member invitation
    if (statusCode === 403 && code === 'pending_invitation_requires_acceptance') {
      yield put(googleLoginAction.failure({
        message: 'pending_invitation_requires_acceptance',
        invitationDetails: details
      } as any));
      yield put(setAuthLoadingAction({ isLoading: false }));
      return;
    }

    const message = getErrorMessage(error);
    yield put(googleLoginAction.failure({ message }));
  } finally {
    yield put(setAuthLoadingAction({ isLoading: false }));
  }
}

function* handleGoogleRegister(action: ReturnType<typeof googleRegisterAction.request>) {
  try {
    yield put(setAuthLoadingAction({ isLoading: true }));
    const response: AuthResponse = yield call(googleRegisterApi, action.payload);

    // Check for disabled or scheduled-for-deletion account (existing user via register page)
    if (response.accountDisabled || response.accountScheduledForDeletion) {
      yield put(setTokensAction({ accessToken: response.accessToken, csrfToken: response.csrfToken ?? null, refreshToken: response.refreshToken ?? null }));
      if (response.refreshToken) {
        yield call([tokenStorage, 'saveRefreshToken'], response.refreshToken);
      }
      if (response.csrfToken) {
        yield put(setCsrfToken({ csrfToken: response.csrfToken }));
      }
      yield put(setAuthUserAction({ user: response.user }));

      yield put(showAccountStatusPromptAction({
        type: response.accountDisabled ? 'disabled' : 'scheduled_for_deletion',
      }));
      yield put(setAuthLoadingAction({ isLoading: false }));
      return;
    }

    // Store access token in Redux (memory) + optional CSRF token + refresh token for native apps
    yield put(setTokensAction({ accessToken: response.accessToken, csrfToken: response.csrfToken ?? null, refreshToken: response.refreshToken ?? null }));
    
    // Persist refresh token to storage for native apps
    if (response.refreshToken) {
      yield call([tokenStorage, 'saveRefreshToken'], response.refreshToken);
    }
    
    // Fetch locations post-authentication only if user has a business
    const hasBusinessGoogle = Boolean(response.user?.businessId || (response.user as any)?.business?.id);
    if (hasBusinessGoogle) {
      yield put(listLocationsAction.request());
    }
    if (response.csrfToken) {
      yield put(setCsrfToken({ csrfToken: response.csrfToken }));
    }

    // Store user from register response first
    yield put(setAuthUserAction({ user: response.user }));

    // Fetch fresh user data (with full entitlements) before completing registration
    // This prevents the SubscriptionGate from flashing during redirect
    let userForSuccess = response.user;
    try {
      const freshUser: AuthUser = (yield call(getCurrentUserApi)) as AuthUser;
      yield put(setAuthUserAction({ user: freshUser }));
      userForSuccess = freshUser;
    } catch {
      // Fall back to register response user data (already set above)
    }

    // Use isNewUser from backend response to determine if this is a registration
    yield put(googleRegisterAction.success({
      accessToken: response.accessToken,
      csrfToken: response.csrfToken ?? null,
      user: userForSuccess,
      isNewUser: response.isNewUser ?? true
    } as any));
  } catch (error: any) {
    const statusCode = error?.response?.status;
    const code = error?.response?.data?.code;
    const details = error?.response?.data?.details;
    
    // Handle business selection required (300 status) - can happen when existing user logs in via register page
    if (statusCode === 300 && code === 'business_selection_required') {
      const details = error.response.data.details;
      yield put(googleRegisterAction.failure({ 
        message: 'business_selection_required',
        selectionToken: details.selectionToken,
        businesses: details.businesses
      } as any));
      yield put(setAuthLoadingAction({ isLoading: false }));
      return;
    }
    
    // Handle account needs business owner account (409 status)
    if (statusCode === 409 && code === 'account_exists_needs_business_owner_account') {
      yield put(googleRegisterAction.failure({ 
        message: 'account_exists_needs_business_owner_account',
        accountLinkingDetails: details
      } as any));
      yield put(setAuthLoadingAction({ isLoading: false }));
      return;
    }
    
    // Handle existing account with unlinked Google
    if (code === 'account_exists_unlinked_google') {
      try { sessionStorage.setItem('linkContext', 'register'); } catch { /* empty */ }
      yield put(clearAuthErrorAction()); // Clear error so error handler doesn't redirect
      yield put(openAccountLinkingModal({ suggestedNext: details?.suggestedNext, txId: details?.tx_id }));
      yield put(setAuthLoadingAction({ isLoading: false }));
      return;
    }
    
    // Handle pending team member invitation
    if (statusCode === 403 && code === 'pending_invitation_requires_acceptance') {
      yield put(googleRegisterAction.failure({ 
        message: 'pending_invitation_requires_acceptance',
        invitationDetails: details
      } as any));
      yield put(setAuthLoadingAction({ isLoading: false }));
      return;
    }

    const message = getErrorMessage(error);
    yield put(googleRegisterAction.failure({ message }));
  } finally {
    yield put(setAuthLoadingAction({ isLoading: false }));
  }
}

function* handleReauthForLink(action: ReturnType<typeof reauthForLinkAction.request>): Generator<any, void, any> {
  try {
    const txId: string | undefined = yield select((s: RootState) => (s as any).auth.pendingLinkTxId);
    
    if (!txId) {
      yield put(reauthForLinkAction.failure({ message: 'Link session expired. Please try Google sign-in again.' }));
      yield put(closeAccountLinkingModal());
      return;
    }

    const res: { proof: string } = yield call(reauthForLinkApi, action.payload);
    yield put(reauthForLinkAction.success({ proof: res.proof }));
    yield put(linkGoogleAction.request({ tx_id: txId, proof: res.proof }));
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || 'Verification failed';
    yield put(reauthForLinkAction.failure({ message }));
  }
}

function* handleLinkGoogle(action: ReturnType<typeof linkGoogleAction.request>): Generator<any, void, any> {
  try {
    // Call linking API - now returns auth tokens
    const response: AuthResponse = yield call(linkGoogleApi, action.payload);
    
    // Store authentication tokens (auto-login) + refresh token for native apps
    yield put(setTokensAction({ accessToken: response.accessToken, csrfToken: response.csrfToken ?? null, refreshToken: response.refreshToken ?? null }));
    
    // Persist refresh token to storage for native apps
    if (response.refreshToken) {
      yield call([tokenStorage, 'saveRefreshToken'], response.refreshToken);
    }
    
    yield put(setAuthUserAction({ user: response.user }));
    
    // Also fetch current user to ensure we have the latest data
    yield put(fetchCurrentUserAction.request());
    
    // Close modal and show success
    yield put(linkGoogleAction.success({ message: 'Google account linked successfully!' }));
    yield put(closeAccountLinkingModal());
    
    // Determine context; for register flow we stay on wizard (handled elsewhere)
    const { toast } = yield import('sonner');
    toast.success('Google account linked!');
    
    // Clear context marker
    try { sessionStorage.removeItem('linkContext'); } catch { /* empty */ }
    
    // For register flow: do not redirect. For other contexts we also avoid forced redirect here.
    // If a redirect is desired elsewhere, handle it in that flow.
    
    // Fetch locations (same as login flow)
    yield put(listLocationsAction.request());
    
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.response?.data?.error || 'Failed to link Google account';
    yield put(linkGoogleAction.failure({ message }));
  }
}

function* handleUnlinkGoogle(action: ReturnType<typeof unlinkGoogleAction.request>): Generator<any, void, any> {
  try {
    yield call(unlinkGoogleApi, action.payload);
    
    // Update user in Redux to remove Google data
    const currentUser: AuthUser = yield select((state: RootState) => state.auth.user);
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        googleSub: null,
        provider: currentUser.registeredVia === 'google' ? 'email' : currentUser.provider,
        providerData: null,
        lastGoogleLoginAt: null,
      };
      yield put(setAuthUserAction({ user: updatedUser }));
    }
    
    yield put(unlinkGoogleAction.success({ message: 'Google account unlinked successfully' }));
    
    // Show success message
    const { toast } = yield import('sonner');
    toast.success('Google account has been unlinked from your account.');
  } catch (error: any) {
    const message = getErrorMessage(error);
    yield put(unlinkGoogleAction.failure({ message }));
    
    // Show error message
    const { toast } = yield import('sonner');
    toast.error(message);
  }
}

function* handleLinkGoogleByCode(action: ReturnType<typeof linkGoogleByCodeAction.request>): Generator<any, void, any> {
  try {
    // Ensure we have an access token (redirect cleared Redux)
    const existingToken: string | null = yield select((s: RootState) => (s as any).auth.accessToken);
    if (!existingToken) {
      try {
        yield call(refreshSession);
      } catch {
        // continue; backend fallback might still succeed with refresh cookie
      }
    }

    const response: AuthResponse = yield call(linkGoogleByCodeApi, action.payload);
    // Update user in Redux + refresh token for native apps
    yield put(setTokensAction({ accessToken: response.accessToken, csrfToken: response.csrfToken ?? null, refreshToken: response.refreshToken ?? null }));
    
    // Persist refresh token to storage for native apps
    if (response.refreshToken) {
      yield call([tokenStorage, 'saveRefreshToken'], response.refreshToken);
    }
    
    yield put(setAuthUserAction({ user: response.user }));
    yield put(linkGoogleByCodeAction.success({ message: 'Google account linked', user: response.user, accessToken: response.accessToken, csrfToken: response.csrfToken ?? null }));
    
    // Defer toast to Settings page after redirect
    try {
      sessionStorage.setItem('postLinkToast', 'Google account linked to your profile');
      sessionStorage.setItem('postLinkToastType', 'success');
    } catch { /* empty */ }
    
    // Route back to the stored returnTo if present
    setTimeout(() => {
      try {
        const returnTo = sessionStorage.getItem('oauthReturnTo') || '/settings';
        sessionStorage.removeItem('oauthMode');
        sessionStorage.removeItem('oauthReturnTo');
        // Force immediate redirect
        window.location.href = returnTo;
      } catch (e) {
        console.error("Error handling OAuth redirect navigation:", e);
      }
    }, 100);
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to link Google account';
    yield put(linkGoogleByCodeAction.failure({ message }));
    // Defer toast to Settings page after redirect
    try {
      sessionStorage.setItem('postLinkToast', message);
      sessionStorage.setItem('postLinkToastType', 'error');
    } catch { /* empty */ }
    // Safety: if we're stuck on the callback route, bounce back to Settings so UI doesn't hang
    try {
      const returnTo = sessionStorage.getItem('oauthReturnTo') || '/settings';
      sessionStorage.removeItem('oauthMode');
      sessionStorage.removeItem('oauthReturnTo');
      window.location.replace(returnTo);
    } catch { /* empty */ }
  }
}

function* handleSelectBusiness(action: ReturnType<typeof selectBusinessAction.request>): Generator<any, void, any> {
  try {
    yield put(setAuthLoadingAction({ isLoading: true }));
    const response: AuthResponse = yield call(selectBusinessApi, action.payload);

    // Check for disabled or scheduled-for-deletion account on the selected business
    if (response.accountDisabled || response.accountScheduledForDeletion) {
      // Store tokens so we can call reactivate/cancel-delete APIs
      yield put(setTokensAction({ accessToken: response.accessToken, csrfToken: response.csrfToken ?? null, refreshToken: response.refreshToken ?? null }));
      if (response.refreshToken) {
        yield call([tokenStorage, 'saveRefreshToken'], response.refreshToken);
      }
      if (response.csrfToken) {
        yield put(setCsrfToken({ csrfToken: response.csrfToken }));
      }
      yield put(setAuthUserAction({ user: response.user }));

      // Clear the business selection modal so the prompt dialog can show
      yield put(dismissBusinessSelectorModal());

      // Show the account status prompt dialog instead of completing login
      yield put(showAccountStatusPromptAction({
        type: response.accountDisabled ? 'disabled' : 'scheduled_for_deletion',
      }));
      yield put(setAuthLoadingAction({ isLoading: false }));
      return;
    }

    // Store access token in Redux (memory) + optional CSRF token + refresh token for native apps
    yield put(setTokensAction({ accessToken: response.accessToken, csrfToken: response.csrfToken ?? null, refreshToken: response.refreshToken ?? null }));
    
    // Persist refresh token to storage for native apps
    if (response.refreshToken) {
      yield call([tokenStorage, 'saveRefreshToken'], response.refreshToken);
    }

    // Fetch locations post-login
    yield put(listLocationsAction.request());
    if (response.csrfToken) {
      yield put(setCsrfToken({ csrfToken: response.csrfToken }));
    }

    // Fetch fresh user data (with full entitlements) BEFORE setting user
    // During this async call, user remains null so AuthGate shows spinner
    // and SubscriptionGate returns null, preventing the flash
    let user = response.user;
    try {
      const freshUser: AuthUser = (yield call(getCurrentUserApi)) as AuthUser;
      user = freshUser;
    } catch {
      // Fall back to select-business response user data
    }

    yield put(setAuthUserAction({ user }));
    yield put(selectBusinessAction.success({
      accessToken: response.accessToken,
      csrfToken: response.csrfToken ?? null,
      user
    }));
  } catch (error: any) {
    const message = getErrorMessage(error);
    yield put(selectBusinessAction.failure({ message }));
  } finally {
    yield put(setAuthLoadingAction({ isLoading: false }));
  }
}

function* handleSendBusinessLinkEmail(action: ReturnType<typeof sendBusinessLinkEmailAction.request>): Generator<any, void, any> {
  try {
    const response: { message: string } = yield call(sendBusinessLinkEmailApi, action.payload);
    
    yield put(sendBusinessLinkEmailAction.success({ message: response.message }));

    // Show success toast
    try {
      const { toast } = yield import('sonner');
      toast.success('Email sent! Please check your inbox to complete the account linking.');
    } catch {}
  } catch (error: any) {
    const message = getErrorMessage(error);
    yield put(sendBusinessLinkEmailAction.failure({ message }));
  }
}

function* handleCheckTeamInvitation(action: ReturnType<typeof checkTeamInvitationAction.request>): Generator<any, void, any> {
  try {
    yield put(setAuthLoadingAction({ isLoading: true }));
    const response: any = yield call(checkTeamInvitationApi, action.payload.token);
    
    yield put(checkTeamInvitationAction.success(response));
    
    // Don't auto-login for 'accepted' status - user will be redirected to login page
    // If status is 'needs_registration', the UI will show the registration form
  } catch (error: any) {
    const message = getErrorMessage(error);
    yield put(checkTeamInvitationAction.failure({ message }));
  } finally {
    yield put(setAuthLoadingAction({ isLoading: false }));
  }
}

function* handleAcceptAccountStatusPrompt(): Generator<any, void, any> {
  try {
    yield put(setAuthLoadingAction({ isLoading: true }));

    const prompt: { type: 'disabled' | 'scheduled_for_deletion' } | null = yield select((s: RootState) => s.auth.accountStatusPrompt);
    if (!prompt) return;

    // Call the appropriate API (tokens are already in Redux)
    if (prompt.type === 'disabled') {
      yield call(reactivateAccountApi);
    } else {
      yield call(cancelAccountDeletionApi);
    }

    // Clear the prompt
    yield put(clearAccountStatusPromptAction());

    // Fetch latest user data (account status fields will now be cleared)
    yield put(fetchCurrentUserAction.request());
    yield put(listLocationsAction.request());

    const { toast } = yield import('sonner');
    toast.success(prompt.type === 'disabled' ? 'Account reactivated successfully!' : 'Account deletion cancelled!');
  } catch (error: any) {
    const message = getErrorMessage(error);
    const { toast } = yield import('sonner');
    toast.error(message || 'Failed to update account status. Please try again.');
  } finally {
    yield put(setAuthLoadingAction({ isLoading: false }));
  }
}

function* handleDeclineAccountStatusPrompt(): Generator<any, void, any> {
  try {
    // Call logout API to clear server-side session while tokens are still set
    yield call(logoutApi);
  } catch {
    // Ignore errors - we're clearing state anyway
  }
  // Clear stored refresh token
  yield call([tokenStorage, 'clearRefreshToken']);
  // Reset auth state completely (this clears tokens, user, and accountStatusPrompt)
  yield put(logoutRequestAction.success());

  // Clean up OAuth sessionStorage flags and redirect to login
  // (GoogleOAuthCallback has no effect to handle "unauthenticated + no error" after code was processed)
  try {
    sessionStorage.removeItem('oauthContext');
    sessionStorage.removeItem('oauthCodeProcessed');
    sessionStorage.removeItem('oauthRedirected');
  } catch { /* empty */ }
  window.location.replace('/login');
}

function* handleCompleteTeamInvitation(action: ReturnType<typeof completeTeamInvitationAction.request>): Generator<any, void, any> {
  try {
    yield put(setMemberRegistrationLoadingAction({ isLoading: true }));
    const response: any = yield call(completeTeamInvitationApi, action.payload);

    // Don't auto-login - just mark as completed
    // User will be redirected to login page with success message
    yield put(completeTeamInvitationAction.success(response));
  } catch (error: any) {
    const message = getErrorMessage(error);
    yield put(completeTeamInvitationAction.failure({ message }));
  } finally {
    yield put(setMemberRegistrationLoadingAction({ isLoading: false }));
  }
}
