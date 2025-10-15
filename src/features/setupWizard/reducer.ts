import { getType } from "typesafe-actions";
import type { WizardData } from "../../shared/hooks/useSetupWizard";
import { defaultWorkingHours } from "../locations/constants";
import { wizardSaveAction, wizardCompleteAction, wizardLoadDraftAction, wizardUpdateDataAction } from "./actions";

type WizardState = {
  currentStep: number;
  totalSteps: number;
  data: WizardData;
  isLoading: boolean;
  error: string | null;
};

const initialState: WizardState = {
  currentStep: 1,
  totalSteps: 4,
  data: {
    businessInfo: {
      name: '',
      industryId: 0,
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
      isActive: true,
    },
    teamMembers: [],
    worksSolo: true,
    currentStep: 1,
  },
  isLoading: false,
  error: null,
};

export default function setupWizardReducer(state: WizardState = initialState, action: any) {
  switch (action.type) {
    case getType(wizardSaveAction.request):
    case getType(wizardCompleteAction.request): {
      return { ...state, isLoading: true, error: null };
    }
    case getType(wizardLoadDraftAction.request): {
      return { ...state, isLoading: true, error: null };
    }
    case getType(wizardSaveAction.success):
    case getType(wizardCompleteAction.success): {
      return { ...state, isLoading: false };
    }
    case getType(wizardLoadDraftAction.success): {
      const payload = action.payload as Partial<WizardData>;
      
      return {
        ...state,
        isLoading: false,
        data: {
          ...state.data,
          ...payload,
          businessInfo: {
            ...state.data.businessInfo,
            ...(payload.businessInfo || {} as any),
          },
          location: {
            ...state.data.location,
            ...(payload.location || {} as any),
          },
          teamMembers: payload.teamMembers ?? state.data.teamMembers,
        },
      };
    }
    case getType(wizardSaveAction.failure):
    case getType(wizardCompleteAction.failure): {
      return { ...state, isLoading: false, error: action.payload?.message };
    }
    case getType(wizardLoadDraftAction.failure): {
      return { ...state, isLoading: false, error: action.payload?.message };
    }
    case getType(wizardUpdateDataAction): {
      const payload = action.payload as Partial<WizardData>;
      return {
        ...state,
        data: {
          ...state.data,
          ...payload,
          businessInfo: {
            ...state.data.businessInfo,
            ...(payload.businessInfo || {}),
          },
          location: {
            ...state.data.location,
            ...(payload.location || {}),
          },
          teamMembers: payload.teamMembers ?? state.data.teamMembers,
        },
      };
    }
    default:
      return state;
  }
}


