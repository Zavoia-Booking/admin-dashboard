import { setAuthLoadingAction } from "./actions";

type AuthState = {
    isAuthenticated: boolean;
    isLoading: boolean;
};

const initialState: AuthState = {
    isAuthenticated: false,
    isLoading: false,
};

export default function authReducer (state:AuthState = initialState, action: any) {
    switch (action.type) {
        case (setAuthLoadingAction): {
           return {
               ...state,
               isLoading: action.payload,
           }
        }

        default:
            return state
    }
}