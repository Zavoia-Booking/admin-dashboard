import { takeLatest, call, put, all } from "redux-saga/effects";
import {
  getSubscriptionSummaryAction,
  getPlansAction,
  createCheckoutSessionAction,
  getCustomerPortalUrlAction,
  modifySubscriptionAction,
  cancelRemovalAction,
  getSmsBalanceAction,
  getSmsPackagesAction,
  createSmsCheckoutAction,
  getSmsPurchasesAction,
  getBusinessInvoicesAction,
} from "./actions";
import {
  getSubscriptionSummary,
  getPlansList,
  createCheckoutSession,
  getCustomerPortalUrl,
  modifySubscription,
  cancelRemoval,
  getSmsBalance,
  getSmsPackages,
  createSmsCheckout,
  getSmsPurchases,
  getBusinessInvoices,
} from "./api";
import type {
  SubscriptionSummary,
  PlansListResponse,
  CheckoutResponse,
  SmsBalanceResponse,
  SmsPackagesResponse,
  SmsCheckoutResponse,
  SmsPurchasesResponse,
  BusinessInvoicesResponse,
} from "./types";
import { fetchCurrentUserAction } from "../auth/actions";
import { translateMessageCode } from "../../shared/utils/error";
import i18n from "../../shared/lib/i18n";

function extractMessage(error: any, fallback: string): string {
  const raw = error?.response?.data?.message;
  const translated = Array.isArray(raw)
    ? raw.map((m: string) => translateMessageCode(m)).join(' ')
    : translateMessageCode(raw ?? '');
  return translated || error?.message || fallback;
}

function* handleGetSubscriptionSummary() {
  try {
    const response: SubscriptionSummary = yield call(getSubscriptionSummary);
    yield put(getSubscriptionSummaryAction.success({ subscriptionSummary: response }));
  } catch (error: any) {
    const message = extractMessage(error, i18n.t('settings:page.errors.fetchPricingSummary'));
    yield put(getSubscriptionSummaryAction.failure({ message }));
  }
}

function* handleGetPlans() {
  try {
    const response: PlansListResponse = yield call(getPlansList);
    yield put(getPlansAction.success({ plans: response.plans }));
  } catch (error: any) {
    const message = extractMessage(error, i18n.t('settings:page.errors.fetchPlans'));
    yield put(getPlansAction.failure({ message }));
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
    const message = extractMessage(error, i18n.t('settings:page.errors.createCheckoutSession'));
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
    const message = extractMessage(error, i18n.t('settings:page.errors.getCustomerPortalUrl'));
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
    const message = extractMessage(error, i18n.t('settings:page.errors.modifySubscription'));
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
    const message = extractMessage(error, i18n.t('settings:page.errors.cancelRemoval'));
    yield put(cancelRemovalAction.failure({ message }));
  }
}

// SMS Saga Handlers
function* handleGetSmsBalance() {
  try {
    const response: SmsBalanceResponse = yield call(getSmsBalance);
    yield put(getSmsBalanceAction.success({ balance: response.data }));
  } catch (error: any) {
    const message = extractMessage(error, i18n.t('settings:page.errors.fetchSmsBalance'));
    yield put(getSmsBalanceAction.failure({ message }));
  }
}

function* handleGetSmsPackages() {
  try {
    const response: SmsPackagesResponse = yield call(getSmsPackages);
    yield put(getSmsPackagesAction.success({ packages: response.data }));
  } catch (error: any) {
    const message = extractMessage(error, i18n.t('settings:page.errors.fetchSmsPackages'));
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
    const message = extractMessage(error, i18n.t('settings:page.errors.createSmsCheckout'));
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
    const message = extractMessage(error, i18n.t('settings:page.errors.fetchSmsPurchases'));
    yield put(getSmsPurchasesAction.failure({ message }));
  }
}

function* handleGetBusinessInvoices(action: ReturnType<typeof getBusinessInvoicesAction.request>) {
  try {
    const params = action.payload || {};
    const append = !!(params && 'cursor' in params && params.cursor);
    const response: BusinessInvoicesResponse = yield call(getBusinessInvoices, params);
    yield put(getBusinessInvoicesAction.success({
      invoices: response.data,
      hasMore: response.hasMore,
      nextCursor: response.nextCursor,
      append,
    }));
  } catch (error: any) {
    const message = extractMessage(error, i18n.t('settings:page.errors.fetchInvoices'));
    yield put(getBusinessInvoicesAction.failure({ message }));
  }
}

export function* settingsSaga() {
  yield all([
    takeLatest(getSubscriptionSummaryAction.request, handleGetSubscriptionSummary),
    takeLatest(getPlansAction.request, handleGetPlans),
    takeLatest(createCheckoutSessionAction.request, handleCreateCheckoutSession),
    takeLatest(getCustomerPortalUrlAction.request, handleGetCustomerPortalUrl),
    takeLatest(modifySubscriptionAction.request, handleModifySubscription),
    takeLatest(cancelRemovalAction.request, handleCancelRemoval),
    // SMS Sagas
    takeLatest(getSmsBalanceAction.request, handleGetSmsBalance),
    takeLatest(getSmsPackagesAction.request, handleGetSmsPackages),
    takeLatest(createSmsCheckoutAction.request, handleCreateSmsCheckout),
    takeLatest(getSmsPurchasesAction.request, handleGetSmsPurchases),
    // Invoices
    takeLatest(getBusinessInvoicesAction.request, handleGetBusinessInvoices),
  ]);
}
