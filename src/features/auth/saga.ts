import { takeLatest, call } from "redux-saga/effects";
import { loginAction } from "./actions";
import { loginRequest } from "./api";


function* handleLogin(action: ReturnType<typeof loginAction>) {
    const response: {data: any} = yield call(loginRequest);

    console.log(response)
}

export function* authSaga() {
    yield takeLatest(loginAction.type, handleLogin);
}