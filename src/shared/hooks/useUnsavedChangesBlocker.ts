import { useCallback, useEffect } from "react";
import { useBlocker } from "react-router-dom";

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

  // Browser close/refresh uses the native prompt.
  useEffect(() => {
    if (!shouldBlock) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldBlock]);

  return {
    isBlocked: blocker.state === "blocked",
    /** Keep the draft and URL unchanged. */
    stay: () => {
      if (blocker.state === "blocked") blocker.reset();
    },
    /** Caller resets local state to the server baseline BEFORE calling this. */
    discard: () => {
      if (blocker.state === "blocked") blocker.proceed();
    },
  };
}
