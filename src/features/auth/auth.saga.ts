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
  registerMemberAction
} from "./actions";
import { logoutApi, registerOwnerRequestApi, loginApi, getCurrentUserApi, forgotPasswordApi, resetPasswordApi, registerMemberApi } from "./api";
import type { RegisterOwnerPayload, AuthResponse, AuthUser } from "./types";
import { listLocationsAction } from "../locations/actions";

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
  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Registration failed";
    yield put(registerOwnerRequestAction.failure(message));
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

    // Fetch locations post-login
    yield put(listLocationsAction.request());
    if (response.csrfToken) {
      yield put(setCsrfToken({ csrfToken: response.csrfToken }));
    }

    // Store user
    yield put(setAuthUserAction({ user: response.user }));

  } catch (error: any) {
    const message = error?.response?.data?.error || error?.message || "Login failed";
    yield put(loginAction.failure(message));
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
