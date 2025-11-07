import * as actions from "./actions";
import { hydrateSessionAction, loginAction, logoutRequestAction, registerOwnerRequestAction, setAuthLoadingAction, setAuthUserAction, setTokensAction, clearAuthErrorAction, googleLoginAction, googleRegisterAction, openAccountLinkingModal, closeAccountLinkingModal, reauthForLinkAction, linkGoogleAction, unlinkGoogleAction, selectBusinessAction, sendBusinessLinkEmailAction, closeAccountLinkingRequiredModal, dismissBusinessSelectorModal, setMemberRegistrationLoadingAction, checkTeamInvitationAction, completeTeamInvitationAction } from "./actions";
import type { AuthState } from "./types";
import { AuthStatusEnum  } from "./types";
import { getType, type ActionType } from "typesafe-actions";
import { type Reducer } from "redux";

type Actions = ActionType<typeof actions>

const initialState: AuthState = {
  accessToken: null,
  csrfToken: null,
  businessId: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  status: AuthStatusEnum.IDLE,
  error: null,
  lastRefreshAt: null,
  isAccountLinkingModalOpen: false,
  pendingLinkTxId: undefined,
  linkingLoading: false,
  linkingError: null,
  businessSelectionRequired: null,
  accountLinkingRequired: null,
  isRegistration: false,
  isMemberRegistrationLoading: false,
  memberRegistrationError: null,
  teamInvitationStatus: null,
  teamInvitationData: null,
  teamInvitationError: null,
};

export const AuthReducer: Reducer<AuthState, any> = (state: AuthState = initialState, action: Actions) => {
  switch (action.type) {
    case getType(setAuthLoadingAction): {
      return { ...state, isLoading: action.payload.isLoading };
    }

    case getType(registerOwnerRequestAction.request): {
      return { ...state, isLoading: true };
    }

    case getType(actions.resetRegistrationFlag): {
      return { ...state, isRegistration: false };
    }

    case getType(setMemberRegistrationLoadingAction): {
      return { ...state, isMemberRegistrationLoading: action.payload.isLoading };
    }

    case getType(registerOwnerRequestAction.success): {
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        error: null,
        status: AuthStatusEnum.AUTHENTICATED,
        isRegistration: true,
      };
    }

    case getType(registerOwnerRequestAction.failure): {
      // Check if this is account linking required error
      if (action.payload.message === 'account_exists_needs_business_owner_account') {
        return {
          ...state,
          isLoading: false,
          accountLinkingRequired: (action.payload as any).accountLinkingDetails,
          error: null, // Don't show error toast
        };
      }
      
      return {
        ...state,
        isAuthenticated: false,
        error: action.payload.message,
        status: AuthStatusEnum.ERROR,
      };
    }

    case getType(loginAction.request): {
      return { ...state, isLoading: true };
    }

    case getType(loginAction.success): {
      const { user } = action.payload;
      return {
        ...state,
        isAuthenticated: true,
        user,
        error: null,
        isLoading: false,
        status: AuthStatusEnum.AUTHENTICATED,
        isRegistration: false, // Login, not registration
      };
    }

    case getType(loginAction.failure): {
      // Check if it's a business selection required error
      if (action.payload.message === 'business_selection_required') {
        return {
          ...state,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          businessSelectionRequired: {
            selectionToken: (action.payload as any).selectionToken,
            businesses: (action.payload as any).businesses,
          },
        };
      }
      
      // Check if this is account linking required error
      if (action.payload.message === 'account_exists_needs_business_owner_account') {
        return {
          ...state,
          isLoading: false,
          accountLinkingRequired: (action.payload as any).accountLinkingDetails,
          error: null, // Don't show error toast
        };
      }
      
      return {
        ...state,
        isAuthenticated: false,
        error: action.payload.message,
        isLoading: false,
        status: AuthStatusEnum.ERROR,
      };
    }

    case getType(setAuthUserAction): {
      return {
        ...state,
        isAuthenticated: !!action.payload.user,
        user: action.payload.user,
        status: action.payload ? AuthStatusEnum.AUTHENTICATED : AuthStatusEnum.UNAUTHENTICATED,
      };
    }

    case getType(setTokensAction): {
      const { accessToken, csrfToken } = action.payload as { accessToken: string | null; csrfToken?: string | null };
      return {
        ...state,
        accessToken,
        csrfToken: typeof csrfToken !== "undefined" ? csrfToken : state.csrfToken,
        isAuthenticated: !!accessToken,
        status: accessToken ? AuthStatusEnum.AUTHENTICATED : AuthStatusEnum.UNAUTHENTICATED,
        error: null,
        lastRefreshAt: accessToken ? Date.now() : null,
      };
    }


    case getType(hydrateSessionAction.success): {
      const { accessToken, csrfToken, businessId, user } = action.payload;
      return {
        ...state,
        accessToken,
        csrfToken,
        businessId: businessId ?? state.businessId,
        user: user ?? state.user,
        isAuthenticated: true,
        status: AuthStatusEnum.AUTHENTICATED,
        error: null,
        lastRefreshAt: Date.now(),
      };
    }

    case getType(hydrateSessionAction.failure): {
      // Don't show error for intentionally skipped hydration (e.g., public pages)
      const isSkippedHydration = action.payload.message?.includes("Skipped hydration");
      return {
        ...state,
        accessToken: null,
        isAuthenticated: false,
        status: AuthStatusEnum.UNAUTHENTICATED,
        error: isSkippedHydration ? null : action.payload.message,
        lastRefreshAt: null,
      };
    }

    case getType(logoutRequestAction.success): {
      return { ...initialState };
    }

    case getType(logoutRequestAction.failure): {
      return { ...state, error: action.payload.message };
    }

    case getType(clearAuthErrorAction): {
      return { ...state, error: null };
    }

    case getType(openAccountLinkingModal): {
      return { ...state, isAccountLinkingModalOpen: true, pendingLinkTxId: action.payload.txId } as any;
    }

    case getType(closeAccountLinkingModal): {
      return { ...state, isAccountLinkingModalOpen: false, pendingLinkTxId: null } as any;
    }

    // Linking flow states
    case getType(reauthForLinkAction.request):
    case getType(linkGoogleAction.request): {
      return { ...state, linkingLoading: true, linkingError: null } as any;
    }

    case getType(reauthForLinkAction.failure):
    case getType(linkGoogleAction.failure): {
      return { ...state, linkingLoading: false, linkingError: (action as any).payload.message } as any;
    }

    case getType(linkGoogleAction.success): {
      return { ...state, linkingLoading: false, linkingError: null, isAccountLinkingModalOpen: false, pendingLinkTxId: undefined } as any;
    }

    // Unlink Google account handlers
    case getType(unlinkGoogleAction.request): {
      return { ...state, linkingLoading: true, linkingError: null } as any;
    }

    case getType(unlinkGoogleAction.success): {
      return { ...state, linkingLoading: false, linkingError: null } as any;
    }

    case getType(unlinkGoogleAction.failure): {
      return { ...state, linkingLoading: false, linkingError: (action as any).payload.message } as any;
    }

    case getType(googleLoginAction.request):
    case getType(googleRegisterAction.request): {
      return { ...state, isLoading: true, error: null };
    }

    case getType(googleLoginAction.success): {
      const { accessToken, csrfToken, user } = action.payload;
      return {
        ...state,
        accessToken,
        csrfToken,
        user,
        isAuthenticated: true,
        isLoading: false,
        status: AuthStatusEnum.AUTHENTICATED,
        error: null,
        businessId: user?.businessId?.toString() || null,
        isRegistration: false, // Login, not registration
      };
    }

    case getType(googleRegisterAction.success): {
      const { accessToken, csrfToken, user } = action.payload;
      return {
        ...state,
        accessToken,
        csrfToken,
        user,
        isAuthenticated: true,
        isLoading: false,
        status: AuthStatusEnum.AUTHENTICATED,
        error: null,
        businessId: user?.businessId?.toString() || null,
        isRegistration: true, // Registration
      };
    }

    case getType(googleLoginAction.failure):
    case getType(googleRegisterAction.failure): {
      // Check if it's a business selection required error
      if (action.payload.message === 'business_selection_required') {
        return {
          ...state,
          isAuthenticated: false,
          isLoading: false,
          status: AuthStatusEnum.UNAUTHENTICATED,
          error: null,
          businessSelectionRequired: {
            selectionToken: (action.payload as any).selectionToken,
            businesses: (action.payload as any).businesses,
          },
        };
      }
      
      // Check if this is account linking required error
      if (action.payload.message === 'account_exists_needs_business_owner_account') {
        return {
          ...state,
          isLoading: false,
          accountLinkingRequired: (action.payload as any).accountLinkingDetails,
          error: null, // Don't show error toast
        };
      }
      
      return { 
        ...state, 
        isLoading: false, 
        error: action.payload.message,
        status: AuthStatusEnum.ERROR 
      };
    }

    case getType(selectBusinessAction.request): {
      return { ...state, isLoading: true, error: null };
    }

    case getType(selectBusinessAction.success): {
      const { accessToken, csrfToken, user } = action.payload;
      return {
        ...state,
        accessToken,
        csrfToken,
        user,
        isAuthenticated: true,
        isLoading: false,
        status: AuthStatusEnum.AUTHENTICATED,
        error: null,
        businessId: user?.businessId?.toString() || null,
        businessSelectionRequired: null, // Clear the selection state
        isRegistration: false, // Business selection is part of login flow
      };
    }

    case getType(selectBusinessAction.failure): {
      return { 
        ...state, 
        isLoading: false, 
        error: action.payload.message,
        status: AuthStatusEnum.ERROR 
      };
    }

    case getType(sendBusinessLinkEmailAction.request): {
      return { ...state, isLoading: true, error: null };
    }

    case getType(sendBusinessLinkEmailAction.success): {
      return { 
        ...state, 
        isLoading: false, 
        accountLinkingRequired: null, // Clear modal after success
      };
    }

    case getType(sendBusinessLinkEmailAction.failure): {
      return { 
        ...state, 
        isLoading: false, 
        error: action.payload.message,
      };
    }

    case getType(closeAccountLinkingRequiredModal): {
      return { 
        ...state, 
        accountLinkingRequired: null,
        error: null,
      };
    }

    case getType(dismissBusinessSelectorModal): {
      return { 
        ...state, 
        businessSelectionRequired: null,
        error: null,
      };
    }

    // Team Invitation handlers
    case getType(checkTeamInvitationAction.request): {
      return {
        ...state,
        teamInvitationStatus: 'checking',
        teamInvitationError: null,
      };
    }

    case getType(checkTeamInvitationAction.success): {
      const response = action.payload;
      if (response.status === 'needs_registration') {
        return {
          ...state,
          teamInvitationStatus: 'needs_registration',
          teamInvitationData: {
            token: response.token,
            business: response.business,
            email: response.email,
          },
          teamInvitationError: null,
        };
      } else {
        // status === 'accepted' - user already existed and was added to business
        // Don't auto-authenticate - user will be redirected to login page
        return {
          ...state,
          teamInvitationStatus: 'accepted',
          teamInvitationData: null,
          teamInvitationError: null,
        };
      }
    }

    case getType(checkTeamInvitationAction.failure): {
      return {
        ...state,
        teamInvitationStatus: 'error',
        teamInvitationError: action.payload.message,
      };
    }

    case getType(completeTeamInvitationAction.request): {
      return {
        ...state,
        isMemberRegistrationLoading: true,
        memberRegistrationError: null,
      };
    }

    case getType(completeTeamInvitationAction.success): {
      return {
        ...state,
        isMemberRegistrationLoading: false,
        teamInvitationStatus: 'completed',
        teamInvitationData: null,
        memberRegistrationError: null,
        // Don't auto-authenticate - user will be redirected to login
      };
    }

    case getType(completeTeamInvitationAction.failure): {
      return {
        ...state,
        isMemberRegistrationLoading: false,
        memberRegistrationError: action.payload.message,
      };
    }

    default:
      return state;
  }
}
