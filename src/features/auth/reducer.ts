import { setAuthLoadingAction, registerOwnerSuccess, registerOwnerFailure, setAuthUser, logoutAction } from "./actions";
import type { AuthUser } from "./types";

type AuthState = {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: AuthUser | null;
    error: string | null;
};

const initialState: AuthState = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    error: null,
};

export default function authReducer (state:AuthState = initialState, action: any) {
    switch (action.type) {
        case (setAuthLoadingAction.type): {
           return {
               ...state,
               isLoading: action.payload,
           }
        }
        case (registerOwnerSuccess.type): {
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload.user,
                error: null,
            }
        }
        case (registerOwnerFailure.type): {
            return {
                ...state,
                isAuthenticated: false,
                error: action.payload,
            }
        }
        case (setAuthUser.type): {
            return {
                ...state,
                isAuthenticated: !!action.payload,
                user: action.payload,
            }
        }
        case (logoutAction.type): {
            return {
                ...initialState
            }
        }

        default:
            return state
    }
}