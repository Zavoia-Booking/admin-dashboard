import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut, Info, AlertTriangle, Power, RefreshCw, Calendar, Building2, Loader2 } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/button';
import { toast } from 'sonner';
import FormSectionHeader from '../../../../shared/components/forms/FormSectionHeader';
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
  const { confirm, ConfirmDialog } = useConfirmRadix();
  const { isDashboardUser } = usePermissions();

  // Leave organisation state
  const [isLeavingOrganisation, setIsLeavingOrganisation] = useState(false);

  // Account management state
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isSchedulingDeletion, setIsSchedulingDeletion] = useState(false);
  const [isCancellingDeletion, setIsCancellingDeletion] = useState(false);

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

  const handleLeaveOrganisation = async () => {
    const confirmed = await confirm({
      title: 'Leave Organisation',
      content: (
        <div className="space-y-2">
          <p>Are you sure you want to leave this organisation?</p>
          <p className="text-muted-foreground text-sm">
            You will lose access to this business and all associated data. This action cannot be undone.
          </p>
        </div>
      ),
      confirmationText: 'Leave Organisation',
      cancellationText: 'Cancel',
      destructive: true,
    });

    if (!confirmed) return;

    setIsLeavingOrganisation(true);
    try {
      await leaveOrganisationApi();

      // Show success dialog
      await confirm({
        title: 'Successfully Left Organisation',
        content: (
          <div className="space-y-2">
            <p>You have successfully left the organisation.</p>
            <p className="text-muted-foreground text-sm">
              Your access to this business has been removed. You will now be logged out.
            </p>
          </div>
        ),
        confirmationText: 'Confirm',
        showCancel: false,
      });

      dispatch(logoutRequestAction.request());
    } catch (error: any) {
      const errorData = error?.response?.data;

      if (errorData?.code === 'has_active_appointments') {
        const count = errorData?.details?.activeAppointmentsCount;
        await confirm({
          title: 'Active Appointments Found',
          content: (
            <div className="space-y-2">
              <p>
                You have {count ? <strong>{count}</strong> : ''} active appointment{count !== 1 ? 's' : ''} that must be resolved before you can leave.
              </p>
              <p className="text-muted-foreground text-sm">
                Please cancel your pending appointments or ask the business owner to reassign them to another team member before trying again.
              </p>
            </div>
          ),
          confirmationText: 'Understood',
          showCancel: false,
        });
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

  // ── Account Management ──────────────────────────────────────────────

  const handleOrganisationsError = async (error: AccountActionError) => {
    const orgCount = error.details?.organisationCount ?? 0;
    await confirm({
      title: 'Must Leave All Organisations',
      content: (
        <div className="space-y-2">
          <p>
            You are currently a member of {orgCount} organisation{orgCount !== 1 ? 's' : ''}.
          </p>
          <p className="text-muted-foreground text-sm">
            You must leave all organisations before you can deactivate or delete your account. Log in to each business and use the "Leave Organisation" option in your settings.
          </p>
        </div>
      ),
      confirmationText: 'Understood',
      showCancel: false,
    });
  };

  const handleDeactivateAccount = async () => {
    const confirmed = await confirm({
      title: 'Deactivate Account',
      content: (
        <div className="space-y-2">
          <p>Your account will be marked as inactive.</p>
          <p className="text-muted-foreground text-sm">
            You can reactivate it anytime by simply logging back in. All your data will be preserved.
          </p>
        </div>
      ),
      confirmationText: 'Deactivate',
      cancellationText: 'Cancel',
      destructive: true,
    });

    if (!confirmed) return;

    setIsDeactivating(true);
    try {
      await deactivateAccountApi();
      toast.success('Account deactivated successfully');
      dispatch(logoutRequestAction.request());
    } catch (error: any) {
      const errorData = error?.response?.data as AccountActionError | undefined;
      if (errorData?.code === 'must_leave_all_organisations') {
        await handleOrganisationsError(errorData);
      } else {
        toast.error(errorData?.message || 'Failed to deactivate account');
      }
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleReactivateAccount = async () => {
    setIsReactivating(true);
    try {
      await reactivateAccountApi();
      toast.success('Account reactivated successfully');
      dispatch(fetchCurrentUserAction.request());
    } catch (error: any) {
      const errorData = error?.response?.data;
      toast.error(errorData?.message || 'Failed to reactivate account');
    } finally {
      setIsReactivating(false);
    }
  };

  const handleScheduleDeletion = async () => {
    const confirmed = await confirm({
      title: 'Delete Account',
      content: (
        <div className="space-y-2">
          <p>Your account will be scheduled for permanent deletion in 30 days.</p>
          <p className="text-muted-foreground text-sm">
            During this period, you can log in and cancel the deletion. After 30 days, your account and all data will be permanently deleted and cannot be recovered.
          </p>
        </div>
      ),
      confirmationText: 'Schedule Deletion',
      cancellationText: 'Cancel',
      destructive: true,
    });

    if (!confirmed) return;

    setIsSchedulingDeletion(true);
    try {
      const result = await scheduleAccountDeletionApi();
      const deletionDate = result.deletionScheduledAt
        ? new Date(result.deletionScheduledAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : '30 days from now';

      await confirm({
        title: 'Account Scheduled for Deletion',
        content: (
          <div className="space-y-2">
            <p>Your account has been scheduled for deletion.</p>
            <p className="text-muted-foreground text-sm">
              Deletion date: <strong>{deletionDate}</strong>
            </p>
            <p className="text-muted-foreground text-sm">
              You can cancel this by logging back in before the deletion date.
            </p>
          </div>
        ),
        confirmationText: 'OK',
        showCancel: false,
      });

      dispatch(logoutRequestAction.request());
    } catch (error: any) {
      const errorData = error?.response?.data as AccountActionError | undefined;
      if (errorData?.code === 'must_leave_all_organisations') {
        await handleOrganisationsError(errorData);
      } else {
        toast.error(errorData?.message || 'Failed to schedule account deletion');
      }
    } finally {
      setIsSchedulingDeletion(false);
    }
  };

  const handleCancelDeletion = async () => {
    const confirmed = await confirm({
      title: 'Cancel Account Deletion',
      content: 'Are you sure you want to cancel the scheduled deletion and keep your account?',
      confirmationText: 'Keep My Account',
      cancellationText: 'Cancel',
    });

    if (!confirmed) return;

    setIsCancellingDeletion(true);
    try {
      await cancelAccountDeletionApi();
      toast.success('Account deletion cancelled');
      dispatch(fetchCurrentUserAction.request());
    } catch (error: any) {
      const errorData = error?.response?.data;
      toast.error(errorData?.message || 'Failed to cancel account deletion');
    } finally {
      setIsCancellingDeletion(false);
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog />

      {/* Account Status Banners */}
      {accountDisabled && (
        <div className="rounded-lg border border-amber-500/50 shadow-lg bg-amber-50 dark:bg-amber-950/20 p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-amber-500/30">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <Power className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-base font-semibold text-amber-800 dark:text-amber-200">Account Disabled</h3>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Your account is currently disabled. All your data is preserved, but you won't have access to most features until you reactivate.
              </p>
              <Button
                type="button"
                onClick={handleReactivateAccount}
                disabled={isReactivating}
                className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isReactivating ? 'animate-spin' : ''}`} />
                {isReactivating ? 'Reactivating...' : 'Reactivate Account'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {accountScheduledForDeletion && deletionScheduledAt && (
        <div className="rounded-lg border border-destructive/50 shadow-lg bg-red-50 dark:bg-red-950/20 p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-destructive/30">
              <div className="p-2 rounded-xl bg-destructive/10">
                <Calendar className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="text-base font-semibold text-red-800 dark:text-red-200">Account Scheduled for Deletion</h3>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                Your account is scheduled to be permanently deleted on{' '}
                <strong>{formatDeletionDate(deletionScheduledAt)}</strong>.
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                After this date, all your data will be permanently removed and cannot be recovered.
              </p>
              <Button
                type="button"
                onClick={handleCancelDeletion}
                disabled={isCancellingDeletion}
                className="w-full h-10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isCancellingDeletion ? 'animate-spin' : ''}`} />
                {isCancellingDeletion ? 'Cancelling...' : 'Cancel Deletion & Keep Account'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Organisation Section — hidden for dashboard_user (no business to leave) */}
      {!isDashboardUser && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <FormSectionHeader
            icon={LogOut}
            title="Leave Organisation"
            description="Remove yourself from this business"
            className="mb-6"
            iconBgColor="bg-destructive/10"
            iconColor="text-destructive"
          />

          <div className="space-y-4">
            {/* Info box */}
            <div className="flex gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Before leaving
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You must cancel or reassign all your active appointments before you can leave the organisation. Ask the business owner to reassign your appointments to another team member, or cancel them yourself.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="destructive"
              onClick={handleLeaveOrganisation}
              disabled={isLeavingOrganisation}
              className="h-10"
            >
              {isLeavingOrganisation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Leaving...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Organisation
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Account Management - Danger Zone */}
      <div className="rounded-lg border border-destructive/20 bg-card p-6 shadow-sm">
        <FormSectionHeader
          icon={AlertTriangle}
          title="Account Management"
          description="Deactivate or permanently delete your account"
          className="mb-6"
          iconBgColor="bg-destructive/10"
          iconColor="text-destructive"
        />

        <div className="space-y-4">
          {/* Organisation membership warning for team members */}
          {!isDashboardUser && (
            <div className="flex gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Organisation membership
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You must leave all organisations you belong to before you can deactivate or delete your account. Use the "Leave Organisation" option above in each business.
                </p>
              </div>
            </div>
          )}

          {/* Disable Account */}
          {!accountDisabled && !accountScheduledForDeletion && (
            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Power className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h4 className="font-medium text-sm text-amber-700 dark:text-amber-300">Disable Account</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Temporarily disable your account. Your data will be preserved, and you can reactivate anytime by logging back in.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleDeactivateAccount}
                disabled={isDeactivating}
                className="w-full h-10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
              >
                <Power className={`h-4 w-4 mr-2 ${isDeactivating ? 'animate-pulse' : ''}`} />
                {isDeactivating ? 'Disabling...' : 'Disable Account'}
              </Button>
            </div>
          )}

          {/* Delete Account */}
          {!accountScheduledForDeletion && (
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <h4 className="font-medium text-sm text-destructive mb-2">Delete Account</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Schedule your account for permanent deletion. After 30 days, all data will be permanently removed.
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                During the 30-day grace period, you can log in and cancel the deletion to keep your account.
              </p>
              <Button
                type="button"
                variant="destructive"
                onClick={handleScheduleDeletion}
                disabled={isSchedulingDeletion}
                className="w-full h-10"
              >
                <AlertTriangle className={`h-4 w-4 mr-2 ${isSchedulingDeletion ? 'animate-pulse' : ''}`} />
                {isSchedulingDeletion ? 'Scheduling...' : 'Delete Account'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MySettingsAdvanced;
