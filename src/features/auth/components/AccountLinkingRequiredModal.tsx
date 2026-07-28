import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectAccountLinkingRequired, selectAuthIsLoading, selectAuthError } from "../selectors";
import { sendBusinessLinkEmailAction, closeAccountLinkingRequiredModal, clearAuthErrorAction } from "../actions";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../../shared/lib/utils";
import {
  modalScrim,
  modalPanelLarge,
  modalEyebrow,
  modalTitleCompact,
  modalBody,
  modalBodyMuted,
  modalFooterRowRight,
  modalCancel,
  modalPrimary,
} from "../../../shared/components/ui/modal-tokens";
import { Spinner } from "../../../shared/components/ui/spinner";
import { X, AlertTriangle } from "lucide-react";
import { useTranslation, Trans } from "react-i18next";
import { getAvatarBgColor } from "../../setupWizard/components/StepTeam";

export default function AccountLinkingRequiredModal() {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const accountLinking = useSelector(selectAccountLinkingRequired);
  const isLoading = useSelector(selectAuthIsLoading);
  const authError = useSelector(selectAuthError);
  const isOpen = !!accountLinking;
  const wasLoadingRef = useRef(false);
  const wasOpenRef = useRef(false);

  // Clear error when modal closes
  useEffect(() => {
    if (!isOpen && authError) {
      dispatch(clearAuthErrorAction());
    }
  }, [isOpen, authError, dispatch]);

  // Track when modal was open and we started loading
  useEffect(() => {
    if (isOpen && isLoading) {
      wasLoadingRef.current = true;
      wasOpenRef.current = true;
    }
  }, [isOpen, isLoading]);

  // Redirect to login when email sent successfully
  useEffect(() => {
    if (!accountLinking && !isLoading && wasLoadingRef.current && wasOpenRef.current) {
      // Email was sent successfully (accountLinkingRequired cleared)
      navigate('/login', { replace: true });
      wasLoadingRef.current = false;
      wasOpenRef.current = false;
    }
  }, [accountLinking, isLoading, navigate]);

  const handleConfirm = () => {
    if (accountLinking?.email) {
      dispatch(sendBusinessLinkEmailAction.request({ 
        email: accountLinking.email,
        tx_id: accountLinking.tx_id 
      }));
    }
  };

  const handleClose = () => {
    dispatch(closeAccountLinkingRequiredModal());
  };

  if (!accountLinking) return null;

  const { email, firstName, lastName, existingRoles } = accountLinking;
  const roleType = existingRoles.customer ? t('accountLinkingRequired.roleCustomer') : t('accountLinkingRequired.roleTeamMember');
  const initials = ([firstName?.[0], lastName?.[0]].filter(Boolean).join('') || email?.[0] || '?').toUpperCase();

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => { if (!open && !isLoading) handleClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={modalScrim} />
        <DialogPrimitive.Content className={cn(modalPanelLarge, "text-left")}>
          <div className={cn(modalEyebrow, "pr-8")}>{t('accountLinkingRequired.eyebrow')}</div>
          <DialogPrimitive.Title className={cn(modalTitleCompact, "pr-8")}>
            {t('accountLinkingRequired.title')}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description asChild>
            <p className={cn(modalBody, "mt-3")}>{t('accountLinkingRequired.description')}</p>
          </DialogPrimitive.Description>

          <div className="mt-6 flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-900/5 text-[13px] font-semibold text-neutral-800"
              style={{ backgroundColor: getAvatarBgColor(email) }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold leading-tight text-neutral-900 dark:text-foreground-1">{firstName} {lastName}</p>
              <p className="truncate text-[13px] leading-tight text-neutral-500 dark:text-foreground-3">{email}</p>
            </div>
          </div>
          <p className={cn(modalBodyMuted, "mt-4")}>
            <Trans
              i18nKey="accountLinkingRequired.existingAccountInfo"
              ns="auth"
              values={{ role: roleType }}
              components={{ strong: <strong className="font-semibold text-neutral-700 dark:text-foreground-2" /> }}
            />
          </p>

          {authError ? (
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-warning-border bg-warning-bg px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
              <p className="text-[14px] leading-[1.5] text-warning">{authError}</p>
            </div>
          ) : (
            <div className="mt-6 border-t border-neutral-200 pt-6 dark:border-border-subtle">
              <p className="text-[13px] font-medium text-neutral-700 dark:text-foreground-2">
                {t('accountLinkingRequired.whatHappensNext')}
              </p>
              <ol className="mt-4">
                {[
                  <Trans i18nKey="accountLinkingRequired.stepSendEmail" ns="auth" values={{ email }} components={{ strong: <strong className="font-semibold text-neutral-800 dark:text-foreground-2" /> }} />,
                  t('accountLinkingRequired.stepClickLink'),
                  t('accountLinkingRequired.stepAccessBoth'),
                ].map((step, i, arr) => (
                  <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < arr.length - 1 && (
                      <span className="absolute bottom-0 left-[11px] top-6 w-px bg-neutral-200 dark:bg-border-subtle" aria-hidden="true" />
                    )}
                    <span className="relative z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-600 ring-1 ring-inset ring-neutral-200 dark:bg-surface-hover dark:text-foreground-2 dark:ring-border-subtle">
                      {i + 1}
                    </span>
                    <p className="pt-0.5 text-[14px] leading-[1.5] text-neutral-600 dark:text-foreground-3">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className={cn("mt-7", modalFooterRowRight)}>
            <button type="button" onClick={handleClose} disabled={isLoading} className={modalCancel}>
              {t('accountLinkingRequired.cancel')}
            </button>
            <button type="button" onClick={handleConfirm} disabled={isLoading} className={modalPrimary}>
              {isLoading ? <Spinner size="sm" color="white" /> : t('accountLinkingRequired.sendConfirmationEmail')}
            </button>
          </div>

          {/* Rendered last so a content control is focused first, not the close button; kept top-right via absolute. */}
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            aria-label={tc('aria.close')}
            className={cn(
              "absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg",
              "text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800",
              "dark:text-foreground-3 dark:hover:bg-surface-hover dark:hover:text-foreground-1",
              "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

