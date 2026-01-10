import { createAsyncAction, createAction } from "typesafe-actions";
import type { 
  SubscriptionSummary, 
  CheckoutPayload, 
  CheckoutResponse
} from "./types";

// Pricing Summary Actions
export const getSubscriptionSummaryAction = createAsyncAction(
  'settings/GET_SUBSCRIPTION_SUMMARY_REQUEST',
  'settings/GET_SUBSCRIPTION_SUMMARY_SUCCESS',
  'settings/GET_SUBSCRIPTION_SUMMARY_FAILURE',
)<void, { subscriptionSummary: SubscriptionSummary }, { message: string }>();

// Checkout Session Actions
export const createCheckoutSessionAction = createAsyncAction(
  'settings/CREATE_CHECKOUT_SESSION_REQUEST',
  'settings/CREATE_CHECKOUT_SESSION_SUCCESS',
  'settings/CREATE_CHECKOUT_SESSION_FAILURE',
)<CheckoutPayload, { checkoutResponse: CheckoutResponse }, { message: string }>();


// Customer Portal Actions
export const getCustomerPortalUrlAction = createAsyncAction(
  'settings/GET_CUSTOMER_PORTAL_URL_REQUEST',
  'settings/GET_CUSTOMER_PORTAL_URL_SUCCESS',
  'settings/GET_CUSTOMER_PORTAL_URL_FAILURE',
)<{ returnUrl: string }, { url: string }, { message: string }>();

// Modify Subscription Actions (cancel or keep)
export const modifySubscriptionAction = createAsyncAction(
  'settings/MODIFY_SUBSCRIPTION_REQUEST',
  'settings/MODIFY_SUBSCRIPTION_SUCCESS',
  'settings/MODIFY_SUBSCRIPTION_FAILURE',
)<{ action: 'cancel' | 'keep' }, { success: boolean }, { message: string }>();

// Cancel Removal Actions
export const cancelRemovalAction = createAsyncAction(
  'settings/CANCEL_REMOVAL_REQUEST',
  'settings/CANCEL_REMOVAL_SUCCESS',
  'settings/CANCEL_REMOVAL_FAILURE',
)<void, { success: boolean }, { message: string }>();

// Clear Actions
export const clearSettingsErrorAction = createAction('settings/CLEAR_ERROR')();
export const clearCheckoutResponseAction = createAction('settings/CLEAR_CHECKOUT_RESPONSE')();
