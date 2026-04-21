import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Trash2, Power, RefreshCw, Calendar, Users, CreditCard, ArrowRight } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { toast } from 'sonner';
import { useConfirmRadix } from '../../../shared/hooks/useConfirm';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from '../../../shared/components/ui/alert-dialog';
import { selectCurrentUser, selectIsOwner } from '../../auth/selectors';
import { logoutRequestAction, fetchCurrentUserAction } from '../../auth/actions';
import {
  deactivateAccountApi,
  reactivateAccountApi,
  scheduleAccountDeletionApi,
  cancelAccountDeletionApi,
} from '../../auth/api';
import type { AccountActionError, AccountBlocker } from '../../auth/types';
import { translateMessageCode } from '../../../shared/utils/error';

const AdvancedSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation('advancedSettings');
  const { confirm, ConfirmDialog } = useConfirmRadix();

  const user = useSelector(selectCurrentUser);
  const isOwner = useSelector(selectIsOwner);
  
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isSchedulingDeletion, setIsSchedulingDeletion] = useState(false);
  const [isCancellingDeletion, setIsCancellingDeletion] = useState(false);
  const [accountBlockersError, setAccountBlockersError] = useState<AccountActionError | null>(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletionScheduledAtSuccess, setDeletionScheduledAtSuccess] = useState<string | null>(null);

  const accountDisabled = user?.accountDisabled ?? false;
  const accountScheduledForDeletion = user?.accountScheduledForDeletion ?? false;
  const deletionScheduledAt = user?.deletionScheduledAt;

  const handleTeamMembersError = async (error: AccountActionError) => {
    const teamMemberCount = error.details?.teamMemberCount ?? 0;
    const goToAssignments = await confirm({
      title: t('teamMembersError.title'),
      content: (
        <div className="space-y-2">
          <p>{t('teamMembersError.message', { count: teamMemberCount })}</p>
          <p className="text-muted-foreground text-sm">{t('teamMembersError.goToHint')}</p>
        </div>
      ),
      confirmationText: t('teamMembersError.goToAssignments'),
      cancellationText: t('common.cancel'),
    });

    if (goToAssignments) {
      navigate('/assignments');
    }
  };

  const getBlockerIcon = (code: string) => {
    switch (code) {
      case 'needs_to_remove_team_members':
        return { Icon: Users, iconBg: 'bg-blue-100 dark:bg-blue-900/40', iconColor: 'text-blue-600 dark:text-blue-400' };
      case 'has_active_appointments':
        return { Icon: Calendar, iconBg: 'bg-amber-100 dark:bg-amber-900/40', iconColor: 'text-amber-600 dark:text-amber-400' };
      case 'has_active_subscription':
        return { Icon: CreditCard, iconBg: 'bg-violet-100 dark:bg-violet-900/40', iconColor: 'text-violet-600 dark:text-violet-400' };
      default:
        return { Icon: AlertTriangle, iconBg: 'bg-muted', iconColor: 'text-muted-foreground' };
    }
  };

  const getBlockerAction = (code: string): { labelKey: 'assignments' | 'calendar' | 'billing'; path: string } | null => {
    switch (code) {
      case 'needs_to_remove_team_members':
        return { labelKey: 'assignments', path: '/assignments' };
      case 'has_active_appointments':
        return { labelKey: 'calendar', path: '/calendar' };
      case 'has_active_subscription':
        return { labelKey: 'billing', path: '/account?tab=billing' };
      default:
        return null;
    }
  };

  const handleAccountBlockersError = (error: AccountActionError) => {
    setAccountBlockersError(error);
  };

  const handleCloseBlockersDialog = (path?: string) => {
    setAccountBlockersError(null);
    if (path) navigate(path);
  };

  const handleDeactivateAccount = () => {
    setShowDeactivateConfirm(true);
  };

  const handleDeactivateConfirm = async () => {
    setShowDeactivateConfirm(false);
    setIsDeactivating(true);
    try {
      await deactivateAccountApi();
      toast.success(t('toast.accountDeactivated'));
      dispatch(logoutRequestAction.request());
    } catch (error: any) {
      const errorData = error?.response?.data as AccountActionError | undefined;
      if (errorData?.code === 'account_has_blockers') {
        handleAccountBlockersError(errorData);
      } else if (errorData?.code === 'needs_to_remove_team_members') {
        await handleTeamMembersError(errorData);
      } else {
        toast.error(errorData?.message || t('toast.failedDeactivate'));
      }
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleReactivateAccount = async () => {
    setIsReactivating(true);
    try {
      await reactivateAccountApi();
      toast.success(t('toast.accountReactivated'));
      dispatch(fetchCurrentUserAction.request());
    } catch (error: any) {
      const errorData = error?.response?.data;
      toast.error(errorData?.message || t('toast.failedReactivate'));
    } finally {
      setIsReactivating(false);
    }
  };

  const handleScheduleDeletion = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);
    setIsSchedulingDeletion(true);
    try {
      const result = await scheduleAccountDeletionApi();
      const deletionDate = result.deletionScheduledAt
        ? new Date(result.deletionScheduledAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : t('common.thirtyDaysFromNow');
      setDeletionScheduledAtSuccess(deletionDate);
    } catch (error: any) {
      const errorData = error?.response?.data as AccountActionError | undefined;
      if (errorData?.code === 'account_has_blockers') {
        handleAccountBlockersError(errorData);
      } else if (errorData?.code === 'needs_to_remove_team_members') {
        await handleTeamMembersError(errorData);
      } else {
        toast.error(errorData?.message || t('toast.failedScheduleDeletion'));
      }
    } finally {
      setIsSchedulingDeletion(false);
    }
  };

  const handleDeletionScheduledOk = () => {
    setDeletionScheduledAtSuccess(null);
    dispatch(logoutRequestAction.request());
  };

  const handleCancelDeletion = async () => {
    const confirmed = await confirm({
      title: t('cancelDeletion.title'),
      content: t('cancelDeletion.message'),
      confirmationText: t('cancelDeletion.keepAccount'),
      cancellationText: t('common.cancel'),
    });

    if (!confirmed) return;

    setIsCancellingDeletion(true);
    try {
      await cancelAccountDeletionApi();
      toast.success(t('toast.deletionCancelled'));
      dispatch(fetchCurrentUserAction.request());
    } catch (error: any) {
      const errorData = error?.response?.data;
      toast.error(errorData?.message || t('toast.failedCancelDeletion'));
    } finally {
      setIsCancellingDeletion(false);
    }
  };

  const formatDeletionDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const blockers = accountBlockersError?.details?.blockers ?? [];

  return (
    <>
    <div className="space-y-6">
      <ConfirmDialog />

      {/* Account Status Banners */}
      {accountDisabled && (
        <Card className="border-amber-500/50 shadow-lg bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-amber-500/30">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <Power className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-base font-semibold text-amber-800 dark:text-amber-200">{t('accountDisabled.title')}</h3>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-amber-700 dark:text-amber-300">{t('accountDisabled.description')}</p>
              <Button
                type="button"
                onClick={handleReactivateAccount}
                disabled={isReactivating}
                className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isReactivating ? 'animate-spin' : ''}`} />
                {isReactivating ? t('accountDisabled.reactivating') : t('accountDisabled.reactivate')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {accountScheduledForDeletion && deletionScheduledAt && (
        <Card className="border-destructive/50 shadow-lg bg-red-50 dark:bg-red-950/20">
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-destructive/30">
              <div className="p-2 rounded-xl bg-destructive/10">
                <Calendar className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="text-base font-semibold text-red-800 dark:text-red-200">{t('accountScheduledForDeletion.title')}</h3>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                {t('accountScheduledForDeletion.deletedOnPrefix')} <strong>{formatDeletionDate(deletionScheduledAt)}</strong>.
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">{t('accountScheduledForDeletion.afterDate')}</p>
              <Button
                type="button"
                onClick={handleCancelDeletion}
                disabled={isCancellingDeletion}
                className="w-full h-10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isCancellingDeletion ? 'animate-spin' : ''}`} />
                {isCancellingDeletion ? t('accountScheduledForDeletion.cancelling') : t('accountScheduledForDeletion.cancelDeletion')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Actions Section */}
      <div className="space-y-4">
        {/* Disable Account */}
        {!accountDisabled && !accountScheduledForDeletion && (
          <Card className="border border-border/60 overflow-hidden">
            <CardContent className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 sm:p-5">
              <div className="space-y-1 min-w-0">
                <h4 className="text-base font-medium text-foreground">{t('dangerZone.disableAccount.title')}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('dangerZone.disableAccount.description')}</p>
                {isOwner && (
                  <div className="mt-3 p-3 rounded-lg border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/40">
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-200 flex items-start gap-2">
                      <Users className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {t('dangerZone.disableAccount.ownerHint')}
                    </p>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                rounded="full"
                onClick={handleDeactivateAccount}
                disabled={isDeactivating}
                className="shrink-0 !h-9 !px-4 border-border hover:bg-muted"
              >
                <Power className={`h-3.5 w-3.5 mr-1.5 ${isDeactivating ? 'animate-pulse' : ''}`} />
                {isDeactivating ? t('dangerZone.disableAccount.disabling') : t('dangerZone.disableAccount.button')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Delete Account */}
        {!accountScheduledForDeletion && (
          <Card className="border border-border/60 overflow-hidden">
            <CardContent className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 sm:p-5">
              <div className="space-y-1 min-w-0">
                <h4 className="text-base font-medium text-foreground">{t('dangerZone.deleteAccount.title')}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('dangerZone.deleteAccount.description')}</p>
                <p className="text-xs text-muted-foreground">{t('dangerZone.deleteAccount.gracePeriod')}</p>
                {isOwner && (
                  <div className="mt-3 p-3 rounded-lg border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/40">
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-200 flex items-start gap-2">
                      <Users className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {t('dangerZone.deleteAccount.ownerHint')}
                    </p>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                rounded="full"
                onClick={handleScheduleDeletion}
                disabled={isSchedulingDeletion}
                className="shrink-0 !h-9 !px-4"
              >
                <AlertTriangle className={`h-3.5 w-3.5 mr-1.5 ${isSchedulingDeletion ? 'animate-pulse' : ''}`} />
                {isSchedulingDeletion ? t('dangerZone.deleteAccount.scheduling') : t('dangerZone.deleteAccount.button')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>

    {/* Account blockers dialog (disable/delete blocked) */}
    <AlertDialog open={!!accountBlockersError} onOpenChange={(open) => !open && handleCloseBlockersDialog()}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle className="text-left">{t('blockersDialog.title')}</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-left pt-1">
              <p className="text-sm text-muted-foreground leading-relaxed">{t('blockersDialog.description')}</p>
              <div className="space-y-2.5">
                {blockers.map((b: AccountBlocker) => {
                  const { Icon, iconBg, iconColor } = getBlockerIcon(b.code);
                  const action = getBlockerAction(b.code);
                  return (
                    <div
                      key={b.code}
                      className="rounded-lg border border-border bg-muted/40 p-3 dark:bg-muted/20 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg} ${iconColor}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-medium text-foreground leading-snug pt-1.5">
                          {translateMessageCode(b.messageCode)}
                        </p>
                      </div>
                      {action && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          rounded="full"
                          className="w-full sm:w-auto shrink-0 gap-1 justify-center sm:justify-center"
                          onClick={() => handleCloseBlockersDialog(action.path)}
                        >
                          {t(`blockerActions.${action.labelKey}`)}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row justify-end gap-2 sm:gap-2 mt-4">
          <Button rounded="full" onClick={() => handleCloseBlockersDialog()}>
            {t('blockersDialog.understood')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Deactivate Account confirmation */}
    <AlertDialog open={showDeactivateConfirm} onOpenChange={(open) => !open && setShowDeactivateConfirm(false)}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
              <Power className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle className="text-left">{t('deactivateDialog.title')}</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-left pt-1">
              <p className="text-sm text-foreground leading-relaxed">{t('deactivateDialog.inactive')}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('deactivateDialog.reactivateHint')}</p>
              {isOwner && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 leading-relaxed">
                    {t('deactivateDialog.marketplaceWarning')}
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row justify-end gap-2 sm:gap-2 mt-4">
          <Button variant="outline" rounded="full" onClick={() => setShowDeactivateConfirm(false)}>
            {t('deactivateDialog.cancel')}
          </Button>
          <Button variant="destructive" rounded="full" onClick={handleDeactivateConfirm} disabled={isDeactivating}>
            {isDeactivating ? t('deactivateDialog.disabling') : t('deactivateDialog.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Delete Account confirmation */}
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
              <p className="text-sm text-foreground leading-relaxed">{t('deleteAccountDialog.scheduled')}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('deleteAccountDialog.periodHint')}</p>
              {isOwner && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 leading-relaxed">
                    {t('deleteAccountDialog.marketplaceWarning')}
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row justify-end gap-2 sm:gap-2 mt-4">
          <Button variant="outline" rounded="full" onClick={() => setShowDeleteConfirm(false)}>
            {t('deleteAccountDialog.cancel')}
          </Button>
          <Button variant="destructive" rounded="full" onClick={handleDeleteConfirm} disabled={isSchedulingDeletion}>
            {isSchedulingDeletion ? t('deleteAccountDialog.scheduling') : t('deleteAccountDialog.scheduleDeletion')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Account scheduled for deletion success */}
    <AlertDialog open={!!deletionScheduledAtSuccess} onOpenChange={(open) => !open && handleDeletionScheduledOk()}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <AlertDialogTitle className="text-left">{t('deletionScheduledSuccess.title')}</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left pt-1">
              <p className="text-sm text-foreground leading-relaxed">{t('deletionScheduledSuccess.scheduled')}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('deletionScheduledSuccess.deletionDate')} <strong className="text-foreground">{deletionScheduledAtSuccess}</strong>
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('deletionScheduledSuccess.cancelHint')}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row justify-end gap-2 sm:gap-2 mt-4">
          <Button rounded="full" onClick={handleDeletionScheduledOk}>
            {t('deletionScheduledSuccess.ok')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default AdvancedSettings;
