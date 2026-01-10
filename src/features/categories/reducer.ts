import type { CategoriesState } from "./types";
import { getType } from "typesafe-actions";
import * as actions from "./actions";
import { logoutRequestAction } from "../auth/actions";
import type { Reducer } from "redux";

const initialState: CategoriesState = {
  categories: [],
  isLoading: false,
  error: null,
};

export const CategoriesReducer: Reducer<CategoriesState, any> = (
  state: CategoriesState = initialState,
  action: any
): CategoriesState => {
  switch (action.type) {
    // Reset state on logout to prevent stale data across accounts
    case getType(logoutRequestAction.success):
      return { ...initialState };

    case getType(actions.listCategoriesAction.request):
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case getType(actions.listCategoriesAction.success):
      return {
        ...state,
        categories: action.payload,
        isLoading: false,
        error: null,
      };

    case getType(actions.listCategoriesAction.failure):
      return {
        ...state,
        isLoading: false,
        error: (action.payload as any)?.message || "Failed to load categories",
      };

    default:
      return state;
  }
};
