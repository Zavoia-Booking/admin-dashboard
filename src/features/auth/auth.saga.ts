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
} from "./actions";
import { logoutApi, registerOwnerRequestApi, loginApi, getCurrentUserApi, forgotPasswordApi, resetPasswordApi, googleLoginApi, googleRegisterApi, googleNativeLoginApi, googleNativeRegisterApi, reauthForLinkApi, linkGoogleApi, unlinkGoogleApi, linkGoogleByCodeApi, selectBusinessApi, sendBusinessLinkEmailApi, checkTeamInvitationApi, completeTeamInvitationApi } from "./api";
import type { RegisterOwnerPayload, AuthResponse, AuthUser, GoogleNativeRegisterResponse } from "./types";
import { reauthForLinkAction, linkGoogleAction, closeAccountLinkingModal, unlinkGoogleAction, linkGoogleByCodeAction, googleNativeEmailSentAction } from "./actions";
import { listLocationsAction } from "../locations/actions";
import { select } from "redux-saga/effects";
import type { RootState } from "../../app/providers/store";
import { refreshSession } from "../../shared/lib/http";
import { tokenStorage } from "../../shared/lib/tokenStorage";
import { getErrorMessage, isMessageCode } from "../../shared/utils/error";
import i18n from "../../shared/lib/i18n";

// Machine-readable code for a failed auth call: explicit `code` field first,
// otherwise a bare message code (e.g. "AUTH.E12") sent in the message field.
function getErrorCode(error: any): string | undefined {
  const data = error?.response?.data;
  if (typeof data?.code === 'string' && data.code) return data.code;
  const msg = Array.isArray(data?.message) ? data.message[0] : data?.message;
  return typeof msg === 'string' && isMessageCode(msg) ? msg : undefined;
}

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
    
    const message = getErrorMessage(error) || i18n.t('auth:page.errors.logoutFailed');
    yield put(logoutRequestAction.failure({ message }));
  }
}

function* handleLogin(action: { type: string; payload: { email: string, password: string } }): Generator<any, void, any> {
  try {
    yield put(setAuthLoadingAction({ isLoading: true }));
    const response: AuthResponse = (yield call(loginApi, action.payload)) as AuthResponse;

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
  ]);
}

function* handleFetchCurrentUser(): Generator<any, void, any> {
  try {
    const user: AuthUser = (yield call(getCurrentUserApi)) as any;
    yield put(setAuthUserAction({ user }));
  } catch (error: any) {
    const message = getErrorMessage(error) || i18n.t('auth:page.errors.fetchCurrentUserFailed');
    yield put(fetchCurrentUserAction.failure({ message }));
  }
}

function* handleForgotPassword(action: { type: string; payload: { email: string } }) {
  try {
    yield call(forgotPasswordApi, action.payload);
  } catch (error: any) {
    const message = getErrorMessage(error) || i18n.t('auth:page.errors.forgotPasswordFailed');
    yield put(forgotPasswordAction.failure({ message }));
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
    // Web sends an OAuth code; native (Capacitor) sends an ID token from the
    // on-device account picker.
    const response: AuthResponse = 'idToken' in action.payload
      ? yield call(googleNativeLoginApi, action.payload)
      : yield call(googleLoginApi, action.payload);

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
    // so write-affordance gating is correct on first render after redirect.
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
      yield put(openAccountLinkingModal({ suggestedNext: details?.suggestedNext, txId: details?.tx_id, email: details?.email }));
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

    // No account for this Google identity — the login form shows its
    // "register first" banner for this exact message.
    if (statusCode === 404 && code === 'account_not_found') {
      yield put(googleLoginAction.failure({ message: 'account_not_found' }));
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
    // Web sends an OAuth code (account is created right away); native sends an
    // ID token and may resolve to the "continue on web" email funnel instead
    // of a session.
    const nativeFlow = 'idToken' in action.payload;
    const rawResponse: GoogleNativeRegisterResponse = nativeFlow
      ? yield call(googleNativeRegisterApi, action.payload as { idToken: string })
      : yield call(googleRegisterApi, action.payload as { code: string; redirectUri: string });

    if ('outcome' in rawResponse && rawResponse.outcome === 'email_sent') {
      yield put(googleNativeEmailSentAction({ email: rawResponse.email }));
      return;
    }

    const response = rawResponse as AuthResponse;

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
    // so write-affordance gating is correct on first render after redirect.
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
      yield put(openAccountLinkingModal({ suggestedNext: details?.suggestedNext, txId: details?.tx_id, email: details?.email }));
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
      // Keep the modal open: it renders the error and Cancel handles the
      // navigation back to login/register. Closing it here would strand the
      // user on the /auth/callback spinner.
      yield put(reauthForLinkAction.failure({ message: i18n.t('auth:page.errors.linkSessionExpired'), code: 'SYSTEM.E08' }));
      return;
    }

    const res: { proof: string } = yield call(reauthForLinkApi, { ...action.payload, tx_id: txId });
    yield put(reauthForLinkAction.success({ proof: res.proof }));
    yield put(linkGoogleAction.request({ tx_id: txId, proof: res.proof }));
  } catch (error: any) {
    const message = getErrorMessage(error) || i18n.t('auth:page.errors.verificationFailed');
    yield put(reauthForLinkAction.failure({ message, code: getErrorCode(error) }));
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
    yield put(linkGoogleAction.success({ message: i18n.t('auth:page.toasts.googleLinkedSuccess') }));
    yield put(closeAccountLinkingModal());

    // Determine context; for register flow we stay on wizard (handled elsewhere)
    const { toast } = yield import('sonner');
    toast.success(i18n.t('auth:page.toasts.googleLinked'));
    
    // Clear context marker
    try { sessionStorage.removeItem('linkContext'); } catch { /* empty */ }
    
    // For register flow: do not redirect. For other contexts we also avoid forced redirect here.
    // If a redirect is desired elsewhere, handle it in that flow.
    
    // Fetch locations (same as login flow)
    yield put(listLocationsAction.request());
    
  } catch (error: any) {
    const message = getErrorMessage(error) || i18n.t('auth:page.errors.googleLinkFailed');
    yield put(linkGoogleAction.failure({ message, code: getErrorCode(error) }));
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
    
    yield put(unlinkGoogleAction.success({ message: i18n.t('auth:page.toasts.googleUnlinkedSuccess') }));

    // Show success message
    const { toast } = yield import('sonner');
    toast.success(i18n.t('auth:page.toasts.googleUnlinked'));
  } catch (error: any) {
    const rawMessage = error?.response?.data?.message;
    const code = typeof rawMessage === 'string' && /^[A-Z_]+\.[A-Z]\d{2}$/.test(rawMessage)
      ? rawMessage
      : undefined;
    const message = getErrorMessage(error);
    yield put(unlinkGoogleAction.failure({ message, code }));

    // Suppress global toast when the dialog already renders the "set a password first" branch.
    if (code !== 'AUTH.E11') {
      const { toast } = yield import('sonner');
      toast.error(message);
    }
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
    yield put(linkGoogleByCodeAction.success({ message: i18n.t('auth:page.toasts.googleLinkedShort'), user: response.user, accessToken: response.accessToken, csrfToken: response.csrfToken ?? null }));

    // Defer toast to Settings page after redirect
    try {
      sessionStorage.setItem('postLinkToast', i18n.t('auth:page.toasts.googleLinkedToProfile'));
      sessionStorage.setItem('postLinkToastType', 'success');
    } catch { /* empty */ }
    
    // Route back to the stored returnTo if present
    setTimeout(() => {
      try {
        const returnTo = sessionStorage.getItem('oauthReturnTo') || '/account';
        sessionStorage.removeItem('oauthMode');
        sessionStorage.removeItem('oauthReturnTo');
        // Force immediate redirect
        window.location.href = returnTo;
      } catch (e) {
        console.error("Error handling OAuth redirect navigation:", e);
      }
    }, 100);
  } catch (error: any) {
    const message = getErrorMessage(error) || i18n.t('auth:page.errors.googleLinkFailed');
    yield put(linkGoogleByCodeAction.failure({ message }));
    // Defer toast to Settings page after redirect
    try {
      sessionStorage.setItem('postLinkToast', message);
      sessionStorage.setItem('postLinkToastType', 'error');
    } catch { /* empty */ }
    // Safety: if we're stuck on the callback route, bounce back to Settings so UI doesn't hang
    try {
      const returnTo = sessionStorage.getItem('oauthReturnTo') || '/account';
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

    // Fetch fresh user data (with full entitlements) BEFORE setting user.
    // During this async call, user remains null so AuthGate shows spinner
    // and write-affordance gating has the correct value on first render.
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
      toast.success(i18n.t('auth:page.toasts.emailLinkSent'));
    } catch {}
  } catch (error: any) {
    const status = error?.response?.status;
    const code = error?.response?.data?.code;

    // A valid link is already in the user's inbox (backend throttles resends).
    // For the user this is the same outcome as sending one - close the modal
    // and point them at their inbox instead of surfacing a raw error code.
    if (status === 429 && code === 'token_already_sent') {
      yield put(sendBusinessLinkEmailAction.success({ message: code }));
      try {
        const { toast } = yield import('sonner');
        toast.info(i18n.t('auth:page.toasts.emailLinkAlreadySent'));
      } catch {}
      return;
    }

    // Backend failures arrive as bare message codes (e.g. "AUTH.S14",
    // "SYSTEM.E01") which downstream toasts show verbatim - replace them
    // with a friendly generic message. Machine-readable snake_case codes
    // (e.g. "account_not_found") are left intact for flow logic.
    const raw = getErrorMessage(error);
    const isBareMessageCode = /^[A-Z_]+\.[A-Z]\d+$/.test(raw ?? '');
    const message = isBareMessageCode ? i18n.t('auth:page.errors.emailLinkSendFailed') : raw;
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
