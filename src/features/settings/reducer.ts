import { getType } from "typesafe-actions";
import {
  getSubscriptionSummaryAction,
  createCheckoutSessionAction,
  getCustomerPortalUrlAction,
  modifySubscriptionAction,
  cancelRemovalAction,
  clearSettingsErrorAction,
  clearCheckoutResponseAction,
} from "./actions";
import type { SettingsState } from "./types";

const initialState: SettingsState = {
  subscriptionSummary: null,
  checkoutResponse: null,
  customerPortalUrl: null,
  error: null,
  isLoading: {
    subscriptionSummary: false,
    checkoutSession: false,
    customerPortal: false,
    modifySubscription: false,
    cancelRemoval: false,
  },
};

export default function settingsReducer(state: SettingsState = initialState, action: any) {
  switch (action.type) {
    // Pricing Summary
    case getType(getSubscriptionSummaryAction.request):
      return {
        ...state,
        isLoading: { ...state.isLoading, subscriptionSummary: true },
        error: null,
      };

    case getType(getSubscriptionSummaryAction.success):
      return {
        ...state,
        subscriptionSummary: action.payload.subscriptionSummary,
        isLoading: { ...state.isLoading, subscriptionSummary: false },
        error: null,
      };

    case getType(getSubscriptionSummaryAction.failure):
      return {
        ...state,
        isLoading: { ...state.isLoading, subscriptionSummary: false },
        error: action.payload.message,
      };

      // Checkout Session
    case getType(createCheckoutSessionAction.request):
      return {
        ...state,
        isLoading: { ...state.isLoading, checkoutSession: true },
        error: null,
      };

    case getType(createCheckoutSessionAction.success):
      return {
        ...state,
        checkoutResponse: action.payload.checkoutResponse,
        isLoading: { ...state.isLoading, checkoutSession: false },
        error: null,
      };

    case getType(createCheckoutSessionAction.failure):
      return {
        ...state,
        isLoading: { ...state.isLoading, checkoutSession: false },
        error: action.payload.message,
      };


    // Customer Portal
    case getType(getCustomerPortalUrlAction.request):
      return {
        ...state,
        isLoading: { ...state.isLoading, customerPortal: true },
        error: null,
      };

    case getType(getCustomerPortalUrlAction.success):
      return {
        ...state,
        customerPortalUrl: action.payload.url,
        isLoading: { ...state.isLoading, customerPortal: false },
        error: null,
      };

    case getType(getCustomerPortalUrlAction.failure):
      return {
        ...state,
        isLoading: { ...state.isLoading, customerPortal: false },
        error: action.payload.message,
      };

    // Modify Subscription
    case getType(modifySubscriptionAction.request):
      return {
        ...state,
        isLoading: { ...state.isLoading, modifySubscription: true },
        error: null,
      };

    case getType(modifySubscriptionAction.success):
      return {
        ...state,
        isLoading: { ...state.isLoading, modifySubscription: false },
        error: null,
      };

    case getType(modifySubscriptionAction.failure):
      return {
        ...state,
        isLoading: { ...state.isLoading, modifySubscription: false },
        error: action.payload.message,
      };

    // Cancel Removal
    case getType(cancelRemovalAction.request):
      return {
        ...state,
        isLoading: { ...state.isLoading, cancelRemoval: true },
        error: null,
      };

    case getType(cancelRemovalAction.success):
      return {
        ...state,
        isLoading: { ...state.isLoading, cancelRemoval: false },
        error: null,
      };

    case getType(cancelRemovalAction.failure):
      return {
        ...state,
        isLoading: { ...state.isLoading, cancelRemoval: false },
        error: action.payload.message,
      };

    // Clear Actions
    case getType(clearSettingsErrorAction):
      return {
        ...state,
        error: null,
      };

    case getType(clearCheckoutResponseAction):
      return {
        ...state,
        checkoutResponse: null,
      };


    default:
      return state;
  }
}
