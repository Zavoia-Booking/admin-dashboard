import * as actions from "./actions";
import type { LocationState } from "./types";
import { getType, type ActionType } from "typesafe-actions";
import type { Reducer } from "redux";

type Actions = ActionType<typeof actions>;

const initialState: LocationState = {
  current: null,
  isLoading: false,
  error: null,
  allLocations: [],
};

export const LocationsReducer: Reducer<LocationState, any> = (state: LocationState = initialState, action: Actions) => {
  switch (action.type) {
    case getType(actions.fetchLocationByIdAction.request):
      return { ...state, isLoading: true, error: null };

    case getType(actions.fetchLocationByIdAction.success):
      return { ...state, isLoading: false, current: action.payload.location, error: null };

    case getType(actions.fetchLocationByIdAction.failure):
      return { ...state, isLoading: false, error: action.payload.message };

    case getType(actions.createLocationAction.request):
      return { ...state, isLoading: true, error: null };

    case getType(actions.updateLocationAction.request):
      return { ...state, isLoading: true, error: null };

    case getType(actions.listLocationsAction.success):
      return { ...state, isLoading: false, allLocations: action.payload.locations, error: null };

    case getType(actions.listLocationsAction.failure):
      return { ...state, isLoading: false, error: action.payload.message };

    case getType(actions.createLocationAction.failure):
      return { ...state, isLoading: false, error: action.payload.message };

    case getType(actions.updateLocationAction.failure):
      return { ...state, isLoading: false, error: action.payload.message };

    case getType(actions.setCurrentLocation):
      return { ...state, current: action.payload.location };

    default:
      return state;
  }
}
