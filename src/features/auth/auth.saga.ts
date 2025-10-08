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
  registerMemberAction,
  googleAuthAction,
  openAccountLinkingModal
} from "./actions";
import { logoutApi, registerOwnerRequestApi, loginApi, getCurrentUserApi, forgotPasswordApi, resetPasswordApi, registerMemberApi, googleAuthApi, reauthForLinkApi, linkGoogleApi, unlinkGoogleApi, linkGoogleByCodeApi } from "./api";
import type { RegisterOwnerPayload, AuthResponse, AuthUser } from "./types";
import { reauthForLinkAction, linkGoogleAction, closeAccountLinkingModal, unlinkGoogleAction, linkGoogleByCodeAction } from "./actions";
import { listLocationsAction } from "../locations/actions";
import { select } from "redux-saga/effects";
import type { RootState } from "../../app/providers/store";
import { refreshSession } from "../../shared/lib/http";

function* handleRegisterOwnerRequest(action: { type: string; payload: RegisterOwnerPayload }): Generator<any, void, any> {
  try {
    yield put(setAuthLoadingAction({ isLoading: true }));
    const response: AuthResponse = (yield call(registerOwnerRequestApi, action.payload)) as AuthResponse;

    // Store access token in Redux (memory) + optional CSRF token
    yield put(setTokensAction({ accessToken: response.accessToken, csrfToken: response.csrfToken ?? null }));
    if (response.csrfToken) {
        yield put(setCsrfToken({ csrfToken: response.csrfToken }));
    }

    // Store user
    yield put(setAuthUserAction({ user: response.user }));
    yield put(registerOwnerRequestAction.success({ user: response.user }));
  } catch (error: any) {
    let message = "Registration failed";
    
    if (error?.response?.data?.message) {
      // Handle array of messages or single message
      const backendMessage = error.response.data.message;
      message = Array.isArray(backendMessage) ? backendMessage[0] : backendMessage;
    } else if (error?.response?.data?.error) {
      message = error.response.data.error;
    } else if (error?.message) {
      message = error.message;
    }
    
    yield put(registerOwnerRequestAction.failure({ message }));
  } finally {
    yield put(setAuthLoadingAction({ isLoading: false }));
  }
}

function* handleLogout(): Generator<any, void, any> {
  try {
    yield call(logoutApi);

    yield put(logoutRequestAction.success());
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Logout failed";
    yield put(logoutRequestAction.failure(message));
  }
}

function* handleLogin(action: { type: string; payload: { email: string, password: string } }): Generator<any, void, any> {
  try {
    yield put(setAuthLoadingAction({ isLoading: true }));
    const response: AuthResponse = (yield call(loginApi, action.payload)) as AuthResponse;

    // Store access token in Redux (memory) + optional CSRF token
    yield put(setTokensAction({ accessToken: response.accessToken, csrfToken: response.csrfToken ?? null }));

    // Fetch locations post-login only if user has a business
    const hasBusinessLogin = Boolean(response.user?.businessId || (response.user as any)?.business?.id);
    if (hasBusinessLogin) {
      yield put(listLocationsAction.request());
    }
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

    // Toast success (lazy import to avoid bundle weight on cold paths)
    try {
      const { toast } = yield import('sonner');
      toast.success('Welcome back!');
    } catch {}

  } catch (error: any) {
    let message = "Login failed";
    
    if (error?.response?.data?.message) {
      // Handle array of messages or single message
      const backendMessage = error.response.data.message;
      message = Array.isArray(backendMessage) ? backendMessage[0] : backendMessage;
    } else if (error?.response?.data?.error) {
      message = error.response.data.error;
    } else if (error?.message) {
      message = error.message;
    }
    
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
    takeLatest(registerMemberAction.request, handleRegisterMember),
    takeLatest(googleAuthAction.request, handleGoogleAuth),
    takeLatest(reauthForLinkAction.request, handleReauthForLink),
    takeLatest(linkGoogleAction.request, handleLinkGoogle),
    takeLatest(linkGoogleByCodeAction.request, handleLinkGoogleByCode),
    takeLatest(unlinkGoogleAction.request, handleUnlinkGoogle),
  ]);
}

function* handleFetchCurrentUser(): Generator<any, void, any> {
  try {
    const user : AuthUser = (yield call(getCurrentUserApi)) as any;
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
    const message = error?.response?.data?.error || error?.message || "Reset password failed";
    yield put(resetPasswordAction.failure(message));
  }
}

function* handleRegisterMember(action: ReturnType<typeof registerMemberAction.request>) {
  try {
    yield call(registerMemberApi, action.payload);
    window.location.href = "/login";
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || 'Failed to register member';
    yield put(registerMemberAction.failure({ message }));
  }
}

function* handleGoogleAuth(action: ReturnType<typeof googleAuthAction.request>) {
  try {
    yield put(setAuthLoadingAction({ isLoading: true }));
    const response: AuthResponse = yield call(googleAuthApi, action.payload);

    // Store access token in Redux (memory) + optional CSRF token
    yield put(setTokensAction({ accessToken: response.accessToken, csrfToken: response.csrfToken ?? null }));
    
    // Fetch locations post-authentication only if user has a business
    const hasBusinessGoogle = Boolean(response.user?.businessId || (response.user as any)?.business?.id);
    if (hasBusinessGoogle) {
      yield put(listLocationsAction.request());
    }
    if (response.csrfToken) {
      yield put(setCsrfToken({ csrfToken: response.csrfToken }));
    }

    // Store user
    yield put(setAuthUserAction({ user: response.user }));
    yield put(googleAuthAction.success({ 
      accessToken: response.accessToken, 
      csrfToken: response.csrfToken ?? null, 
      user: response.user 
    }));

    // Ensure latest user data (including Google linkage fields) after login
    yield put(fetchCurrentUserAction.request());

    // Let the useEffect in register form handle the redirect when isAuthenticated becomes true

  } catch (error: any) {
    let message = "Google authentication failed";
    const code = error?.response?.data?.code;
    const details = error?.response?.data?.details;
    
    if (error?.response?.data?.message) {
      // Handle array of messages or single message
      const backendMessage = error.response.data.message;
      message = Array.isArray(backendMessage) ? backendMessage[0] : backendMessage;
    } else if (error?.response?.data?.error) {
      message = error.response.data.error;
    } else if (error?.message) {
      message = error.message;
    }
    
    if (code === 'account_exists_unlinked_google') {
      try { sessionStorage.setItem('linkContext', 'register'); } catch { /* empty */ }
      yield put(openAccountLinkingModal({ suggestedNext: details?.suggestedNext, txId: details?.tx_id }));
      return;
    }

    yield put(googleAuthAction.failure({ message }));
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
    
    // Store authentication tokens (auto-login)
    yield put(setTokensAction({ accessToken: response.accessToken, csrfToken: response.csrfToken ?? null }));
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
    const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to unlink Google account';
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
    // Update user in Redux
    yield put(setTokensAction({ accessToken: response.accessToken, csrfToken: response.csrfToken ?? null }));
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
