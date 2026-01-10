import * as actions from "./actions";
import type { CustomerState } from "./types";
import { getType, type ActionType } from "typesafe-actions";
import { logoutRequestAction } from "../auth/actions";
import type { Reducer } from "redux";

type Actions = ActionType<typeof actions>;

const initialState: CustomerState = {
  isLoading: false,
  error: null,
  customers: [],
  currentCustomer: null,
  isFetchingCustomer: false,
  isRemoving: false,
  pagination: null,
  summary: null,
};

export const CustomersReducer: Reducer<CustomerState, any> = (
  state: CustomerState = initialState,
  action: Actions
) => {
  switch (action.type) {
    // Reset state on logout to prevent stale data across accounts
    case getType(logoutRequestAction.success):
      return { ...initialState };

    case getType(actions.fetchCustomerByIdAction.request):
      return { ...state, isFetchingCustomer: true, error: null, currentCustomer: null };

    case getType(actions.fetchCustomerByIdAction.success):
      return { 
        ...state, 
        isFetchingCustomer: false, 
        currentCustomer: action.payload.customer, 
        error: null 
      };

    case getType(actions.fetchCustomerByIdAction.failure):
      return { ...state, isFetchingCustomer: false, error: action.payload.message };

    case getType(actions.addCustomerAction.request):
      return { ...state, isLoading: true, error: null };

    case getType(actions.addCustomerAction.success):
      return { 
        ...state, 
        isLoading: false, 
        currentCustomer: action.payload.customer, 
        error: null 
      };

    case getType(actions.addCustomerAction.failure):
      return { ...state, isLoading: false, error: action.payload.message };

    case getType(actions.updateCustomerAction.request):
      return { ...state, isLoading: true, error: null };

    case getType(actions.updateCustomerAction.success):
      return { ...state, isLoading: false, error: null };

    case getType(actions.updateCustomerAction.failure):
      return { ...state, isLoading: false, error: action.payload.message };

    case getType(actions.removeCustomerAction.request):
      return { ...state, isRemoving: true, error: null };

    case getType(actions.removeCustomerAction.success):
      return { ...state, isRemoving: false, error: null };

    case getType(actions.removeCustomerAction.failure):
      return { ...state, isRemoving: false, error: action.payload.message };

    case getType(actions.listCustomersAction.request):
      return { ...state, isLoading: true, error: null };

    case getType(actions.listCustomersAction.success):
      return { 
        ...state, 
        isLoading: false, 
        customers: action.payload.data, 
        pagination: action.payload.pagination,
        summary: action.payload.summary,
        error: null 
      };

    case getType(actions.listCustomersAction.failure):
      return { ...state, isLoading: false, error: action.payload.message };

    case getType(actions.clearCurrentCustomerAction):
      return { ...state, currentCustomer: null, error: null };

    default:
      return state;
  }
};

