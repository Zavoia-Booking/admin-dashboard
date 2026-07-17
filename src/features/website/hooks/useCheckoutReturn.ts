import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getWebsiteCheckoutStatusApi } from "../api";
import {
  fetchWebsiteVariantCatalogAction,
  removeSectionFromCartAction,
  removeThemeAssetFromCartAction,
  removeVariantFromCartAction,
} from "../actions";
import type { WebsiteCheckoutStatusResponse } from "../types";
import { selectBusinessId } from "../../auth/selectors";
import {
  selectWebsiteCatalogLoading,
  selectWebsiteCatalogError,
  selectWebsiteSectionCatalog,
  selectWebsiteThemeAssetCatalog,
  selectWebsiteVariantCatalog,
} from "../selectors";
import {
  clearWebsiteCheckoutIntent,
  parseWebsiteCheckoutReturnContext,
  reconcileWebsiteCheckoutIntent,
  WEBSITE_CHECKOUT_CONTEXT_PARAM,
  type ReconciledCheckoutIntent,
  type WebsiteCheckoutReturnContext,
} from "../checkoutIntent";

/** Bounded backoff: ~45s total before giving up on webhook delivery. */
const POLL_DELAYS_MS = [1000, 2000, 3000, 5000, 8000, 12000, 15000];
const RETURN_BUSINESS_ID_PARAM = "website_business_id";

export type CheckoutReturnState =
  | "idle"
  | "pending"
  | "reconciling"
  | "completed"
  | "partial"
  | "failed"
  | "cancelled"
  | "timeout"
  | "unavailable"
  | "business-mismatch";

export interface CheckoutReturnResult {
  state: CheckoutReturnState;
  blocksNewCheckout: boolean;
  returnBusinessMismatch: boolean;
  resumePublishReview: boolean;
  consumePublishReviewResume: () => void;
  retry: () => void;
}

interface ConfirmedCheckoutOwnership {
  businessId: string;
  variantIds: Set<number>;
  sectionIds: Set<number>;
  themeAssetIds: Set<number>;
}

function confirmedOwnership(status: WebsiteCheckoutStatusResponse) {
  return {
    variantIds: new Set([
      ...(status.ownedVariantIds ?? []),
      ...status.variants.filter((item) => item.owned).map((item) => item.variantId),
    ]),
    sectionIds: new Set([
      ...(status.ownedSectionIds ?? []),
      ...status.sections.filter((item) => item.owned).map((item) => item.sectionId),
    ]),
    themeAssetIds: new Set([
      ...(status.ownedThemeAssetIds ?? []),
      ...(status.themeAssets ?? [])
        .filter((item) => item.owned)
        .map((item) => item.themeAssetId),
    ]),
  };
}

function isRequestCancelled(error: unknown): boolean {
  const value = error as { code?: unknown; name?: unknown };
  return value.code === "ERR_CANCELED" || value.name === "CanceledError";
}

/** Status polling retries network/server failures; authenticated client errors are terminal. */
function isTerminalStatusError(error: unknown): boolean {
  const status = (error as { response?: { status?: unknown } })?.response?.status;
  return typeof status === "number" && status >= 400 && status < 500 && status !== 408 && status !== 429;
}

function isOwnerScopedSessionNotFound(error: unknown): boolean {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  const codes = Array.isArray(message) ? message : [message];
  return codes.includes("WEBSITE_VARIANTS.E15");
}

/**
 * Return-from-Stripe reconciliation for /website?session_id=…
 *
 * Ownership lands via webhook, which can trail the redirect — so the page polls the
 * owner-scoped checkout-status endpoint with bounded backoff until completion, failure,
 * or timeout, then refetches the catalog. It removes only item ids whose ownership the
 * server confirms; cancellation (?variantPurchase=cancelled) and delayed webhooks keep
 * the cart intact.
 * All timers and in-flight polling stop on unmount.
 */
export function useCheckoutReturn(options?: {
  onReconcileSelections?: (
    selections: Pick<
      ReconciledCheckoutIntent,
      "variantSelections" | "themeSelections"
    >,
    returnContext: WebsiteCheckoutReturnContext | null,
  ) => void;
}): CheckoutReturnResult {
  const onReconcileSelections = options?.onReconcileSelections;
  const { t } = useTranslation("website");
  const dispatch = useDispatch();
  const businessId = useSelector(selectBusinessId);
  const variantCatalog = useSelector(selectWebsiteVariantCatalog);
  const sectionCatalog = useSelector(selectWebsiteSectionCatalog);
  const themeAssetCatalog = useSelector(selectWebsiteThemeAssetCatalog);
  const isCatalogLoading = useSelector(selectWebsiteCatalogLoading);
  const catalogError = useSelector(selectWebsiteCatalogError);
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<CheckoutReturnState>("idle");
  const [resumePublishReview, setResumePublishReview] = useState(false);
  const [pollRetryRevision, setPollRetryRevision] = useState(0);
  const [confirmedProofBusinessId, setConfirmedProofBusinessId] = useState<string | null>(null);
  const settledSessionRef = useRef<string | null>(null);
  const handledCancellationRef = useRef(false);
  const confirmedOwnershipRef = useRef<ConfirmedCheckoutOwnership | null>(null);
  const confirmedResultRef = useRef<"completed" | "partial" | null>(null);
  const catalogReconcileAttemptsRef = useRef(0);
  const catalogRecoveryAnnouncedRef = useRef(false);

  const sessionId = searchParams.get("session_id");
  const checkoutCancelled = searchParams.get("variantPurchase") === "cancelled";
  const returnContext = parseWebsiteCheckoutReturnContext(
    searchParams.get(WEBSITE_CHECKOUT_CONTEXT_PARAM),
  );
  // This marker is written into the checkout return URL and never inferred from mutable
  // client state. It is removed only with the rest of a correctly scoped terminal return.
  const returnBusinessId = searchParams.get(RETURN_BUSINESS_ID_PARAM);
  const activeBusinessId = businessId == null ? null : String(businessId);
  const hasReturnFlowMarker = !!sessionId || checkoutCancelled;
  const returnBusinessMismatch =
    hasReturnFlowMarker &&
    returnBusinessId !== null &&
    activeBusinessId !== null &&
    returnBusinessId !== activeBusinessId;
  const stripReturnMarker = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("session_id");
    next.delete("variantPurchase");
    next.delete(RETURN_BUSINESS_ID_PARAM);
    next.delete(WEBSITE_CHECKOUT_CONTEXT_PARAM);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const stripReturnContext = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    if (!next.has(WEBSITE_CHECKOUT_CONTEXT_PARAM)) return;
    next.delete(WEBSITE_CHECKOUT_CONTEXT_PARAM);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const consumePublishReviewResume = useCallback(() => {
    setResumePublishReview(false);
  }, []);

  const retry = useCallback(() => {
    if (businessId == null || returnBusinessMismatch) return;

    catalogReconcileAttemptsRef.current = 0;
    catalogRecoveryAnnouncedRef.current = false;
    const ownership = confirmedOwnershipRef.current;
    if (ownership) {
      if (ownership.businessId !== String(businessId)) return;
      setState("reconciling");
      dispatch(fetchWebsiteVariantCatalogAction.request());
      return;
    }

    if (!sessionId) return;
    confirmedResultRef.current = null;
    settledSessionRef.current = null;
    setState("pending");
    setPollRetryRevision((current) => current + 1);
  }, [businessId, dispatch, returnBusinessMismatch, sessionId]);

  useEffect(() => {
    if (!returnBusinessMismatch) return;
    toast.error(t("page.checkoutReturn.businessMismatch"), {
      id: "website-checkout-return-business-mismatch",
    });
  }, [returnBusinessMismatch, t]);

  useEffect(() => {
    if (
      !checkoutCancelled ||
      sessionId ||
      businessId == null ||
      returnBusinessMismatch
    ) {
      if (!checkoutCancelled) handledCancellationRef.current = false;
      return;
    }
    if (handledCancellationRef.current) return;

    handledCancellationRef.current = true;
    setState("cancelled");
    confirmedOwnershipRef.current = null;
    confirmedResultRef.current = null;
    setConfirmedProofBusinessId(null);
    // Legacy cancellation URLs did not identify their originating business. Preserve every
    // business-scoped intent in that case rather than deleting whichever business happens to be
    // active when the user returns; the cart remains intact and the next checkout replaces it.
    if (returnBusinessId !== null) clearWebsiteCheckoutIntent(businessId);
    toast.info(t("page.toasts.purchaseCancelled"));
    stripReturnMarker();
  }, [
    businessId,
    checkoutCancelled,
    returnBusinessMismatch,
    returnBusinessId,
    sessionId,
    stripReturnMarker,
    t,
  ]);

  useEffect(() => {
    // Reconciliation is business-scoped. Waiting for auth hydration prevents a terminal
    // status from being recorded without a business key and then becoming unrecoverable.
    // A scoped return never polls under a different active business.
    if (
      !sessionId ||
      businessId == null ||
      returnBusinessMismatch ||
      settledSessionRef.current === sessionId
    ) {
      return;
    }

    let cancelled = false;
    let finished = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let requestController: AbortController | null = null;
    setState("pending");

    const removeConfirmedItems = (status: WebsiteCheckoutStatusResponse) => {
      const ownership = confirmedOwnership(status);
      ownership.variantIds.forEach((id) => dispatch(removeVariantFromCartAction(id)));
      ownership.sectionIds.forEach((id) => dispatch(removeSectionFromCartAction(id)));
      ownership.themeAssetIds.forEach((id) => dispatch(removeThemeAssetFromCartAction(id)));
    };

    const finish = (result: CheckoutReturnState, status?: WebsiteCheckoutStatusResponse) => {
      if (cancelled || finished) return;
      finished = true;
      if (result !== "business-mismatch") settledSessionRef.current = sessionId;
      const needsCatalogProof = result === "completed" || result === "partial";
      setState(needsCatalogProof ? "reconciling" : result);
      if (status) removeConfirmedItems(status);
      if (status) {
        if (needsCatalogProof && businessId != null) {
          const ownership = confirmedOwnership(status);
          confirmedOwnershipRef.current = {
            businessId: String(businessId),
            variantIds: ownership.variantIds,
            sectionIds: ownership.sectionIds,
            themeAssetIds: ownership.themeAssetIds,
          };
          setConfirmedProofBusinessId(String(businessId));
          confirmedResultRef.current = result;
          catalogReconcileAttemptsRef.current = 0;
          catalogRecoveryAnnouncedRef.current = false;
        } else if (result === "failed") {
          confirmedOwnershipRef.current = null;
          setConfirmedProofBusinessId(null);
          clearWebsiteCheckoutIntent(businessId);
        }
        dispatch(fetchWebsiteVariantCatalogAction.request());
      }
      if (result === "failed") {
        toast.error(t("page.toasts.purchaseFailed"));
      } else if (result === "business-mismatch") {
        // Markerless sessions created by the previous frontend cannot reveal their business
        // safely. Keep the session marker and let a business switch re-run this owner-scoped poll.
        return;
      } else if (result === "timeout") {
        toast.info(t("page.toasts.purchasePending"), {
          action: {
            label: t("page.checkoutReturn.retry"),
            onClick: retry,
          },
        });
        return;
      } else if (result === "unavailable") {
        toast.error(t("page.toasts.purchaseStatusUnavailable"));
      }
      // Successful/partial returns retain the marker until the refreshed catalog has
      // proved every status-confirmed intended selection. A refresh can then safely retry
      // reconciliation instead of losing intent between the status response and catalog.
      if (result !== "completed" && result !== "partial") stripReturnMarker();
    };

    const poll = async (attempt: number) => {
      if (cancelled || finished) return;
      requestController = new AbortController();
      try {
        const status = await getWebsiteCheckoutStatusApi(sessionId, { signal: requestController.signal });
        if (cancelled || finished) return;
        if (status.status === "completed") return finish("completed", status);
        if (status.status === "partial") return finish("partial", status);
        if (status.status === "failed" || status.status === "expired") {
          return finish("failed", status);
        }
        // still pending — keep polling
      } catch (error) {
        if (cancelled || isRequestCancelled(error)) return;
        if (returnBusinessId === null && isOwnerScopedSessionNotFound(error)) {
          return finish("business-mismatch");
        }
        if (isTerminalStatusError(error)) return finish("unavailable");
        // Network and 5xx failures can race webhook delivery; consume retry budget.
      } finally {
        requestController = null;
      }
      if (attempt >= POLL_DELAYS_MS.length) return finish("timeout");
      timer = setTimeout(() => void poll(attempt + 1), POLL_DELAYS_MS[attempt]);
    };

    void poll(0);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      requestController?.abort();
    };
  }, [
    businessId,
    dispatch,
    pollRetryRevision,
    returnBusinessMismatch,
    returnBusinessId,
    retry,
    sessionId,
    stripReturnMarker,
    t,
  ]);

  // The checkout status is necessary but not sufficient: wait until the catalog refetch
  // settles and independently reports ownership for this business before applying intent.
  useEffect(() => {
    const ownership = confirmedOwnershipRef.current;
    if (
      !ownership ||
      businessId == null ||
      ownership.businessId !== String(businessId) ||
      returnBusinessMismatch ||
      isCatalogLoading
    ) {
      return;
    }

    if (catalogError) {
      if (catalogReconcileAttemptsRef.current >= 3) {
        setState("unavailable");
        if (!catalogRecoveryAnnouncedRef.current) {
          catalogRecoveryAnnouncedRef.current = true;
          toast.error(t("page.toasts.purchaseStatusUnavailable"), {
            action: {
              label: t("page.checkoutReturn.retry"),
              onClick: retry,
            },
          });
        }
        // Keep the confirmed ownership proof and URL markers. retry() performs another
        // authoritative catalog read; a full reload remains a safe fallback.
        return;
      }
      catalogReconcileAttemptsRef.current += 1;
      const timer = window.setTimeout(() => {
        dispatch(fetchWebsiteVariantCatalogAction.request());
      }, 1500 * catalogReconcileAttemptsRef.current);
      return () => window.clearTimeout(timer);
    }

    const reconciled = reconcileWebsiteCheckoutIntent({
      businessId,
      ownedVariantIds: ownership.variantIds,
      ownedSectionIds: ownership.sectionIds,
      ownedThemeAssetIds: ownership.themeAssetIds,
      variantCatalog,
      sectionCatalog,
      themeAssetCatalog,
    });
    const settleConfirmedReturn = ({
      preserveReturnMarker = false,
    }: { preserveReturnMarker?: boolean } = {}) => {
      const result = confirmedResultRef.current;
      if (!result) return;
      setState(result);
      if (returnContext === "publish-review") {
        setResumePublishReview(true);
      }
      toast.success(
        t(result === "completed" ? "page.toasts.purchaseCompleted" : "page.toasts.purchasePartial"),
      );
      confirmedOwnershipRef.current = null;
      confirmedResultRef.current = null;
      setConfirmedProofBusinessId(null);
      catalogReconcileAttemptsRef.current = 0;
      catalogRecoveryAnnouncedRef.current = false;
      if (preserveReturnMarker) {
        stripReturnContext();
      } else {
        stripReturnMarker();
      }
    };

    if (!reconciled) {
      // A checkout can contain no preview-only selection intent. The refreshed catalog is
      // still the second proof; once it settles, the return may complete normally.
      settleConfirmedReturn();
      return;
    }
    if (
      reconciled.variantSelections.length > 0 ||
      reconciled.themeSelections.length > 0
    ) {
      // Apply the complete, independently proved checkout selection as one transaction.
      // Keeping variants and theme assets together lets the draft layer persist one exact
      // snapshot instead of racing separate React state updates/saves.
      onReconcileSelections?.({
        variantSelections: reconciled.variantSelections,
        themeSelections: reconciled.themeSelections,
      }, returnContext);
    }
    if (!reconciled.hasRemainingIntent) {
      settleConfirmedReturn();
      return;
    }
    if (!reconciled.hasUnresolvedConfirmedIntent) {
      // A partial status can leave checkout intent that neither proof declares owned. Keep
      // those rows in the cart plus the normalized v2 intent/URL markers. retry() re-polls
      // this session directly; the user can also start a new checkout for the unowned rows.
      settleConfirmedReturn({ preserveReturnMarker: true });
      return;
    }

    // Checkout status says owned but this catalog snapshot has not caught up yet. Retry a
    // bounded number of authoritative catalog reads before leaving a recoverable pending marker.
    if (catalogReconcileAttemptsRef.current >= 3) {
      setState("timeout");
      if (!catalogRecoveryAnnouncedRef.current) {
        catalogRecoveryAnnouncedRef.current = true;
        toast.info(t("page.toasts.purchasePending"), {
          action: {
            label: t("page.checkoutReturn.retry"),
            onClick: retry,
          },
        });
      }
      // Preserve the proof and URL markers. retry() refetches the catalog immediately;
      // reload remains a safe fallback.
      return;
    }
    catalogReconcileAttemptsRef.current += 1;
    const timer = window.setTimeout(() => {
      dispatch(fetchWebsiteVariantCatalogAction.request());
    }, 1500 * catalogReconcileAttemptsRef.current);
    return () => window.clearTimeout(timer);
  }, [
    businessId,
    catalogError,
    dispatch,
    isCatalogLoading,
    onReconcileSelections,
    returnBusinessMismatch,
    returnContext,
    retry,
    sectionCatalog,
    stripReturnContext,
    stripReturnMarker,
    t,
    themeAssetCatalog,
    variantCatalog,
  ]);

  const effectiveState: CheckoutReturnState = returnBusinessMismatch
    ? "business-mismatch"
    : state;
  const effectiveReturnBusinessMismatch =
    returnBusinessMismatch || effectiveState === "business-mismatch";
  const hasRetainedCatalogProof = confirmedProofBusinessId === activeBusinessId;
  const blocksNewCheckout =
    effectiveReturnBusinessMismatch ||
    effectiveState === "pending" ||
    effectiveState === "reconciling" ||
    effectiveState === "timeout" ||
    (effectiveState === "idle" && hasReturnFlowMarker) ||
    (effectiveState === "unavailable" && hasRetainedCatalogProof);

  return {
    state: effectiveState,
    blocksNewCheckout,
    returnBusinessMismatch: effectiveReturnBusinessMismatch,
    resumePublishReview,
    consumePublishReviewResume,
    retry,
  };
}
