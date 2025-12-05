import type { BundlesState } from "./types.ts";
import { type ActionType, getType } from "typesafe-actions";
import * as actions from "./actions";
import type { Reducer } from "redux";

type Actions = ActionType<typeof actions>;

const initialState: BundlesState = {
  bundles: [],
  error: null,
  isLoading: false,
};

export const BundlesReducer: Reducer<BundlesState, Actions> = (
  state: BundlesState = initialState,
  action: Actions
): BundlesState => {
  switch (action.type) {
    case getType(actions.listBundlesAction.request):
    case getType(actions.createBundleAction.request):
    case getType(actions.updateBundleAction.request):
    case getType(actions.deleteBundleAction.request):
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case getType(actions.listBundlesAction.success):
      return {
        ...state,
        bundles: action.payload,
        isLoading: false,
        error: null,
      };

    case getType(actions.listBundlesAction.failure):
      return {
        ...state,
        isLoading: false,
        error: action.payload.message || "An error occurred",
      };

    case getType(actions.createBundleAction.success):
    case getType(actions.updateBundleAction.success):
    case getType(actions.deleteBundleAction.success):
      return {
        ...state,
        isLoading: false,
        error: null,
      };

    case getType(actions.createBundleAction.failure):
    case getType(actions.updateBundleAction.failure):
    case getType(actions.deleteBundleAction.failure):
      return {
        ...state,
        isLoading: false,
        error: action.payload.message || "An error occurred",
      };

    default:
      return state;
  }
};

