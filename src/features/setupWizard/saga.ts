import { takeLatest, call, put, select } from "redux-saga/effects";
import { wizardCompleteAction, wizardSaveAction, wizardLoadDraftAction, clearLogoBufferAction } from "./actions";
import { completeWizardApi, saveWizardDraftApi, getWizardDraftApi, type CompleteWizardResponse } from "./api";
import { fetchCurrentUserAction, setTokensAction, setCsrfToken } from "../auth/actions";
import { fetchCurrentBusinessAction } from "../business/actions";
import { prepareWizardDataForSubmission } from "./utils";
import { apiClient } from "../../shared/lib/http";
import type { RootState } from "../../app/providers/store";
import type { WizardData } from "../../shared/hooks/useSetupWizard";

// Helper function to upload logo file to R2
function* uploadLogoIfNeeded(wizardData: Partial<WizardData>) {
  const logo = wizardData?.businessInfo?.logo;
  
  // Case 1: Logo is explicitly null - user wants to remove it
  if (logo === null) {
    // If there was a previous logo, we could optionally delete it from R2 here
    // For now, just ensure logo and logoKey are null
    return {
      ...wizardData,
      businessInfo: {
        ...wizardData.businessInfo,
        logo: null,
        logoKey: null,
      }
    };
  }
  
  // Case 2: Logo is a File object - needs upload
  if (logo instanceof File) {
    try {
      const formData = new FormData();
      formData.append('file', logo);
      
      const response: { data: { success: boolean; logo: string; logoKey: string } } = yield call(
        [apiClient(), 'post'],
        '/wizard/upload-logo',
        formData
      );
      
      // Update wizardData with the uploaded logo URL and key
      return {
        ...wizardData,
        businessInfo: {
          ...wizardData.businessInfo,
          logo: response.data.logo,
          logoKey: response.data.logoKey,
        }
      };
    } catch (error) {
      console.error('Failed to upload logo:', error);
      // Continue without logo rather than failing the entire wizard
      return {
        ...wizardData,
        businessInfo: {
          ...wizardData.businessInfo,
          logo: null,
          logoKey: null,
        }
      };
    }
  }
  
  // Case 3: Logo is already a URL string or undefined - return as is
  return wizardData;
}

function* handleWizardSave(action: { type: string; payload: any }) {
  try {
    // Get logo file buffer from Redux state
    const logoFileBuffer: File | null = yield select((state: RootState) => state.setupWizard.logoFileBuffer);
    
    // Merge the logo buffer with the payload
    let dataToSave = { ...action.payload };
    if (logoFileBuffer) {
      dataToSave = {
        ...dataToSave,
        businessInfo: {
          ...dataToSave.businessInfo,
          logo: logoFileBuffer,
        }
      };
    } else if (dataToSave?.businessInfo?.logo === null) {
      // Logo was explicitly cleared
      dataToSave = {
        ...dataToSave,
        businessInfo: {
          ...dataToSave.businessInfo,
          logo: null,
          logoKey: null,
        }
      };
    }
    
    // Upload logo if it's a File object
    const dataWithUploadedLogo: Partial<WizardData> = yield call(uploadLogoIfNeeded, dataToSave);
    
    yield call(saveWizardDraftApi, dataWithUploadedLogo);
    yield put(wizardSaveAction.success());
    
    // Clear logo buffer after successful save
    if (logoFileBuffer) {
      yield put(clearLogoBufferAction());
    }
  } catch (error: any) {
    yield put(wizardSaveAction.failure({ message: error?.message || 'Failed to save progress' }));
  }
}

function* handleWizardComplete(action: { type: string; payload: any }) {
  try {
    // Get logo file buffer from Redux state
    const logoFileBuffer: File | null = yield select((state: RootState) => state.setupWizard.logoFileBuffer);
    
    // Merge the logo buffer with the payload
    let dataToComplete = { ...action.payload };
    if (logoFileBuffer) {
      dataToComplete = {
        ...dataToComplete,
        businessInfo: {
          ...dataToComplete.businessInfo,
          logo: logoFileBuffer,
        }
      };
    } else if (dataToComplete?.businessInfo?.logo === null) {
      // Logo was explicitly cleared
      dataToComplete = {
        ...dataToComplete,
        businessInfo: {
          ...dataToComplete.businessInfo,
          logo: null,
          logoKey: null,
        }
      };
    }
    
    // Upload logo if it's a File object
    const dataWithUploadedLogo: WizardData = yield call(uploadLogoIfNeeded, dataToComplete);
    
    const payload = prepareWizardDataForSubmission(dataWithUploadedLogo);
    
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
    
    // Clear logo buffer after successful completion
    if (logoFileBuffer) {
      yield put(clearLogoBufferAction());
    }
    
    // Fetch updated user data (should now have wizardCompleted: true and businessId)
    yield put(fetchCurrentUserAction.request());
    
    // Fetch locations for the newly created business
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
