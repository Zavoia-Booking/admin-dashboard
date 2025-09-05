import { takeLatest, call, put, all } from "redux-saga/effects";
import {
  registerOwnerRequestAction,
  setAuthLoadingAction,
  setAuthUserAction,
  setTokensAction,
  setCsrfToken,
  logoutRequestAction,
  loginAction,
} from "./actions";
import { logoutApi, registerOwnerRequestApi, loginApi } from "./api";
import type { RegisterOwnerPayload, AuthResponse } from "./types";

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
  ]);
}
