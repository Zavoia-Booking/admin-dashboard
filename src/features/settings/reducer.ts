import { getType } from "typesafe-actions";
import {
  getSubscriptionSummaryAction,
  createCheckoutSessionAction,
  getCustomerPortalUrlAction,
  modifySubscriptionAction,
  cancelRemovalAction,
  clearSettingsErrorAction,
  clearCheckoutResponseAction,
  getSmsBalanceAction,
  getSmsPackagesAction,
  createSmsCheckoutAction,
  getSmsPurchasesAction,
  clearSmsErrorAction,
} from "./actions";
import { logoutRequestAction } from "../auth/actions";
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
  // SMS State
  smsBalance: null,
  smsPackages: [],
  smsPurchases: [],
  smsPurchasesHasMore: false,
  smsPurchasesNextCursor: null,
  smsError: null,
  smsIsLoading: {
    balance: false,
    packages: false,
    checkout: false,
    purchases: false,
  },
};

export default function settingsReducer(state: SettingsState = initialState, action: any) {
  switch (action.type) {
    // Reset state on logout to prevent stale data across accounts
    case getType(logoutRequestAction.success):
      return { ...initialState };

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

    // SMS Balance
    case getType(getSmsBalanceAction.request):
      return {
        ...state,
        smsIsLoading: { ...state.smsIsLoading, balance: true },
        smsError: null,
      };

    case getType(getSmsBalanceAction.success):
      return {
        ...state,
        smsBalance: action.payload.balance,
        smsIsLoading: { ...state.smsIsLoading, balance: false },
      };

    case getType(getSmsBalanceAction.failure):
      return {
        ...state,
        smsIsLoading: { ...state.smsIsLoading, balance: false },
        smsError: action.payload.message,
      };

    // SMS Packages
    case getType(getSmsPackagesAction.request):
      return {
        ...state,
        smsIsLoading: { ...state.smsIsLoading, packages: true },
        smsError: null,
      };

    case getType(getSmsPackagesAction.success):
      return {
        ...state,
        smsPackages: action.payload.packages,
        smsIsLoading: { ...state.smsIsLoading, packages: false },
      };

    case getType(getSmsPackagesAction.failure):
      return {
        ...state,
        smsIsLoading: { ...state.smsIsLoading, packages: false },
        smsError: action.payload.message,
      };

    // SMS Checkout
    case getType(createSmsCheckoutAction.request):
      return {
        ...state,
        smsIsLoading: { ...state.smsIsLoading, checkout: true },
        smsError: null,
      };

    case getType(createSmsCheckoutAction.success):
      return {
        ...state,
        smsIsLoading: { ...state.smsIsLoading, checkout: false },
      };

    case getType(createSmsCheckoutAction.failure):
      return {
        ...state,
        smsIsLoading: { ...state.smsIsLoading, checkout: false },
        smsError: action.payload.message,
      };

    // SMS Purchases
    case getType(getSmsPurchasesAction.request):
      return {
        ...state,
        smsIsLoading: { ...state.smsIsLoading, purchases: true },
        smsError: null,
      };

    case getType(getSmsPurchasesAction.success):
      return {
        ...state,
        smsPurchases: action.payload.purchases,
        smsPurchasesHasMore: action.payload.hasMore,
        smsPurchasesNextCursor: action.payload.nextCursor ?? null,
        smsIsLoading: { ...state.smsIsLoading, purchases: false },
      };

    case getType(getSmsPurchasesAction.failure):
      return {
        ...state,
        smsIsLoading: { ...state.smsIsLoading, purchases: false },
        smsError: action.payload.message,
      };

    // Clear SMS Error
    case getType(clearSmsErrorAction):
      return {
        ...state,
        smsError: null,
      };

    default:
      return state;
  }
}
