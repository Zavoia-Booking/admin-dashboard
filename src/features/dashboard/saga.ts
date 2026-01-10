import { takeLatest, call, put } from "redux-saga/effects";
import { wizardSaveRequest, wizardSaveSuccess, wizardSaveFailure, wizardCompleteRequest, wizardCompleteSuccess, wizardCompleteFailure } from "./actions";
import { saveWizardProgress, completeWizard } from "./api";

function* handleWizardSave() {
  try {
    yield call(saveWizardProgress, {});
    yield put(wizardSaveSuccess());
  } catch (error: any) {
    yield put(wizardSaveFailure(error?.message || 'Failed to save progress'));
  }
}

function* handleWizardComplete() {
  try {
    yield call(completeWizard, {});
    yield put(wizardCompleteSuccess());
  } catch (error: any) {
    yield put(wizardCompleteFailure(error?.message || 'Failed to complete wizard'));
  }
}

export function* setupWizardSaga() {
  yield takeLatest(wizardSaveRequest.type, handleWizardSave);
  yield takeLatest(wizardCompleteRequest.type, handleWizardComplete);
}


