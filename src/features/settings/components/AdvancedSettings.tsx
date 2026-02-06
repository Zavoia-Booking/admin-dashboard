import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Upload, Trash2, FileUp, Power, RefreshCw, Calendar, Users } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Input } from '../../../shared/components/ui/input';
import { toast } from 'sonner';
import { useConfirmRadix } from '../../../shared/hooks/useConfirm';
import { selectCurrentUser, selectIsOwner } from '../../auth/selectors';
import { logoutRequestAction, fetchCurrentUserAction } from '../../auth/actions';
import {
  deactivateAccountApi,
  reactivateAccountApi,
  scheduleAccountDeletionApi,
  cancelAccountDeletionApi,
} from '../../auth/api';
import type { AccountActionError } from '../../auth/types';

const AdvancedSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { confirm, ConfirmDialog } = useConfirmRadix();
  
  const user = useSelector(selectCurrentUser);
  const isOwner = useSelector(selectIsOwner);
  
  const [confirmText, setConfirmText] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isSchedulingDeletion, setIsSchedulingDeletion] = useState(false);
  const [isCancellingDeletion, setIsCancellingDeletion] = useState(false);

  const accountDisabled = user?.accountDisabled ?? false;
  const accountScheduledForDeletion = user?.accountScheduledForDeletion ?? false;
  const deletionScheduledAt = user?.deletionScheduledAt;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
  };

  const handleImportData = (type: 'customers' | 'appointments' | 'services') => {
    toast.info(`Import ${type} functionality would be implemented here`);
  };

  const handleResetData = () => {
    if (confirmText !== 'RESET') {
      toast.error('Please type "RESET" to confirm');
      return;
    }
    toast.success('Data reset initiated (demo only)');
    setConfirmText('');
  };

  const handleTeamMembersError = async (error: AccountActionError) => {
    const teamMemberCount = error.details?.teamMemberCount ?? 0;
    const goToAssignments = await confirm({
      title: 'Team Members Must Be Removed',
      content: (
        <div className="space-y-2">
          <p>
            You must remove all {teamMemberCount} team member{teamMemberCount !== 1 ? 's' : ''} before performing this action.
          </p>
          <p className="text-muted-foreground text-sm">
            Go to Assignments to manage and remove team members from your business.
          </p>
        </div>
      ),
      confirmationText: 'Go to Assignments',
      cancellationText: 'Cancel',
    });

    if (goToAssignments) {
      navigate('/assignments');
    }
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
          {isOwner && (
            <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">
              Warning: Your business will be delisted from the marketplace and customers with existing appointments will no longer receive reminders.
            </p>
          )}
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
      if (errorData?.code === 'needs_to_remove_team_members') {
        await handleTeamMembersError(errorData);
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
          {isOwner && (
            <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">
              Warning: Your business will be delisted from the marketplace and customers with existing appointments will no longer receive reminders.
            </p>
          )}
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
      if (errorData?.code === 'needs_to_remove_team_members') {
        await handleTeamMembersError(errorData);
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

  const formatDeletionDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ConfirmDialog />

      {/* Account Status Banners */}
      {accountDisabled && (
        <Card className="border-amber-500/50 shadow-lg bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>
      )}

      {/* Data Import Section */}
      <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-border/50">
            <div className="p-2 rounded-xl bg-primary/10">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Data Import</h3>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Import your business data from CSV or Excel files to populate your account.
            </p>
            <div className="grid grid-cols-1 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleImportData('customers')}
                className="h-10 text-sm"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Import Customers
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleImportData('appointments')}
                className="h-10 text-sm"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Import Appointments
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleImportData('services')}
                className="h-10 text-sm"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Import Services
              </Button>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">
                <strong>Supported formats:</strong> CSV (.csv), Excel (.xlsx, .xls)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>File size limit:</strong> 10MB maximum
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone Section */}
      <Card className="border-0 shadow-lg bg-card/70 backdrop-blur-sm border-destructive/20">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-border/50">
            <div className="p-2 rounded-xl bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Danger Zone</h3>
          </div>
          <div className="space-y-4">
            {/* Reset All Data */}
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <h4 className="font-medium text-sm text-destructive mb-2">Reset All Data</h4>
              <p className="text-xs text-muted-foreground mb-3">
                This will permanently delete all appointments, customers, and services. This action cannot be undone.
              </p>
              <div className="space-y-2">
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder='Type "RESET" to confirm'
                  className="border-0 bg-background text-base h-10"
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleResetData}
                  disabled={confirmText !== 'RESET'}
                  className="w-full h-10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset All Data
                </Button>
              </div>
            </div>

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
                {isOwner && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-amber-500/10 mb-3">
                    <Users className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      As an owner, you must remove all team members before disabling your account.
                    </p>
                  </div>
                )}
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
                {isOwner && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 mb-3">
                    <Users className="h-4 w-4 text-destructive flex-shrink-0" />
                    <p className="text-xs text-destructive">
                      As an owner, you must remove all team members before deleting your account.
                    </p>
                  </div>
                )}
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
        </CardContent>
      </Card>
    </form>
  );
};

export default AdvancedSettings;
