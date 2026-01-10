import { createSelector } from "@reduxjs/toolkit";
import { getCategoriesStateSelector } from "../../app/providers/selectors";
import type { Category } from "./api";

export const getCategoriesListSelector = createSelector(
  getCategoriesStateSelector,
  (state): Category[] => {
    return Array.isArray(state.categories) ? state.categories : [];
  }
);

export const getCategoriesLoadingSelector = createSelector(
  getCategoriesStateSelector,
  (state): boolean => {
    return state.isLoading;
  }
);

export const getCategoriesErrorSelector = createSelector(
  getCategoriesStateSelector,
  (state): string | null => {
    return state.error;
  }
);
