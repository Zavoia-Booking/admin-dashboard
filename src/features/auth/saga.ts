import { takeLatest, call, put } from "redux-saga/effects";
import { registerOwnerRequest } from "./api";
import { registerOwnerRequest as registerOwner, registerOwnerSuccess, registerOwnerFailure, setAuthLoadingAction, setAuthUser } from "./actions";
import type { RegisterOwnerPayload, AuthResponse } from "./types";

function persistTokens(tokens: { access_token: string; refresh_token: string }) {
    try {
        localStorage.setItem('access_token', tokens.access_token);
        localStorage.setItem('refresh_token', tokens.refresh_token);
    } catch {}
}

function* handleRegisterOwner(action: ReturnType<typeof registerOwner>) {
    try {
        yield put(setAuthLoadingAction(true));
        const payload: RegisterOwnerPayload = action.payload;
        const response: AuthResponse = yield call(registerOwnerRequest, payload);
        persistTokens({ access_token: response.access_token, refresh_token: response.refresh_token });
        yield put(registerOwnerSuccess(response));
        yield put(setAuthUser(response.user));
    } catch (error: any) {
        const message = error?.message || 'Registration failed';
        yield put(registerOwnerFailure(message));
    } finally {
        yield put(setAuthLoadingAction(false));
    }
}

export function* authSaga() {
    yield takeLatest(registerOwner.type, handleRegisterOwner);
}