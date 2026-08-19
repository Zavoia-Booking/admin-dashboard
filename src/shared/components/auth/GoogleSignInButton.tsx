import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/button";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { googleLoginAction, googleRegisterAction } from "../../../features/auth/actions";
import { selectAuthIsLoading } from "../../../features/auth/selectors";
import { useGoogleLogin } from "@react-oauth/google";
import { getGoogleRedirectUri, setOauthContext } from "../../lib/oauth.ts";
import { nativeGoogleSignIn, isNativeGoogleCancel } from "../../../features/auth/lib/nativeGoogleAuth";
import { usePlatform } from "../../hooks/usePlatform";
import { useTranslation } from "react-i18next";
import { Spinner } from "../ui/spinner";

type GoogleSignInButtonProps = {
  context: 'login' | 'register';
  disabled?: boolean;
  className?: string;
  /** Called before the OAuth redirect starts; return false to block it (e.g. required terms checkbox not ticked). */
  onBeforeStart?: () => boolean;
};

export function GoogleSignInButton({ context, disabled, className, onBeforeStart }: GoogleSignInButtonProps) {
  const { t } = useTranslation('auth');
  const dispatch = useDispatch();
  const { isNative } = usePlatform();
  const [nativeBusy, setNativeBusy] = useState(false);
  // Keeps the blocking overlay up after the account picker resolves, while the
  // saga is talking to the backend (login / funnel email / collision modal).
  const [nativeAwaitingAuth, setNativeAwaitingAuth] = useState(false);
  const authIsLoading = useSelector(selectAuthIsLoading);
  const redirectUri = getGoogleRedirectUri();

  useEffect(() => {
    if (nativeAwaitingAuth && !nativeBusy && !authIsLoading) {
      setNativeAwaitingAuth(false);
    }
  }, [nativeAwaitingAuth, nativeBusy, authIsLoading]);

  const googleLogin = useGoogleLogin({
    onSuccess: (codeResponse) => {
      try { setOauthContext(context); } catch {}
      if (context === 'register') {
        dispatch(googleRegisterAction.request({ code: codeResponse.code, redirectUri }))
      } else {
        dispatch(googleLoginAction.request({ code: codeResponse.code, redirectUri }))
      }
    },
    onError: (error) => {
      console.error('Google OAuth Error:', error)
    },
    flow: 'auth-code',
    ux_mode: 'redirect',
    redirect_uri: redirectUri,
  })

  // The webview can't run Google's web OAuth (disallowed_useragent), so native
  // uses the on-device account picker and posts the ID token instead.
  const startNativeSignIn = async () => {
    setNativeBusy(true);
    try {
      const { idToken } = await nativeGoogleSignIn();
      setNativeAwaitingAuth(true);
      if (context === 'register') {
        dispatch(googleRegisterAction.request({ idToken }));
      } else {
        dispatch(googleLoginAction.request({ idToken }));
      }
    } catch (error) {
      if (!isNativeGoogleCancel(error)) {
        console.error('Native Google sign-in error:', error);
        toast.error(t('google.nativeError'));
      }
    } finally {
      setNativeBusy(false);
    }
  };

  // Full-screen click shield while the native flow is in progress — the page
  // must not be interactable between picking an account and the auth outcome.
  const nativeOverlay = (nativeBusy || nativeAwaitingAuth) && createPortal(
    <div
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <Spinner size="lg" color="info" />
      <p className="text-sm font-medium text-foreground-2">{t('google.connecting')}</p>
    </div>,
    document.body,
  );

  return (
    <>
    {nativeOverlay}
    <Button
      variant="outline"
      rounded="full"
      type="button"
      onClick={() => {
        if (onBeforeStart && !onBeforeStart()) return;
        if (isNative) {
          void startNativeSignIn();
          return;
        }
        try {
          setOauthContext(context);
        } catch {}
        googleLogin();
      }}
      disabled={disabled || nativeBusy}
      className={"w-full bg-surface text-foreground-1 border-border hover:bg-surface-hover flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" + (className ? ` ${className}` : '')}
    >
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {t('google.label')}
    </Button>
    </>
  )
}

export default GoogleSignInButton;
