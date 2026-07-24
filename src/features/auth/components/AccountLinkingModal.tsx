import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../app/providers/store";
import { closeAccountLinkingModal, reauthForLinkAction } from "../actions";
import { Button } from "../../../shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../shared/components/ui/dialog";
import CredentialsForm from "../../../shared/components/auth/CredentialsForm";
import { useLocation, useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";

export default function AccountLinkingModal() {
  const { t } = useTranslation('auth');
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
    } catch {}
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
    <Dialog open onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl md:text-2xl text-center">{t('accountLinking.title')}</DialogTitle>
          <DialogDescription className="text-center text-sm">
            {t('accountLinking.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 px-2">
          {displayError && (
            <p
              className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-error-bg px-3 py-2.5 text-[13px] text-destructive"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{displayError}</span>
            </p>
          )}
          <CredentialsForm
            onSubmit={({ email, password }) => {
              dispatch(reauthForLinkAction.request({ email, password }));
            }}
            defaultEmail={pendingLinkEmail ?? undefined}
            emailReadOnly={!!pendingLinkEmail}
            autoFocusField={pendingLinkEmail ? 'password' : 'email'}
            submitLabel={t('accountLinking.submitLabel')}
            isLoading={!!isLinking || sessionExpired}
          />
        </div>
        <DialogFooter className="flex flex-col gap-3 sm:flex-col">
          <Button
            variant="outline"
            rounded="full"
            onClick={handleCancel}
            className="w-full"
            disabled={!!isLinking}
          >
            {t('accountLinking.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
