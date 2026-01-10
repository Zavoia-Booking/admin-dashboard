import type { BundlesState } from "./types.ts";
import { type ActionType, getType } from "typesafe-actions";
import * as actions from "./actions";
import { logoutRequestAction } from "../auth/actions";
import type { Reducer } from "redux";

type Actions = ActionType<typeof actions>;

const initialState: BundlesState = {
  bundles: [],
  error: null,
  isLoading: false,
  isDeleting: false,
  deleteError: null,
  deleteResponse: null,
};

export const BundlesReducer: Reducer<BundlesState, any> = (
  state: BundlesState = initialState,
  action: Actions
): BundlesState => {
  switch (action.type) {
    // Reset state on logout to prevent stale data across accounts
    case getType(logoutRequestAction.success):
      return { ...initialState };

    case getType(actions.listBundlesAction.request):
    case getType(actions.createBundleAction.request):
    case getType(actions.updateBundleAction.request):
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case getType(actions.deleteBundleAction.request):
      return {
        ...state,
        isDeleting: true,
        deleteError: null,
        deleteResponse: null,
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
      return {
        ...state,
        isLoading: false,
        error: null,
      };

    case getType(actions.deleteBundleAction.success):
      return {
        ...state,
        isDeleting: false,
        deleteError: null,
        deleteResponse: action.payload,
      };

    case getType(actions.createBundleAction.failure):
    case getType(actions.updateBundleAction.failure):
      return {
        ...state,
        isLoading: false,
        error: action.payload.message || "An error occurred",
      };

    case getType(actions.deleteBundleAction.failure):
      return {
        ...state,
        isDeleting: false,
        deleteError: action.payload.message || "An error occurred",
        deleteResponse: action.payload,
      };

    default:
      return state;
  }
};
