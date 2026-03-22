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

export default function AccountLinkingModal() {
  const { t } = useTranslation('auth');
  const dispatch = useDispatch();
  const open = useSelector((s: RootState) => (s as any).auth.isAccountLinkingModalOpen);
  const isLinking = useSelector((s: RootState) => (s as any).auth.linkingLoading) as boolean | undefined;
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
          <CredentialsForm
            onSubmit={({ email, password }) => {
              dispatch(reauthForLinkAction.request({ email, password }));
            }}
            submitLabel={t('accountLinking.submitLabel')}
            isLoading={!!isLinking}
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


