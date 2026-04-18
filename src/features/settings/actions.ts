import { createAsyncAction, createAction } from "typesafe-actions";
import type {
  SubscriptionSummary,
  CheckoutPayload,
  CheckoutResponse,
  BusinessSmsInfo,
  SmsPackage,
  SmsPurchase,
  SmsCheckoutPayload,
  SmsCheckoutResponse,
  BusinessInvoice,
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

// SMS Actions
export const getSmsBalanceAction = createAsyncAction(
  'settings/GET_SMS_BALANCE_REQUEST',
  'settings/GET_SMS_BALANCE_SUCCESS',
  'settings/GET_SMS_BALANCE_FAILURE',
)<void, { balance: BusinessSmsInfo }, { message: string }>();

export const getSmsPackagesAction = createAsyncAction(
  'settings/GET_SMS_PACKAGES_REQUEST',
  'settings/GET_SMS_PACKAGES_SUCCESS',
  'settings/GET_SMS_PACKAGES_FAILURE',
)<void, { packages: SmsPackage[] }, { message: string }>();

export const createSmsCheckoutAction = createAsyncAction(
  'settings/CREATE_SMS_CHECKOUT_REQUEST',
  'settings/CREATE_SMS_CHECKOUT_SUCCESS',
  'settings/CREATE_SMS_CHECKOUT_FAILURE',
)<SmsCheckoutPayload, SmsCheckoutResponse, { message: string }>();

export const getSmsPurchasesAction = createAsyncAction(
  'settings/GET_SMS_PURCHASES_REQUEST',
  'settings/GET_SMS_PURCHASES_SUCCESS',
  'settings/GET_SMS_PURCHASES_FAILURE',
)<{ limit?: number; cursor?: number } | void, { purchases: SmsPurchase[]; hasMore: boolean; nextCursor?: number }, { message: string }>();

export const clearSmsErrorAction = createAction('settings/CLEAR_SMS_ERROR')();

// Business Invoices (Oblio) Actions
export const getBusinessInvoicesAction = createAsyncAction(
  'settings/GET_BUSINESS_INVOICES_REQUEST',
  'settings/GET_BUSINESS_INVOICES_SUCCESS',
  'settings/GET_BUSINESS_INVOICES_FAILURE',
)<{ limit?: number; cursor?: number } | void, { invoices: BusinessInvoice[]; hasMore: boolean; nextCursor?: number; append: boolean }, { message: string }>();
