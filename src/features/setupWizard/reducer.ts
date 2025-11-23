import { getType } from "typesafe-actions";
import type { WizardData } from "../../shared/hooks/useSetupWizard";
import { defaultWorkingHours } from "../locations/constants";
import {
  wizardSaveAction,
  wizardCompleteAction,
  wizardLoadDraftAction,
  wizardUpdateDataAction,
  setLogoBufferAction,
  clearLogoBufferAction,
} from "./actions";
import {
  loginAction,
  logoutRequestAction,
  registerOwnerRequestAction,
} from "../auth/actions";

type WizardState = {
  currentStep: number;
  totalSteps: number;
  data: WizardData;
  isLoading: boolean;
  error: string | null;
  logoFileBuffer: File | null; // Stores File object for logo (not serializable, but kept in memory)
};

// Helper to strip File objects from data before storing in Redux (Files are not serializable)
function stripFileObjects(data: any): any {
  if (!data) return data;

  const cleaned = { ...data };

  // Check businessInfo.logo
  if (cleaned.businessInfo?.logo instanceof File) {
    // Don't store File in Redux - keep only URL strings or null
    cleaned.businessInfo = {
      ...cleaned.businessInfo,
      logo: undefined, // Remove File, keep backend URL in Redux if it exists
    };
  }

  return cleaned;
}

const initialState: WizardState = {
  currentStep: 1,
  totalSteps: 3,
  data: {
    businessInfo: {
      name: undefined as unknown as string,
      industryId: undefined as unknown as number,
      description: undefined as unknown as string,
      email: undefined as unknown as string,
      phone: undefined as unknown as string,
      timezone: undefined as unknown as string,
      country: undefined as unknown as string,
      stripeCurrency: 'eur' as string, // Default to EUR (backend hardcoded)
      businessCurrency: 'eur' as string, // Default to EUR
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
      addressManualMode: undefined as unknown as boolean,
      timezone: undefined as unknown as string,
      workingHours: defaultWorkingHours,
    },
    useBusinessContact: true, // Default: use business contact as location contact
    teamMembers: [],
    worksSolo: true,
    currentStep: 1,
  },
  isLoading: true,
  error: null,
  logoFileBuffer: null,
};

export default function setupWizardReducer(
  state: WizardState = initialState,
  action: any
) {
  switch (action.type) {
    // Reset wizard state on auth boundary changes
    case getType(logoutRequestAction.success): {
      return { ...initialState };
    }
    case getType(loginAction.success):
    case getType(registerOwnerRequestAction.success): {
      return {
        ...state,
        isLoading: true,
        error: null,
        data: { ...initialState.data },
      };
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

      const mergedData = {
        ...state.data,
        ...payload,
        businessInfo: {
          ...state.data.businessInfo,
          ...(payload.businessInfo || ({} as any)),
          stripeCurrency: payload.businessInfo?.stripeCurrency || state.data.businessInfo.stripeCurrency || 'eur', // Ensure default
          businessCurrency: payload.businessInfo?.businessCurrency || state.data.businessInfo.businessCurrency || 'eur', // Ensure default
        },
        location: {
          ...state.data.location,
          ...(payload.location || ({} as any)),
        },
        teamMembers: payload.teamMembers ?? state.data.teamMembers,
        worksSolo: payload.worksSolo ?? state.data.worksSolo,
        useAccountEmail:
          payload.useAccountEmail ?? state.data.useAccountEmail,
        useBusinessContact:
          payload.useBusinessContact ?? state.data.useBusinessContact,
        currentStep: payload.currentStep ?? state.data.currentStep,
      };

      return {
        ...state,
        isLoading: false,
        data: mergedData,
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
      const cleanedPayload = stripFileObjects(payload);

      return {
        ...state,
        data: {
          ...state.data,
          ...cleanedPayload,
          businessInfo: {
            ...state.data.businessInfo,
            ...(cleanedPayload.businessInfo || {}),
          },
          location: {
            ...state.data.location,
            ...(cleanedPayload.location || {}),
          },
          teamMembers: payload.teamMembers ?? state.data.teamMembers,
          worksSolo: payload.worksSolo ?? state.data.worksSolo,
          useAccountEmail:
            payload.useAccountEmail ?? state.data.useAccountEmail,
          useBusinessContact:
            payload.useBusinessContact ?? state.data.useBusinessContact,
          currentStep: payload.currentStep ?? state.data.currentStep,
        },
      };
    }
    case getType(setLogoBufferAction): {
      return {
        ...state,
        logoFileBuffer: action.payload,
      };
    }
    case getType(clearLogoBufferAction): {
      return {
        ...state,
        logoFileBuffer: null,
      };
    }
    default:
      return state;
  }
}
