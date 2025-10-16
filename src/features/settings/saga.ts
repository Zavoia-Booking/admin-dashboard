import { takeLatest, call, put, all } from "redux-saga/effects";
import {
  getSubscriptionSummaryAction,
  createCheckoutSessionAction,
  getCustomerPortalUrlAction,
  cancelSubscriptionAction,
  cancelRemovalAction,
} from "./actions";
import {
  getSubscriptionSummary,
  createCheckoutSession,
  getCustomerPortalUrl,
  cancelSubscription,
  cancelRemoval,
} from "./api";
import type {
  SubscriptionSummary,
  CheckoutResponse,
} from "./types";

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

function* handleCancelSubscription() {
  try {
    const response: { success: boolean } = yield call(cancelSubscription);
    yield put(cancelSubscriptionAction.success({ success: response.success }));
    
    // Refresh pricing summary to reflect the cancellation
    yield put(getSubscriptionSummaryAction.request());
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to cancel subscription';
    yield put(cancelSubscriptionAction.failure({ message }));
  }
}

function* handleCancelRemoval() {
  try {
    const response: { success: boolean } = yield call(cancelRemoval);
    yield put(cancelRemovalAction.success({ success: response.success }));
    
    // Refresh pricing summary to reflect the cancellation
    yield put(getSubscriptionSummaryAction.request());
    
    // Redirect to success page
    window.location.href = '/cancel-removal-success';
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Failed to cancel removal';
    yield put(cancelRemovalAction.failure({ message }));
  }
}

export function* settingsSaga() {
  yield all([
    takeLatest(getSubscriptionSummaryAction.request, handleGetSubscriptionSummary),
    takeLatest(createCheckoutSessionAction.request, handleCreateCheckoutSession),
    takeLatest(getCustomerPortalUrlAction.request, handleGetCustomerPortalUrl),
    takeLatest(cancelSubscriptionAction.request, handleCancelSubscription),
    takeLatest(cancelRemovalAction.request, handleCancelRemoval),
  ]);
}
