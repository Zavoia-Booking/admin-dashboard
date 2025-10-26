import { getType } from "typesafe-actions";
import type { WizardData } from "../../shared/hooks/useSetupWizard";
import { defaultWorkingHours } from "../locations/constants";
import { wizardSaveAction, wizardCompleteAction, wizardLoadDraftAction, wizardUpdateDataAction } from "./actions";
import { loginAction, logoutRequestAction, registerOwnerRequestAction } from "../auth/actions";

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
      name: undefined as unknown as string,
      industryId: undefined as unknown as number,
      description: undefined as unknown as string,
      email: undefined as unknown as string,
      phone: undefined as unknown as string,
      timezone: undefined as unknown as string,
      country: undefined as unknown as string,
      currency: undefined as unknown as string,
      instagramUrl: undefined as unknown as string,
      facebookUrl: undefined as unknown as string,
    },
    useAccountEmail: true, // Default: use account email as business email
    location: {
      isRemote: false,
      name: undefined as unknown as string,
      description: undefined as unknown as string,
      phone: undefined as unknown as string,
      email: undefined as unknown as string,
      address: undefined as unknown as string,
      timezone: undefined as unknown as string,
      workingHours: defaultWorkingHours,
      isActive: true,
    },
    teamMembers: [],
    worksSolo: true,
    currentStep: 1,
  },
  isLoading: true,
  error: null,
};

export default function setupWizardReducer(state: WizardState = initialState, action: any) {
  switch (action.type) {
    // Reset wizard state on auth boundary changes
    case getType(logoutRequestAction.success): {
      return { ...initialState };
    }
    case getType(loginAction.success):
    case getType(registerOwnerRequestAction.success): {
      return { ...state, isLoading: true, error: null, data: { ...initialState.data } };
    }
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

      // If no draft exists for this user, fully reset to initial defaults
      const isEmpty = !payload || Object.keys(payload).length === 0;
      if (isEmpty) {
        return {
          ...state,
          isLoading: false,
          data: { ...initialState.data },
        };
      }

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
          worksSolo: payload.worksSolo ?? state.data.worksSolo,
          useAccountEmail: payload.useAccountEmail ?? state.data.useAccountEmail,
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
          worksSolo: payload.worksSolo ?? state.data.worksSolo,
          useAccountEmail: payload.useAccountEmail ?? state.data.useAccountEmail,
        },
      };
    }
    default:
      return state;
  }
}


