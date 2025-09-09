import { getType } from "typesafe-actions";
import type { WizardData } from "../../shared/hooks/useSetupWizard";
import { defaultWorkingHours } from "../locations/constants";
import { wizardSaveAction, wizardCompleteAction, wizardLoadDraftAction } from "./actions";

type WizardState = {
  currentStep: number;
  totalSteps: number;
  data: WizardData;
  isLoading: boolean;
  error: string | null;
};

const initialState: WizardState = {
  currentStep: 1,
  totalSteps: 7,
  data: {
    businessInfo: {
      name: '',
      industry: '',
      description: '',
      email: '',
      phone: '',
      timezone: '',
      country: '',
      currency: '',
      instagramUrl: '',
      facebookUrl: '',
    },
    location: {
      isRemote: false,
      name: '',
      description: '',
      phone: '',
      email: '',
      address: '',
      timezone: '',
      workingHours: defaultWorkingHours,
    },
    teamMembers: [],
    worksSolo: true,
  },
  isLoading: false,
  error: null,
};

export default function setupWizardReducer(state: WizardState = initialState, action: any) {
  switch (action.type) {
    case wizardSaveAction.request:
    case wizardCompleteAction.request: {
      return { ...state, isLoading: true, error: null };
    }
    case getType(wizardLoadDraftAction.request): {
      return { ...state, isLoading: true, error: null };
    }
    case getType(wizardSaveAction.success):
    case wizardCompleteAction.success: {
      return { ...state, isLoading: false };
    }
    case getType(wizardLoadDraftAction.success): {
      return { ...state, isLoading: false, data: action.payload };
    }
    case getType(wizardSaveAction.failure):
    case wizardCompleteAction.failure: {
      return { ...state, isLoading: false, error: action.payload?.message };
    }
    case getType(wizardLoadDraftAction.failure): {
      return { ...state, isLoading: false, error: action.payload?.message };
    }
    default:
      return state;
  }
}


