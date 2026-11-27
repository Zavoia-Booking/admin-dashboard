import { getType } from 'typesafe-actions';
import { fetchCurrentBusinessAction } from './actions';
import { logoutRequestAction } from '../auth/actions';
import type { BusinessState } from './types';

const initialState: BusinessState = {
  current: null,
  isLoading: false,
  error: null,
};

export default function businessReducer(
  state: BusinessState = initialState,
  action: any
): BusinessState {
  switch (action.type) {
    // Reset state on logout to prevent stale data across accounts
    case getType(logoutRequestAction.success):
      return { ...initialState };

    case getType(fetchCurrentBusinessAction.request):
      return { ...state, isLoading: true, error: null };
    
    case getType(fetchCurrentBusinessAction.success):
      return { ...state, isLoading: false, current: action.payload };
    
    case getType(fetchCurrentBusinessAction.failure):
      return { ...state, isLoading: false, error: action.payload.message };
    
    default:
      return state;
  }
}
