import { getCustomersStateSelector } from "../../app/providers/selectors";
import { createSelector } from "@reduxjs/toolkit";
import type { Customer } from "../../shared/types/customer";

export const getAllCustomersSelector = createSelector(
  getCustomersStateSelector,
  (state): Customer[] => state.customers
);

export const getCustomersLoadingSelector = createSelector(
  getCustomersStateSelector,
  (state) => state.isLoading
);

export const getIsFetchingCustomerSelector = createSelector(
  getCustomersStateSelector,
  (state) => state.isFetchingCustomer
);

export const getIsRemovingCustomerSelector = createSelector(
  getCustomersStateSelector,
  (state) => state.isRemoving
);

export const getCustomersErrorSelector = createSelector(
  getCustomersStateSelector,
  (state) => state.error
);

export const getCurrentCustomerSelector = createSelector(
  getCustomersStateSelector,
  (state) => state.currentCustomer
);

export const getCustomersPaginationSelector = createSelector(
  getCustomersStateSelector,
  (state) => state.pagination
);

export const getCustomersSummarySelector = createSelector(
  getCustomersStateSelector,
  (state) => state.summary
);
