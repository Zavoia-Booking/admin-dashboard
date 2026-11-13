import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { appleAuthAction } from "../../../features/auth/actions";
import { selectAuthIsLoading } from "../../../features/auth/selectors";
import type { AppleCredential } from "../../../features/auth/types";
import {
  appleSignIn,
  isAppleSignInAvailable,
  isAppleSignInCancel,
  prepareAppleSignIn,
} from "../../../features/auth/lib/appleAuth";
import { usePlatform } from "../../hooks/usePlatform";
import { cn } from "../../lib/utils";

/** Apple's logo, as Apple's sign-in button guidelines require. */
export function AppleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 814 1000" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"
      />
    </svg>
  );
}

type AppleSignInButtonProps = {
  /** The API intent for the default flow (POST /auth/apple). */
  context: 'login' | 'register';
  /** "Continue with Apple" or "Sign up with Apple"; defaults from `context`. */
  label?: 'continue' | 'signUp';
  disabled?: boolean;
  className?: string;
  /** Called before Apple opens; return false to block it (e.g. required terms checkbox not ticked). */
  onBeforeStart?: () => boolean;
  /** Web register opened from the iOS app's email: sent along with the register call. */
  welcomeToken?: string;
  /** Use the credential yourself instead of signing in (e.g. /link-business-account). */
  onCredential?: (credential: AppleCredential) => void | Promise<void>;
};

/**
 * Sign in with Apple: Apple's black button (white in dark mode, per Apple's
 * guidelines). Renders nothing on Android and on web builds without the Apple
 * Services ID / redirect URI.
 */
export function AppleSignInButton({
  context,
  label,
  disabled,
  className,
  onBeforeStart,
  welcomeToken,
  onCredential,
}: AppleSignInButtonProps) {
  const { t } = useTranslation('auth');
  const dispatch = useDispatch();
  const { isNative } = usePlatform();
  const available = isAppleSignInAvailable();
  const [busy, setBusy] = useState(false);
  // Keeps the native overlay up after the Apple sheet closes, while the saga
  // talks to the API (session / email / step modals).
  const [awaitingAuth, setAwaitingAuth] = useState(false);
  const authIsLoading = useSelector(selectAuthIsLoading);

  // Load Apple JS and prepare a nonce now, so the click can open Apple's
  // popup straight away (browsers block popups opened after a wait).
  useEffect(() => {
    if (!available) return;
    prepareAppleSignIn().catch((error) => {
      console.warn('Sign in with Apple could not be prepared:', error);
    });
  }, [available]);

  // The saga is done (the request reducer set isLoading synchronously on
  // dispatch): leave the awaiting state. Adjusted during render, no effect.
  if (awaitingAuth && !busy && !authIsLoading) {
    setAwaitingAuth(false);
  }

  if (!available) return null;

  const start = async () => {
    setBusy(true);
    try {
      const credential = await appleSignIn();
      if (onCredential) {
        await onCredential(credential);
        return;
      }
      setAwaitingAuth(true);
      dispatch(appleAuthAction.request({
        credential,
        intent: context,
        ...(welcomeToken ? { welcomeToken } : {}),
      }));
    } catch (error) {
      if (!isAppleSignInCancel(error)) {
        console.error('Sign in with Apple error:', error);
        toast.error(t('apple.error'));
      }
    } finally {
      setBusy(false);
    }
  };

  const text = (label ?? (context === 'register' ? 'signUp' : 'continue')) === 'signUp'
    ? t('apple.signUp')
    : t('apple.continue');

  // Native only, like Google: the page must not be usable between the Apple
  // sheet and the sign-in outcome.
  const nativeOverlay = isNative && (busy || awaitingAuth) && createPortal(
    <div
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <Spinner size="lg" color="info" />
      <p className="text-sm font-medium text-foreground-2">{t('apple.connecting')}</p>
    </div>,
    document.body,
  );

  return (
    <>
      {nativeOverlay}
      <Button
        type="button"
        rounded="full"
        onClick={() => {
          if (onBeforeStart && !onBeforeStart()) return;
          void start();
        }}
        disabled={disabled || busy}
        className={cn(
          "w-full flex items-center justify-center gap-2 cursor-pointer border border-black bg-black text-white shadow-xs",
          "hover:bg-neutral-800 hover:text-white",
          "dark:border-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 dark:hover:text-black",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        )}
      >
        <AppleLogo className="!h-[18px] !w-[18px] -mt-0.5" />
        {text}
      </Button>
    </>
  );
}

export default AppleSignInButton;
