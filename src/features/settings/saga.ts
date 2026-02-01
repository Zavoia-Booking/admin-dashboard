import { takeLatest, call, put, all } from "redux-saga/effects";
import {
  getSubscriptionSummaryAction,
  createCheckoutSessionAction,
  getCustomerPortalUrlAction,
  modifySubscriptionAction,
  cancelRemovalAction,
  getSmsBalanceAction,
  getSmsPackagesAction,
  createSmsCheckoutAction,
  getSmsPurchasesAction,
} from "./actions";
import {
  getSubscriptionSummary,
  createCheckoutSession,
  getCustomerPortalUrl,
  modifySubscription,
  cancelRemoval,
  getSmsBalance,
  getSmsPackages,
  createSmsCheckout,
  getSmsPurchases,
} from "./api";
import type {
  SubscriptionSummary,
  CheckoutResponse,
  SmsBalanceResponse,
  SmsPackagesResponse,
  SmsCheckoutResponse,
  SmsPurchasesResponse,
} from "./types";
import { fetchCurrentUserAction } from "../auth/actions";

function* handleGetSubscriptionSummary() {
  try {
    const response: SubscriptionSummary = yield call(getSubscriptionSummary);
    yield put(getSubscriptionSummaryAction.success({ subscriptionSummary: response }));
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to fetch pricing summary';
    yield put(getSubscriptionSummaryAction.failure({ message }));
  }
}

function* handleCreateCheckoutSession(action: ReturnType<typeof createCheckoutSessionAction.request>) {
  try {
    const response: CheckoutResponse = yield call(createCheckoutSession, action.payload);
    yield put(createCheckoutSessionAction.success({ checkoutResponse: response }));
    
    // Redirect to Stripe Checkout if URL is provided
    if (response.url) {
      window.location.href = response.url;
    }
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to create checkout session';
    yield put(createCheckoutSessionAction.failure({ message }));
  }
}


function* handleGetCustomerPortalUrl(action: ReturnType<typeof getCustomerPortalUrlAction.request>) {
  try {
    const response: { url: string } = yield call(getCustomerPortalUrl, action.payload.returnUrl);
    yield put(getCustomerPortalUrlAction.success({ url: response.url }));
    
    // Redirect to Customer Portal if URL is provided
    if (response.url) {
      window.location.href = response.url;
    }
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to get customer portal URL';
    yield put(getCustomerPortalUrlAction.failure({ message }));
  }
}

function* handleModifySubscription(action: ReturnType<typeof modifySubscriptionAction.request>) {
  try {
    const response: { success: boolean } = yield call(modifySubscription, action.payload.action);
    yield put(modifySubscriptionAction.success({ success: response.success }));

    // Refresh pricing summary to reflect the cancellation
    yield put(getSubscriptionSummaryAction.request());
    yield put(fetchCurrentUserAction.request());

    if (action.payload.action === 'cancel') {
      window.location.href = '/info?type=subscription-cancelled';
    }
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to modify subscription';
    yield put(modifySubscriptionAction.failure({ message }));
  }
}

function* handleCancelRemoval() {
  try {
    const response: { success: boolean } = yield call(cancelRemoval);
    yield put(cancelRemovalAction.success({ success: response.success }));
    
    // Refresh pricing summary to reflect the cancellation
    yield put(getSubscriptionSummaryAction.request());
    
    // Redirect to success page
    window.location.href = '/info?type=cancel-removal-success';
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to cancel removal';
    yield put(cancelRemovalAction.failure({ message }));
  }
}

// SMS Saga Handlers
function* handleGetSmsBalance() {
  try {
    const response: SmsBalanceResponse = yield call(getSmsBalance);
    yield put(getSmsBalanceAction.success({ balance: response.data }));
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to fetch SMS balance';
    yield put(getSmsBalanceAction.failure({ message }));
  }
}

function* handleGetSmsPackages() {
  try {
    const response: SmsPackagesResponse = yield call(getSmsPackages);
    yield put(getSmsPackagesAction.success({ packages: response.data }));
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to fetch SMS packages';
    yield put(getSmsPackagesAction.failure({ message }));
  }
}

function* handleCreateSmsCheckout(action: ReturnType<typeof createSmsCheckoutAction.request>) {
  try {
    const response: SmsCheckoutResponse = yield call(createSmsCheckout, action.payload);
    yield put(createSmsCheckoutAction.success(response));
    
    // Redirect to Stripe Checkout
    if (response.url) {
      window.location.href = response.url;
    }
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to create SMS checkout';
    yield put(createSmsCheckoutAction.failure({ message }));
  }
}

function* handleGetSmsPurchases(action: ReturnType<typeof getSmsPurchasesAction.request>) {
  try {
    const params = action.payload || {};
    const response: SmsPurchasesResponse = yield call(getSmsPurchases, params);
    yield put(getSmsPurchasesAction.success({ 
      purchases: response.data, 
      hasMore: response.hasMore,
      nextCursor: response.nextCursor 
    }));
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to fetch SMS purchases';
    yield put(getSmsPurchasesAction.failure({ message }));
  }
}

export function* settingsSaga() {
  yield all([
    takeLatest(getSubscriptionSummaryAction.request, handleGetSubscriptionSummary),
    takeLatest(createCheckoutSessionAction.request, handleCreateCheckoutSession),
    takeLatest(getCustomerPortalUrlAction.request, handleGetCustomerPortalUrl),
    takeLatest(modifySubscriptionAction.request, handleModifySubscription),
    takeLatest(cancelRemovalAction.request, handleCancelRemoval),
    // SMS Sagas
    takeLatest(getSmsBalanceAction.request, handleGetSmsBalance),
    takeLatest(getSmsPackagesAction.request, handleGetSmsPackages),
    takeLatest(createSmsCheckoutAction.request, handleCreateSmsCheckout),
    takeLatest(getSmsPurchasesAction.request, handleGetSmsPurchases),
  ]);
}
