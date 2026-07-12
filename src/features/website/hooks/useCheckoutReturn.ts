import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getWebsiteCheckoutStatusApi } from "../api";
import {
  fetchWebsiteVariantCatalogAction,
  removeSectionFromCartAction,
  removeVariantFromCartAction,
} from "../actions";
import type { WebsiteCheckoutStatusResponse } from "../types";

/** Bounded backoff: ~45s total before giving up on webhook delivery. */
const POLL_DELAYS_MS = [1000, 2000, 3000, 5000, 8000, 12000, 15000];

export type CheckoutReturnState =
  | "idle"
  | "pending"
  | "completed"
  | "partial"
  | "failed"
  | "cancelled"
  | "timeout"
  | "unavailable";

function isRequestCancelled(error: unknown): boolean {
  const value = error as { code?: unknown; name?: unknown };
  return value.code === "ERR_CANCELED" || value.name === "CanceledError";
}

/** Status polling retries network/server failures; authenticated client errors are terminal. */
function isTerminalStatusError(error: unknown): boolean {
  const status = (error as { response?: { status?: unknown } })?.response?.status;
  return typeof status === "number" && status >= 400 && status < 500 && status !== 408 && status !== 429;
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
export function useCheckoutReturn() {
  const { t } = useTranslation("website");
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<CheckoutReturnState>("idle");
  const settledSessionRef = useRef<string | null>(null);
  const handledCancellationRef = useRef(false);

  const sessionId = searchParams.get("session_id");
  const checkoutCancelled = searchParams.get("variantPurchase") === "cancelled";

  useEffect(() => {
    if (!checkoutCancelled || sessionId) {
      if (!checkoutCancelled) handledCancellationRef.current = false;
      return;
    }
    if (handledCancellationRef.current) return;

    handledCancellationRef.current = true;
    setState("cancelled");
    toast.info(t("page.toasts.purchaseCancelled"));
    const next = new URLSearchParams(searchParams);
    next.delete("variantPurchase");
    setSearchParams(next, { replace: true });
  }, [checkoutCancelled, searchParams, sessionId, setSearchParams, t]);

  useEffect(() => {
    if (!sessionId || settledSessionRef.current === sessionId) return;

    let cancelled = false;
    let finished = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let requestController: AbortController | null = null;
    setState("pending");

    const removeConfirmedItems = (status: WebsiteCheckoutStatusResponse) => {
      const ownedVariantIds = new Set([
        ...(status.ownedVariantIds ?? []),
        ...status.variants.filter((item) => item.owned).map((item) => item.variantId),
      ]);
      const ownedSectionIds = new Set([
        ...(status.ownedSectionIds ?? []),
        ...status.sections.filter((item) => item.owned).map((item) => item.sectionId),
      ]);
      ownedVariantIds.forEach((id) => dispatch(removeVariantFromCartAction(id)));
      ownedSectionIds.forEach((id) => dispatch(removeSectionFromCartAction(id)));
    };

    const stripReturnMarker = () => {
      const next = new URLSearchParams(searchParams);
      next.delete("session_id");
      next.delete("variantPurchase");
      setSearchParams(next, { replace: true });
    };

    const finish = (result: CheckoutReturnState, status?: WebsiteCheckoutStatusResponse) => {
      if (cancelled || finished) return;
      finished = true;
      settledSessionRef.current = sessionId;
      setState(result);
      if (status) removeConfirmedItems(status);
      if (status) dispatch(fetchWebsiteVariantCatalogAction.request());
      if (result === "completed") {
        toast.success(t("page.toasts.purchaseCompleted"));
      } else if (result === "partial") {
        toast.success(t("page.toasts.purchasePartial"));
      } else if (result === "failed") {
        toast.error(t("page.toasts.purchaseFailed"));
      } else if (result === "timeout") {
        toast.info(t("page.toasts.purchasePending"));
        return;
      } else if (result === "unavailable") {
        toast.error(t("page.toasts.purchaseStatusUnavailable"));
      }
      // A terminal result is safe to consume. Timeouts intentionally retain
      // the marker so a page refresh can reconcile a delayed webhook later.
      stripReturnMarker();
    };

    const poll = async (attempt: number) => {
      if (cancelled || finished) return;
      requestController = new AbortController();
      try {
        const status = await getWebsiteCheckoutStatusApi(sessionId, { signal: requestController.signal });
        if (cancelled || finished) return;
        if (status.status === "completed") return finish("completed", status);
        if (status.status === "partial") return finish("partial", status);
        if (status.status === "failed" || status.status === "refunded" || status.status === "expired") {
          return finish("failed", status);
        }
        // still pending — keep polling
      } catch (error) {
        if (cancelled || isRequestCancelled(error)) return;
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
  }, [dispatch, searchParams, sessionId, setSearchParams, t]);

  return state;
}
