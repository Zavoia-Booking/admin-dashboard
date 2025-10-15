import { takeLatest, call, put } from "redux-saga/effects";
import { wizardCompleteAction, wizardSaveAction, wizardLoadDraftAction } from "./actions";
import { completeWizardApi, saveWizardDraftApi, getWizardDraftApi } from "./api";
import { fetchCurrentUserAction } from "../auth/actions";
import { listLocationsAction } from "../locations/actions";

function* handleWizardSave(action: { type: string; payload: any }) {
  try {
    yield call(saveWizardDraftApi, action.payload || {});
    yield put(wizardSaveAction.success());
  } catch (error: any) {
    yield put(wizardSaveAction.failure({ message: error?.message || 'Failed to save progress' }));
  }
}

function* handleWizardComplete(action: { type: string; payload: any }) {
  try {
    yield call(completeWizardApi, action.payload || {});
    yield put(wizardCompleteAction.success());
    yield put(fetchCurrentUserAction.request());
    yield put(listLocationsAction.request());
  } catch (error: any) {
    yield put(wizardCompleteAction.failure({ message: error?.message || 'Failed to complete wizard' }));
  }
}

function* loadDraftData() {
  try {
    const { wizardData } = yield call(getWizardDraftApi);
    if (!wizardData || Object.keys(wizardData).length === 0) {
      return;
    }
    yield put(wizardLoadDraftAction.success(wizardData));
  } catch (error: any) {
    yield put(wizardLoadDraftAction.failure({ message: error?.message || 'Failed to load draft' }));
  }
}

export function* setupWizardSaga() {
  yield takeLatest(wizardSaveAction.request, handleWizardSave);
  yield takeLatest(wizardCompleteAction.request, handleWizardComplete);
  yield takeLatest(wizardLoadDraftAction.request, loadDraftData);
}
