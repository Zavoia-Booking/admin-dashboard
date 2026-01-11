import * as actions from "./actions";
import type { LocationState } from "./types";
import { getType, type ActionType } from "typesafe-actions";
import { logoutRequestAction } from "../auth/actions";
import type { Reducer } from "redux";

type Actions = ActionType<typeof actions> | ActionType<typeof logoutRequestAction>;

const initialState: LocationState = {
  isLoading: false,
  error: null,
  allLocations: [],
  isDeleting: false,
  deleteError: null,
  deleteResponse: null,
  updateResponse: null,
};

export const LocationsReducer: Reducer<LocationState, any> = (state: LocationState = initialState, action: Actions) => {
  switch (action.type) {
    // Reset state on logout to prevent stale data across accounts
    case getType(logoutRequestAction.success):
      return { ...initialState };

    case getType(actions.fetchLocationByIdAction.request):
      return { ...state, isLoading: true, error: null };

    case getType(actions.fetchLocationByIdAction.success):
      return { ...state, isLoading: false, current: action.payload.location, error: null };

    case getType(actions.fetchLocationByIdAction.failure):
      return { ...state, isLoading: false, error: action.payload.message };

    case getType(actions.createLocationAction.request):
      return { ...state, isLoading: true, error: null };

    case getType(actions.updateLocationAction.request):
      return { ...state, isLoading: true, error: null, updateResponse: null };

    case getType(actions.updateLocationAction.success):
      return { ...state, isLoading: false, updateResponse: action.payload.updateResponse, error: null };

    case getType(actions.listLocationsAction.request):
      return { ...state, isLoading: true, error: null };

    case getType(actions.listLocationsAction.success):
      return { ...state, isLoading: false, allLocations: action.payload.locations, error: null };

    case getType(actions.listLocationsAction.failure):
      return { ...state, isLoading: false, error: action.payload.message };

    case getType(actions.createLocationAction.failure):
      return { ...state, isLoading: false, error: action.payload.message };

    case getType(actions.updateLocationAction.failure):
      return { ...state, isLoading: false, error: action.payload.message };

    case getType(actions.deleteLocationAction.request):
      return { ...state, isDeleting: true, deleteError: null, deleteResponse: null };

    case getType(actions.deleteLocationAction.success):
      return { ...state, isDeleting: false, deleteError: null, deleteResponse: action.payload.deleteResponse };

    case getType(actions.deleteLocationAction.failure):
      return { ...state, isDeleting: false, deleteError: action.payload.message };

    default:
      return state;
  }
}
