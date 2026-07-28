import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../app/providers/store";
import { closeAccountLinkingModal, reauthForLinkAction } from "../actions";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, AlertCircle } from "lucide-react";
import { cn } from "../../../shared/lib/utils";
import {
  modalScrim,
  modalPanelLarge,
  modalEyebrow,
  modalTitleCompact,
  modalBody,
  modalCancel,
} from "../../../shared/components/ui/modal-tokens";
import CredentialsForm from "../../../shared/components/auth/CredentialsForm";
import { useLocation, useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export default function AccountLinkingModal() {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const dispatch = useDispatch();
  const open = useSelector((s: RootState) => (s as any).auth.isAccountLinkingModalOpen);
  const isLinking = useSelector((s: RootState) => (s as any).auth.linkingLoading) as boolean | undefined;
  const linkingError = useSelector((s: RootState) => (s as any).auth.linkingError) as string | null | undefined;
  const linkingErrorCode = useSelector((s: RootState) => (s as any).auth.linkingErrorCode) as string | null | undefined;
  const pendingLinkEmail = useSelector((s: RootState) => (s as any).auth.pendingLinkEmail) as string | null | undefined;
  const navigate = useNavigate();
  const location = useLocation();

  const handleCancel = useCallback(() => {
    dispatch(closeAccountLinkingModal());
    let returnTo: string | null = null;
    let context: string | null = null;
    try {
      returnTo = sessionStorage.getItem('oauthReturnTo');
      context = sessionStorage.getItem('oauthContext');
      sessionStorage.removeItem('oauthMode');
      sessionStorage.removeItem('oauthReturnTo');
      sessionStorage.removeItem('oauthLastCode');
      sessionStorage.removeItem('linkContext');
      sessionStorage.removeItem('oauthContext');
    } catch {
      /* sessionStorage unavailable */
    }
    if (location.pathname === '/auth/callback') {
      const fallback = returnTo || (context === 'register' ? '/register' : '/login');
      navigate(fallback, { replace: true });
    }
  }, [dispatch, location.pathname, navigate]);

  if (!open) return null;

  // The tx pins which account is being linked, so failures map to a small,
  // known set of causes - translate them into actionable messages instead of
  // surfacing raw backend codes.
  const sessionExpired = linkingErrorCode === 'SYSTEM.E08';
  let displayError: string | null = null;
  if (linkingError) {
    if (linkingErrorCode === 'link_email_mismatch' || linkingErrorCode === 'AUTH.E30') {
      displayError = pendingLinkEmail
        ? t('accountLinking.errors.wrongAccountWithEmail', { email: pendingLinkEmail })
        : t('accountLinking.errors.wrongAccount');
    } else if (linkingErrorCode === 'AUTH.E12') {
      displayError = t('accountLinking.errors.invalidCredentials');
    } else if (sessionExpired) {
      displayError = t('accountLinking.errors.sessionExpired');
    } else if (linkingErrorCode === 'AUTH.E23') {
      displayError = t('accountLinking.errors.verificationFailed');
    } else {
      displayError = linkingError;
    }
  }

  return (
    <DialogPrimitive.Root open onOpenChange={(isOpen) => { if (!isOpen && !isLinking) handleCancel(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={modalScrim} />
        <DialogPrimitive.Content className={cn(modalPanelLarge, "text-left")}>
          <div className={cn(modalEyebrow, "pr-8")}>{t('accountLinking.eyebrow')}</div>
          <DialogPrimitive.Title className={cn(modalTitleCompact, "pr-8")}>
            {t('accountLinking.title')}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description asChild>
            <p className={cn(modalBody, "mt-3")}>{t('accountLinking.description')}</p>
          </DialogPrimitive.Description>

          {displayError && (
            <p
              className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-error-bg px-3 py-2.5 text-[13px] text-destructive"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{displayError}</span>
            </p>
          )}

          <CredentialsForm
            className="mt-6"
            onSubmit={({ email, password }) => {
              dispatch(reauthForLinkAction.request({ email, password }));
            }}
            defaultEmail={pendingLinkEmail ?? undefined}
            emailReadOnly={!!pendingLinkEmail}
            autoFocusField={pendingLinkEmail ? 'password' : 'email'}
            submitLabel={t('accountLinking.submitLabel')}
            isLoading={!!isLinking || sessionExpired}
          />

          <button
            type="button"
            onClick={handleCancel}
            disabled={!!isLinking}
            className={cn(modalCancel, "mt-3 w-full")}
          >
            {t('accountLinking.cancel')}
          </button>

          {/* Rendered last so the email field is the first focusable on open; kept top-right via absolute. */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={!!isLinking}
            aria-label={tc('aria.close')}
            className={cn(
              "absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg",
              "text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800",
              "dark:text-foreground-3 dark:hover:bg-surface-hover dark:hover:text-foreground-1",
              "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
