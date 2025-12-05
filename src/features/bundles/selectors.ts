import { createSelector } from "@reduxjs/toolkit";
import { getBundlesStateSelector } from "../../app/providers/selectors.ts";
import type { Bundle } from "./types.ts";

export const getBundlesListSelector = createSelector(
  getBundlesStateSelector,
  (state): Bundle[] => {
    return Array.isArray(state.bundles) ? state.bundles : [];
  }
);

export const getBundlesErrorSelector = createSelector(
  getBundlesStateSelector,
  (state) => {
    return state.error;
  }
);

export const getBundlesLoadingSelector = createSelector(
  getBundlesStateSelector,
  (state) => {
    return state.isLoading;
  }
);

