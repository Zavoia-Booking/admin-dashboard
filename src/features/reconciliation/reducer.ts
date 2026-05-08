import { getType } from 'typesafe-actions';
import {
  closeReconciliationAction,
  openReconciliationAction,
  unassignFromLocationAction,
  type ReconciliationMode,
} from './actions';

export interface ReconciliationState {
  open: boolean;
  mode: ReconciliationMode | null;
  userId: number | null;
  locationId: number | null;
  isUnassigning: boolean;
  unassignError: string | null;
}

const initialState: ReconciliationState = {
  open: false,
  mode: null,
  userId: null,
  locationId: null,
  isUnassigning: false,
  unassignError: null,
};

export const reconciliationReducer = (
  state: ReconciliationState = initialState,
  action: any,
): ReconciliationState => {
  switch (action.type) {
    case getType(openReconciliationAction):
      return {
        ...state,
        open: true,
        mode: action.payload.mode,
        userId: action.payload.userId ?? null,
        locationId: action.payload.locationId ?? null,
      };
    case getType(closeReconciliationAction):
      return {
        ...state,
        open: false,
        mode: null,
        userId: null,
        locationId: null,
        unassignError: null,
      };
    case getType(unassignFromLocationAction.request):
      return { ...state, isUnassigning: true, unassignError: null };
    case getType(unassignFromLocationAction.success):
      return { ...state, isUnassigning: false, unassignError: null };
    case getType(unassignFromLocationAction.failure):
      return { ...state, isUnassigning: false, unassignError: action.payload.message };
    default:
      return state;
  }
};

export default reconciliationReducer;
