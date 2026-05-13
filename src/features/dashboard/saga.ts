import { takeLatest, call, put } from "redux-saga/effects";
import type { ActionType } from "typesafe-actions";
import {
  fetchDashboardDataAction,
  type DashboardApiResponse,
} from "./actions";
import { fetchDashboardData } from "./api";
import { getErrorMessage } from "../../shared/utils/error";

function* handleFetchDashboardData(
  action: ActionType<typeof fetchDashboardDataAction.request>
): Generator<any, void, DashboardApiResponse> {
  try {
    const data = yield call(fetchDashboardData, action.payload.locationId);
    yield put(fetchDashboardDataAction.success(data));
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    yield put(fetchDashboardDataAction.failure({ message }));
  }
}

export function* dashboardSaga() {
  yield takeLatest(fetchDashboardDataAction.request, handleFetchDashboardData);
}
