import type React from 'react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from '../../../shared/components/ui/alert-dialog';
import {
  modalPanel,
  modalPanelLarge,
  modalEyebrow,
  modalTitleCompact,
  modalTitleLarge,
  modalBody,
  modalBodyMuted,
  modalHelperSmall,
  modalFooterRowRight,
  modalSecondary,
  modalPrimary,
  modalDestructive,
  ModalArrow,
} from '../../../shared/components/ui/modal-tokens';
import { selectIsOwner } from '../../auth/selectors';
import { logoutRequestAction } from '../../auth/actions';
import { deleteAccountApi } from '../../auth/api';
import type { AccountActionError } from '../../auth/types';

const AdvancedSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation('advancedSettings');

  const isOwner = useSelector(selectIsOwner);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSubscriptionBlocker, setShowSubscriptionBlocker] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      await deleteAccountApi();
      toast.success(t('toast.accountDeleted'));
      dispatch(logoutRequestAction.request());
    } catch (error: any) {
      const errorData = error?.response?.data as AccountActionError | undefined;
      if (errorData?.code === 'has_active_subscription') {
        setShowSubscriptionBlocker(true);
      } else {
        toast.error(errorData?.message || t('toast.failedDelete'));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGoToBilling = () => {
    setShowSubscriptionBlocker(false);
    navigate('/account?tab=billing');
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <p className="text-sm text-muted-foreground leading-relaxed">{t('dangerZone.deleteAccount.description')}</p>
            <p className="text-xs text-muted-foreground">{t('dangerZone.deleteAccount.irreversible')}</p>
            {isOwner && (
              <div className="mt-3 p-3 rounded-lg border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/40">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <CreditCard className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {t('dangerZone.deleteAccount.subscriptionHint')}
                </p>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            rounded="full"
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="shrink-0 !h-9 !px-4"
          >
            <AlertTriangle className={`h-3.5 w-3.5 mr-1.5 ${isDeleting ? 'animate-pulse' : ''}`} />
            {isDeleting ? t('dangerZone.deleteAccount.deleting') : t('dangerZone.deleteAccount.button')}
          </Button>
        </div>
      </div>

      {/* Active subscription blocker — owner must cancel sub first */}
      <AlertDialog open={showSubscriptionBlocker} onOpenChange={(open) => !open && setShowSubscriptionBlocker(false)}>
        <AlertDialogContent className={modalPanel}>
          <AlertDialogHeader className="space-y-4 !text-left">
            <div className={modalEyebrow}>{t('subscriptionBlocker.eyebrow')}</div>
            <AlertDialogTitle className={`${modalTitleCompact} text-left`}>
              {t('subscriptionBlocker.title')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p className={modalBody}>{t('subscriptionBlocker.message')}</p>
                <p className={modalBodyMuted}>{t('subscriptionBlocker.hint')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={`${modalFooterRowRight} mt-7`}>
            <button type="button" onClick={() => setShowSubscriptionBlocker(false)} className={modalSecondary}>
              {t('subscriptionBlocker.cancel')}
            </button>
            <button type="button" onClick={handleGoToBilling} className={modalPrimary}>
              <span>{t('subscriptionBlocker.goToBilling')}</span>
              <ModalArrow />
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account confirmation — final, immediate */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(false)}>
        <AlertDialogContent className={modalPanelLarge}>
          <AlertDialogHeader className="space-y-4 !text-left">
            <div className={modalEyebrow}>{t('deleteAccountDialog.eyebrow')}</div>
            <AlertDialogTitle className={`${modalTitleLarge} text-left`}>
              {t('deleteAccountDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-left">
                <p className={modalBody}>{t('deleteAccountDialog.intro')}</p>
                <ul className={`${modalBody} list-disc space-y-1.5 pl-5 marker:text-neutral-400 dark:marker:text-neutral-500`}>
                  <li>{t('deleteAccountDialog.bullets.appointments')}</li>
                  {isOwner && <li>{t('deleteAccountDialog.bullets.teamMembers')}</li>}
                  {isOwner && <li>{t('deleteAccountDialog.bullets.businessData')}</li>}
                  {isOwner && <li>{t('deleteAccountDialog.bullets.marketplace')}</li>}
                  <li>{t('deleteAccountDialog.bullets.account')}</li>
                </ul>
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30 p-3.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-destructive dark:text-red-300 mt-0.5" />
                  <p className="text-[14px] font-medium leading-[1.5] text-red-800 dark:text-red-200">
                    {t('deleteAccountDialog.irreversibleWarning')}
                  </p>
                </div>
                <p className={modalHelperSmall}>{t('deleteAccountDialog.otherAccountsHint')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={`${modalFooterRowRight} mt-7`}>
            <button type="button" onClick={() => setShowDeleteConfirm(false)} className={modalSecondary} disabled={isDeleting}>
              {t('deleteAccountDialog.cancel')}
            </button>
            <button type="button" onClick={handleDeleteConfirm} className={modalDestructive} disabled={isDeleting}>
              {isDeleting ? t('deleteAccountDialog.deleting') : t('deleteAccountDialog.confirmDelete')}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdvancedSettings;
