import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { toast } from "sonner";
import {
  appleAuthAction,
  appleLinkSendCodeAction,
  appleLinkVerifyAction,
  appleProfileAction,
  closeAppleStep,
  fetchCurrentUserAction,
  googleNativeEmailSentAction,
  openAppleLinkStep,
  openAppleProfileStep,
  setAuthLoadingAction,
  setAuthUserAction,
  setCsrfToken,
  setTokensAction,
} from "./actions";
import { appleAuthApi, appleLinkSendCodeApi, appleLinkVerifyApi, appleProfileApi, getCurrentUserApi } from "./api";
import type { AppleAuthResponse, AppleLinkProof, AuthResponse, AuthUser } from "./types";
import { listLocationsAction } from "../locations/actions";
import type { RootState } from "../../app/providers/store";
import { tokenStorage } from "../../shared/lib/tokenStorage";
import { getErrorMessage } from "../../shared/utils/error";
import i18n from "../../shared/lib/i18n";

/**
 * Sign in with Apple, dashboard side. Every Apple answer that has the same
 * shape as an email/Google answer ends in the same state (business selector,
 * needs-owner modal, "register first" banner, native "check your inbox"); only
 * the name step and the "prove this account is yours" step are Apple's own.
 */

type ApiError = {
  response?: { status?: number; data?: { code?: string; details?: Record<string, any> } };
};

const errorStatus = (error: unknown) => (error as ApiError)?.response?.status;
const errorCode = (error: unknown): string | null => (error as ApiError)?.response?.data?.code ?? null;
const errorDetails = (error: unknown): Record<string, any> | undefined => (error as ApiError)?.response?.data?.details;

/** A session from any Apple endpoint: same storage and landing as Google. */
function* completeAppleSession(response: AuthResponse): Generator<any, void, any> {
  const user = response.user;
  // A new owner, or an owner who has not finished the setup wizard, lands on
  // /welcome; everyone else on their home route (as after the Google callback).
  const isRegistration = Boolean(response.isNewUser) || (user?.role === "owner" && !user?.wizardCompleted);

  yield put(appleAuthAction.success({
    accessToken: response.accessToken,
    csrfToken: response.csrfToken ?? null,
    user,
    isRegistration,
  }));
  yield put(setTokensAction({ accessToken: response.accessToken, csrfToken: response.csrfToken ?? null, refreshToken: response.refreshToken ?? null }));

  // Native apps get the refresh token in the body (x-native-app header).
  if (response.refreshToken) {
    yield call([tokenStorage, "saveRefreshToken"], response.refreshToken);
  }
  if (user?.businessId || user?.business?.id) {
    yield put(listLocationsAction.request());
  }
  if (response.csrfToken) {
    yield put(setCsrfToken({ csrfToken: response.csrfToken }));
  }

  // The sign-in response has no entitlements; /me does.
  try {
    const freshUser: AuthUser = yield call(getCurrentUserApi);
    yield put(setAuthUserAction({ user: freshUser }));
  } catch {
    yield put(fetchCurrentUserAction.request());
  }
}

/**
 * The sign-in outcomes Apple shares with email/Google, plus the two Apple
 * steps. Returns false when the error is none of them.
 */
function* routeAppleOutcome(error: unknown): Generator<any, boolean, any> {
  const status = errorStatus(error);
  const code = errorCode(error);
  const details = errorDetails(error) ?? {};

  if (status === 300 && code === "business_selection_required" && details.selectionToken) {
    yield put(closeAppleStep());
    yield put(appleAuthAction.failure({
      message: "business_selection_required",
      selectionToken: details.selectionToken,
      businesses: details.businesses ?? [],
    }));
    return true;
  }

  if (status === 409 && code === "account_exists_needs_business_owner_account") {
    yield put(closeAppleStep());
    yield put(appleAuthAction.failure({ message: code, accountLinkingDetails: details as any }));
    return true;
  }

  if (status === 409 && code === "apple_profile_required" && typeof details.tx_id === "string") {
    yield put(openAppleProfileStep({ txId: details.tx_id, email: details.email ?? null }));
    yield put(appleAuthAction.failure({ message: code }));
    return true;
  }

  if (status === 409 && code === "account_exists_unlinked_apple" && typeof details.tx_id === "string") {
    const proofs: AppleLinkProof[] = Array.isArray(details.proofs) && details.proofs.length > 0 ? details.proofs : ["email_code"];
    yield put(openAppleLinkStep({ txId: details.tx_id, email: details.email ?? "", proofs, codeSentTo: null }));
    yield put(appleAuthAction.failure({ message: code }));
    return true;
  }

  if (status === 404 && code === "account_not_found") {
    yield put(closeAppleStep());
    yield put(appleAuthAction.failure({ message: "account_not_found" }));
    return true;
  }

  return false;
}

function* handleAppleAuth(action: ReturnType<typeof appleAuthAction.request>): Generator<any, void, any> {
  try {
    yield put(setAuthLoadingAction({ isLoading: true }));
    const response: AppleAuthResponse = yield call(appleAuthApi, action.payload);

    // iOS register, new person: the "finish on the web" email went out.
    if ("outcome" in response && response.outcome === "email_sent") {
      yield put(googleNativeEmailSentAction({ email: response.email }));
      return;
    }
    yield call(completeAppleSession, response as AuthResponse);
  } catch (error) {
    const routed: boolean = yield call(routeAppleOutcome, error);
    if (!routed) {
      // pending invitation, invalid token, Apple unavailable, rate limit, …
      const message = getErrorMessage(error);
      yield put(appleAuthAction.failure({ message }));
      toast.error(message, { duration: 8000 });
    }
  } finally {
    yield put(setAuthLoadingAction({ isLoading: false }));
  }
}

/** Inline message for a failed Apple step (name or proof). */
function stepErrorMessage(error: unknown): string {
  switch (errorCode(error)) {
    case "apple_link_proof_invalid":
      return i18n.t("auth:appleLink.errors.proofInvalid");
    case "apple_step_expired":
      return i18n.t("auth:appleLink.errors.expired");
    case "apple_code_limit":
      return i18n.t("auth:appleLink.errors.codeLimit");
    default:
      return getErrorMessage(error);
  }
}

function* handleAppleProfile(action: ReturnType<typeof appleProfileAction.request>): Generator<any, void, any> {
  const step = yield select((s: RootState) => s.auth.appleProfileStep);
  if (!step?.txId) {
    yield put(appleProfileAction.failure({ code: "apple_step_expired", message: i18n.t("auth:appleLink.errors.expired") }));
    return;
  }
  try {
    const response: AuthResponse = yield call(appleProfileApi, { tx_id: step.txId, ...action.payload });
    yield put(appleProfileAction.success());
    yield put(closeAppleStep());
    yield call(completeAppleSession, response);
  } catch (error) {
    const routed: boolean = yield call(routeAppleOutcome, error);
    if (!routed) {
      yield put(appleProfileAction.failure({ code: errorCode(error), message: stepErrorMessage(error) }));
    }
  }
}

function* handleAppleLinkSendCode(): Generator<any, void, any> {
  const step = yield select((s: RootState) => s.auth.appleLinkStep);
  if (!step?.txId) {
    yield put(appleLinkSendCodeAction.failure({ code: "apple_step_expired", message: i18n.t("auth:appleLink.errors.expired") }));
    return;
  }
  try {
    const response: { email: string } = yield call(appleLinkSendCodeApi, { tx_id: step.txId });
    yield put(appleLinkSendCodeAction.success({ email: response.email || step.email }));
  } catch (error) {
    yield put(appleLinkSendCodeAction.failure({ code: errorCode(error), message: stepErrorMessage(error) }));
  }
}

function* handleAppleLinkVerify(action: ReturnType<typeof appleLinkVerifyAction.request>): Generator<any, void, any> {
  const step = yield select((s: RootState) => s.auth.appleLinkStep);
  if (!step?.txId) {
    yield put(appleLinkVerifyAction.failure({ code: "apple_step_expired", message: i18n.t("auth:appleLink.errors.expired") }));
    return;
  }
  try {
    const response: AuthResponse = yield call(appleLinkVerifyApi, { tx_id: step.txId, ...action.payload });
    yield put(appleLinkVerifyAction.success());
    yield put(closeAppleStep());
    yield call(completeAppleSession, response);
  } catch (error) {
    // Linked, then the usual sign-in decision: business selector or needs-owner.
    const routed: boolean = yield call(routeAppleOutcome, error);
    if (!routed) {
      yield put(appleLinkVerifyAction.failure({ code: errorCode(error), message: stepErrorMessage(error) }));
    }
  }
}

export function* appleAuthSaga(): Generator<any, void, any> {
  yield all([
    takeLatest(appleAuthAction.request, handleAppleAuth),
    takeLatest(appleProfileAction.request, handleAppleProfile),
    takeLatest(appleLinkSendCodeAction.request, handleAppleLinkSendCode),
    takeLatest(appleLinkVerifyAction.request, handleAppleLinkVerify),
  ]);
}
