import * as actions from "./actions";
import { hydrateSessionAction, loginAction, logoutRequestAction, registerOwnerRequestAction, setAuthLoadingAction, setAuthUserAction, setTokensAction, clearAuthErrorAction } from "./actions";
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
};

export const AuthReducer: Reducer<AuthState, any> = (state: AuthState = initialState, action: Actions) => {
  switch (action.type) {
    case getType(setAuthLoadingAction): {
      return { ...state, isLoading: action.payload.isLoading };
    }

    case getType(registerOwnerRequestAction.request): {
      return { ...state, isLoading: true };
    }

    case getType(registerOwnerRequestAction.success): {
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        error: null,
        status: AuthStatusEnum.AUTHENTICATED,
      };
    }

    case getType(registerOwnerRequestAction.failure): {
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

    // case getType(setCsrfTokenAction): {
    //   return { ...state, csrfToken: action.payload };
    // }

    // case SET_BUSINESS_ID: {
    //   return { ...state, businessId: action.payload };
    // }

    // case SET_STATUS: {
    //   return { ...state, status: action.payload };
    // }

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
      return {
        ...state,
        accessToken: null,
        isAuthenticated: false,
        status: AuthStatusEnum.UNAUTHENTICATED,
        error: action.payload.message,
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

    default:
      return state;
  }
}
