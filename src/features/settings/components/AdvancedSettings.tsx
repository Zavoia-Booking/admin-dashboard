import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Trash2, CreditCard, ArrowRight } from 'lucide-react';
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

  const handleDeleteClick = () => {
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
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40">
                <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <AlertDialogTitle className="text-left">{t('subscriptionBlocker.title')}</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left pt-1">
                <p className="text-sm text-foreground leading-relaxed">{t('subscriptionBlocker.message')}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('subscriptionBlocker.hint')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 sm:gap-2 mt-4">
            <Button variant="outline" rounded="full" onClick={() => setShowSubscriptionBlocker(false)}>
              {t('subscriptionBlocker.cancel')}
            </Button>
            <Button rounded="full" onClick={handleGoToBilling} className="gap-1">
              {t('subscriptionBlocker.goToBilling')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account confirmation — final, immediate */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(false)}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle className="text-left">{t('deleteAccountDialog.title')}</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-left pt-1">
                <p className="text-sm text-foreground leading-relaxed">{t('deleteAccountDialog.intro')}</p>
                <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                  <li>{t('deleteAccountDialog.bullets.appointments')}</li>
                  {isOwner && <li>{t('deleteAccountDialog.bullets.teamMembers')}</li>}
                  {isOwner && <li>{t('deleteAccountDialog.bullets.businessData')}</li>}
                  {isOwner && <li>{t('deleteAccountDialog.bullets.marketplace')}</li>}
                  <li>{t('deleteAccountDialog.bullets.account')}</li>
                </ul>
                <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 leading-relaxed">
                    {t('deleteAccountDialog.irreversibleWarning')}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{t('deleteAccountDialog.otherAccountsHint')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 sm:gap-2 mt-4">
            <Button variant="outline" rounded="full" onClick={() => setShowDeleteConfirm(false)}>
              {t('deleteAccountDialog.cancel')}
            </Button>
            <Button variant="destructive" rounded="full" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? t('deleteAccountDialog.deleting') : t('deleteAccountDialog.confirmDelete')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdvancedSettings;
