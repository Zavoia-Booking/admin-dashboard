import { getType } from 'typesafe-actions';
import { fetchCurrentBusinessAction, updateBusinessAction } from './actions';
import type { BusinessState } from './types';

const initialState: BusinessState = {
  current: null,
  isLoading: false,
  error: null,
  isUpdating: false,
  updateError: null,
};

export default function businessReducer(
  state: BusinessState = initialState,
  action: any
): BusinessState {
  switch (action.type) {
    case getType(fetchCurrentBusinessAction.request):
      return { ...state, isLoading: true, error: null };
    
    case getType(fetchCurrentBusinessAction.success):
      return { ...state, isLoading: false, current: action.payload };
    
    case getType(fetchCurrentBusinessAction.failure):
      return { ...state, isLoading: false, error: action.payload.message };
    
    case getType(updateBusinessAction.request):
      return { ...state, isUpdating: true, updateError: null };
    
    case getType(updateBusinessAction.success):
      return { ...state, isUpdating: false, updateError: null };
    
    case getType(updateBusinessAction.failure):
      return { ...state, isUpdating: false, updateError: action.payload.message };
    
    default:
      return state;
  }
}


