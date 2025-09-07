import { takeLatest, call, put } from "redux-saga/effects";
import { wizardCompleteAction } from "./actions";
import { completeWizardApi } from "./api";
import { fetchCurrentUserAction } from "../auth/actions";

// function* handleWizardSave(action: { type: string; payload: any }) {
//   try {
//     yield call(saveWizardProgress, action.payload || {});
//     yield put(wizardSaveAction.success());
//   } catch (error: any) {
//     yield put(wizardSaveAction.failure({ message: error?.message || 'Failed to save progress' }));
//   }
// }

function* handleWizardComplete(action: { type: string; payload: any }) {
  try {
    yield call(completeWizardApi, action.payload || {});
    yield put(wizardCompleteAction.success());
    yield put(fetchCurrentUserAction.request());
  } catch (error: any) {
    yield put(wizardCompleteAction.failure({ message: error?.message || 'Failed to complete wizard' }));
  }
}

export function* setupWizardSaga() {
  // yield takeLatest(wizardSaveAction.request, handleWizardSave);
  yield takeLatest(wizardCompleteAction.request, handleWizardComplete);
}
