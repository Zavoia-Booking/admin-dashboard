import { takeLatest, call, put } from "redux-saga/effects";
import { wizardCompleteAction, wizardSaveAction, wizardLoadDraftAction } from "./actions";
import { completeWizardApi, saveWizardDraftApi, getWizardDraftApi, type CompleteWizardResponse } from "./api";
import { fetchCurrentUserAction, setTokensAction, setCsrfToken } from "../auth/actions";
import { listLocationsAction } from "../locations/actions";
import { fetchCurrentBusinessAction } from "../business/actions";
import { prepareWizardDataForSubmission } from "./utils";

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
    const payload = prepareWizardDataForSubmission(action.payload || {});
    
    const response: CompleteWizardResponse = yield call(completeWizardApi, payload);
    
    // Update tokens with the new JWT that includes businessId
    yield put(setTokensAction({ 
      accessToken: response.accessToken, 
      csrfToken: response.csrfToken ?? null 
    }));
    
    if (response.csrfToken) {
      yield put(setCsrfToken({ csrfToken: response.csrfToken }));
    }
    
    yield put(wizardCompleteAction.success());
    
    // Fetch updated user data (should now have wizardCompleted: true and businessId)
    yield put(fetchCurrentUserAction.request());
    
    // Fetch locations for the newly created business
    yield put(listLocationsAction.request());
    yield put(fetchCurrentBusinessAction.request());
  } catch (error: any) {
    // Map backend messages robustly (string | array | nested)
    const raw = error?.response?.data?.message ?? error?.message;
    const message = Array.isArray(raw)
      ? raw.filter(Boolean).join('\n')
      : (raw || 'Something went wrong, please try again');
    yield put(wizardCompleteAction.failure({ message }));
  }
}

function* loadDraftData() {
  try {
    const { wizardData } = yield call(getWizardDraftApi);
    if (!wizardData || Object.keys(wizardData).length === 0) {
      // No draft yet: still clear loading state so the wizard renders step 1
      yield put(wizardLoadDraftAction.success({}));
    } else {
      yield put(wizardLoadDraftAction.success(wizardData));
    }
  } catch (error: any) {
    yield put(wizardLoadDraftAction.failure({ message: error?.message || 'Failed to load draft' }));
  }
}

export function* setupWizardSaga() {
  yield takeLatest(wizardSaveAction.request, handleWizardSave);
  yield takeLatest(wizardCompleteAction.request, handleWizardComplete);
  yield takeLatest(wizardLoadDraftAction.request, loadDraftData);
}
