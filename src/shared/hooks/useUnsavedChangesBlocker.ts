import { useCallback, useEffect, useRef, useState } from "react";
import { useBlocker } from "react-router-dom";
import { isNativeApp } from "../../app/config/env";

type GuardedAction = () => void;
type ExternalGuard = (action: GuardedAction) => boolean;

const externalGuards = new Set<ExternalGuard>();

/**
 * Runs an application-level action (for example logout) through the same unresolved-work
 * guard used by router navigation. The most recently mounted active editor gets first refusal.
 * Returns true when the action ran immediately and false when a guard deferred it.
 */
export function requestGuardedUnsavedAction(action: GuardedAction): boolean {
  const guards = Array.from(externalGuards).reverse();
  for (const guard of guards) {
    if (guard(action)) return false;
  }
  action();
  return true;
}

interface UseUnsavedChangesBlockerOptions {
  /** Block internal navigation while true. */
  when: boolean;
  /** Resume an already blocked navigation only once the caller's save is complete. */
  proceedWhen?: boolean;
}

/**
 * Route-aware unsaved-changes guard (requires the app's data router).
 *
 * Internal navigation: useBlocker intercepts the transition while `when` is true; the caller
 * renders the dashboard's standard confirmation dialog from `isBlocked` and resolves it with
 * `stay()` (keep the draft and URL) or `discard()` (caller resets local state first, then the
 * blocked transition proceeds). A save that lands while blocked auto-retries the intended
 * navigation via `proceed()` — see the effect below.
 *
 * Browser close/refresh: the native beforeunload prompt, same condition.
 *
 * Replaces the document-level click interception (text/class matching) previously used by
 * Marketplace/My Profile — reuse this hook there rather than keeping two systems.
 */
export function useUnsavedChangesBlocker({ when, proceedWhen = !when }: UseUnsavedChangesBlockerOptions) {
  const shouldBlock = when;
  const pendingExternalActionRef = useRef<GuardedAction | null>(null);
  const [externalActionBlocked, setExternalActionBlocked] = useState(false);

  const blocker = useBlocker(
    useCallback(
      ({
        currentLocation,
        nextLocation,
      }: {
        currentLocation: { pathname: string; search?: string; hash?: string };
        nextLocation: { pathname: string; search?: string; hash?: string };
      }) =>
        shouldBlock &&
        (
          currentLocation.pathname !== nextLocation.pathname ||
          currentLocation.search !== nextLocation.search ||
          currentLocation.hash !== nextLocation.hash
        ),
      [shouldBlock],
    ),
  );

  // A successful save (dirty -> clean) while the dialog is up retries the user's intended navigation.
  // `proceedWhen` is separate from `when`: a save in flight should stop new interception without
  // treating an in-progress request as a successful save.
  useEffect(() => {
    if (blocker.state === "blocked" && proceedWhen) {
      blocker.proceed();
    }
  }, [blocker, proceedWhen]);

  useEffect(() => {
    if (!shouldBlock) return;
    const guard: ExternalGuard = (action) => {
      pendingExternalActionRef.current = action;
      setExternalActionBlocked(true);
      return true;
    };
    externalGuards.add(guard);
    return () => {
      externalGuards.delete(guard);
    };
  }, [shouldBlock]);

  // Match router behavior: if the unresolved work saves successfully while the dialog is
  // open, continue the originally requested application action.
  useEffect(() => {
    if (!externalActionBlocked || !proceedWhen) return;
    const frame = window.requestAnimationFrame(() => {
      const action = pendingExternalActionRef.current;
      pendingExternalActionRef.current = null;
      setExternalActionBlocked(false);
      action?.();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [externalActionBlocked, proceedWhen]);

  // Browser close/refresh uses the native prompt. Skipped in the native app: there is no
  // tab to close or refresh there, the router blocker above already covers every in-app
  // navigation (incl. the Android back gesture), and the WebView renders beforeunload as an
  // unstyleable system alert.
  useEffect(() => {
    if (!shouldBlock || isNativeApp()) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldBlock]);

  return {
    isBlocked: blocker.state === "blocked" || externalActionBlocked,
    /** Keep the draft and URL unchanged. */
    stay: () => {
      if (blocker.state === "blocked") blocker.reset();
      pendingExternalActionRef.current = null;
      setExternalActionBlocked(false);
    },
    /** Caller resets local state to the server baseline BEFORE calling this. */
    discard: () => {
      if (blocker.state === "blocked") {
        blocker.proceed();
      }
      const action = pendingExternalActionRef.current;
      pendingExternalActionRef.current = null;
      setExternalActionBlocked(false);
      action?.();
    },
  };
}
