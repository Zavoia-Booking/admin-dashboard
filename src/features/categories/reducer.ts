import type { CategoriesState } from "./types";
import { type ActionType, getType } from "typesafe-actions";
import * as actions from "./actions";
import type { Reducer } from "redux";

type Actions = ActionType<typeof actions>;

const initialState: CategoriesState = {
  categories: [],
  isLoading: false,
  error: null,
};

export const CategoriesReducer: Reducer<CategoriesState, any> = (
  state: CategoriesState = initialState,
  action: Actions
): CategoriesState => {
  switch (action.type) {
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
