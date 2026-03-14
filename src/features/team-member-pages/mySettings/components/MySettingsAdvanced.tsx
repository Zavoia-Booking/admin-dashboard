import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { LogOut, Info, AlertTriangle, Power, RefreshCw, Calendar, Building2, Loader2, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/button';
import { Card, CardContent } from '../../../../shared/components/ui/card';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from '../../../../shared/components/ui/alert-dialog';
import { toast } from 'sonner';
import { leaveOrganisationApi } from '../api';
import {
  deactivateAccountApi,
  reactivateAccountApi,
  scheduleAccountDeletionApi,
  cancelAccountDeletionApi,
} from '../../../auth/api';
import type { AccountActionError } from '../../../auth/types';
import { fetchCurrentUserAction, logoutRequestAction } from '../../../auth/actions';
import { selectCurrentUser } from '../../../auth/selectors';
import { translateMessageCode } from '../../../../shared/utils/error';
import { useConfirmRadix } from '../../../../shared/hooks/useConfirm';
import { usePermissions } from '../../../../shared/hooks/usePermissions';

const MySettingsAdvanced = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('advancedSettings');
  const { confirm, ConfirmDialog } = useConfirmRadix();
  const { isDashboardUser } = usePermissions();

  // Leave organisation state
  const [isLeavingOrganisation, setIsLeavingOrganisation] = useState(false);
  const [showLeaveOrgConfirm, setShowLeaveOrgConfirm] = useState(false);
  const [showLeaveOrgSuccess, setShowLeaveOrgSuccess] = useState(false);
  const [activeAppointmentsCount, setActiveAppointmentsCount] = useState<number | null>(null);

  // Account management state
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isSchedulingDeletion, setIsSchedulingDeletion] = useState(false);
  const [isCancellingDeletion, setIsCancellingDeletion] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mustLeaveOrgCount, setMustLeaveOrgCount] = useState<number | null>(null);
  const [deletionScheduledAtSuccess, setDeletionScheduledAtSuccess] = useState<string | null>(null);

  const currentUser = useSelector(selectCurrentUser);
  const accountDisabled = currentUser?.accountDisabled ?? false;
  const accountScheduledForDeletion = currentUser?.accountScheduledForDeletion ?? false;
  const deletionScheduledAt = currentUser?.deletionScheduledAt;

  const formatDeletionDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ── Leave Organisation ──────────────────────────────────────────────

  const handleLeaveOrganisation = () => {
    setShowLeaveOrgConfirm(true);
  };

  const handleLeaveOrgConfirm = async () => {
    setShowLeaveOrgConfirm(false);
    setIsLeavingOrganisation(true);
    try {
      await leaveOrganisationApi();
      setShowLeaveOrgSuccess(true);
    } catch (error: any) {
      const errorData = error?.response?.data;
      if (errorData?.code === 'has_active_appointments') {
        const count = errorData?.details?.activeAppointmentsCount ?? 0;
        setActiveAppointmentsCount(count);
      } else {
        const message = errorData?.message || error?.message || 'Failed to leave organisation';
        const translatedMessage = Array.isArray(message)
          ? translateMessageCode(message[0])
          : translateMessageCode(message);
        toast.error(translatedMessage);
      }
    } finally {
      setIsLeavingOrganisation(false);
    }
  };

  const handleLeaveOrgSuccessOk = () => {
    setShowLeaveOrgSuccess(false);
    dispatch(logoutRequestAction.request());
  };

  // ── Account Management ──────────────────────────────────────────────

  const handleOrganisationsError = (error: AccountActionError) => {
    const orgCount = error.details?.organisationCount ?? 0;
    setShowDeactivateConfirm(false);
    setShowDeleteConfirm(false);
    setMustLeaveOrgCount(orgCount);
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
      if (errorData?.code === 'must_leave_all_organisations') {
        handleOrganisationsError(errorData);
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
      if (errorData?.code === 'must_leave_all_organisations') {
        handleOrganisationsError(errorData);
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

  return (
    <div className="space-y-6">
      <ConfirmDialog />

      {/* Account Status Banners — same styling as business owner */}
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

      {/* Account Actions Section — same layout as business Advanced */}
      <div className="space-y-4">
        {/* Leave Organisation — hidden for dashboard_user */}
        {!isDashboardUser && (
          <Card className="border border-border/60 overflow-hidden">
            <CardContent className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 sm:p-5">
              <div className="space-y-1 min-w-0">
                <h4 className="text-base font-medium text-foreground">{t('leaveOrganisation.title')}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('leaveOrganisation.cardDescription')}
                </p>
                <div className="mt-3 p-3 rounded-lg border border-blue-200/80 dark:border-blue-800/60 bg-blue-50/70 dark:bg-blue-950/40">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-200 flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    {t('leaveOrganisation.cardHint')}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                rounded="full"
                onClick={handleLeaveOrganisation}
                disabled={isLeavingOrganisation || showLeaveOrgConfirm}
                className="shrink-0 !h-9 !px-4"
              >
                {isLeavingOrganisation ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    {t('leaveOrganisation.leaving')}
                  </>
                ) : (
                  <>
                    <LogOut className="h-3.5 w-3.5 mr-1.5" />
                    {t('leaveOrganisation.title')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Disable Account */}
        {!accountDisabled && !accountScheduledForDeletion && (
          <Card className="border border-border/60 overflow-hidden">
            <CardContent className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 sm:p-5">
              <div className="space-y-1 min-w-0">
                <h4 className="text-base font-medium text-foreground">{t('dangerZone.disableAccount.title')}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('deactivateDialog.inactive')}</p>
                <p className="text-xs text-muted-foreground">{t('deactivateDialog.reactivateHint')}</p>
                {!isDashboardUser && (
                  <div className="mt-3 p-3 rounded-lg border border-blue-200/80 dark:border-blue-800/60 bg-blue-50/70 dark:bg-blue-950/40">
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200 flex items-start gap-2">
                      <Building2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {t('dangerZone.mustLeaveOrganisations.hint')}
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
                {isDeactivating ? t('dangerZone.disableAccount.disabling') : t('deactivateDialog.confirm')}
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
                {!isDashboardUser && (
                  <div className="mt-3 p-3 rounded-lg border border-blue-200/80 dark:border-blue-800/60 bg-blue-50/70 dark:bg-blue-950/40">
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200 flex items-start gap-2">
                      <Building2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {t('dangerZone.mustLeaveOrganisations.hint')}
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

      {/* Leave Organisation confirmation — same styling as business owner modals */}
      <AlertDialog open={showLeaveOrgConfirm} onOpenChange={(open) => !open && setShowLeaveOrgConfirm(false)}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <LogOut className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle className="text-left">{t('leaveOrganisation.title')}</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-left pt-1">
                <p className="text-sm text-foreground leading-relaxed">{t('leaveOrganisation.confirmMessage')}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('leaveOrganisation.confirmHint')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 sm:gap-2 mt-4">
            <Button variant="outline" rounded="full" onClick={() => setShowLeaveOrgConfirm(false)}>
              {t('leaveOrganisation.cancel')}
            </Button>
            <Button variant="destructive" rounded="full" onClick={handleLeaveOrgConfirm} disabled={isLeavingOrganisation}>
              {isLeavingOrganisation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('leaveOrganisation.leaving')}
                </>
              ) : (
                t('leaveOrganisation.confirmButton')
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Organisation success */}
      <AlertDialog open={showLeaveOrgSuccess} onOpenChange={(open) => !open && handleLeaveOrgSuccessOk()}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <AlertDialogTitle className="text-left">{t('leaveOrganisation.successTitle')}</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-left pt-1">
                <p className="text-sm text-foreground leading-relaxed">{t('leaveOrganisation.successMessage')}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{t('leaveOrganisation.successHint')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 sm:gap-2 mt-4">
            <Button rounded="full" onClick={handleLeaveOrgSuccessOk}>
              {t('leaveOrganisation.successButton')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Active Appointments — info modal when leave is blocked */}
      <AlertDialog open={activeAppointmentsCount !== null} onOpenChange={(open) => !open && setActiveAppointmentsCount(null)}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <AlertDialogTitle className="text-left">{t('activeAppointments.title')}</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-left pt-1">
                {activeAppointmentsCount !== null && (
                  <p className="text-sm text-foreground leading-relaxed">
                    {t('activeAppointments.message', { count: activeAppointmentsCount })}
                  </p>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed">{t('activeAppointments.hint')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 sm:gap-2 mt-4">
            <Button rounded="full" onClick={() => setActiveAppointmentsCount(null)}>
              {t('activeAppointments.understood')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Must Leave All Organisations — styled like business owner blockers dialog */}
      <AlertDialog open={mustLeaveOrgCount !== null} onOpenChange={(open) => !open && setMustLeaveOrgCount(null)}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <AlertDialogTitle className="text-left">{t('dangerZone.mustLeaveOrganisations.title')}</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-left pt-1">
                {mustLeaveOrgCount !== null && (
                  <p className="text-sm text-foreground leading-relaxed">
                    {t('dangerZone.mustLeaveOrganisations.memberCount', { count: mustLeaveOrgCount })}
                  </p>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed">{t('dangerZone.mustLeaveOrganisations.hint')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 sm:gap-2 mt-4">
            <Button rounded="full" onClick={() => setMustLeaveOrgCount(null)}>
              {t('blockersDialog.understood')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Account confirmation — same styling as business owner */}
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

      {/* Delete Account confirmation — same styling as business owner */}
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

      {/* Account scheduled for deletion success — same styling as business owner */}
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
    </div>
  );
};

export default MySettingsAdvanced;
