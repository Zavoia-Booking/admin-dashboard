import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../../app/providers/store';
import { User, Mail, Phone, Shield, Camera, Loader2, Save, Lock, FileText, ChevronRight, Settings, LogOut, Info, AlertTriangle, Power, RefreshCw, Calendar, Building2, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/button';
import { Label } from '../../../../shared/components/ui/label';
import { Input } from '../../../../shared/components/ui/input';
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
import FormSectionHeader from '../../../../shared/components/forms/FormSectionHeader';
import TextField from '../../../../shared/components/forms/fields/TextField';
import { getTeamMemberProfile, updateTeamMemberProfile, changeTeamMemberPassword, uploadTeamMemberProfileImage, leaveOrganisationApi, type TeamMemberProfile } from '../api';
import {
  setPasswordApi,
  deactivateAccountApi,
  reactivateAccountApi,
  scheduleAccountDeletionApi,
  cancelAccountDeletionApi,
} from '../../../auth/api';
import type { AccountActionError } from '../../../auth/types';
import { fetchCurrentUserAction, logoutRequestAction } from '../../../auth/actions';
import { selectCurrentUser } from '../../../auth/selectors';
import GoogleAccountManager from '../../../settings/components/GoogleAccountManager';
import { translateMessageCode } from '../../../../shared/utils/error';
import { PasswordStrength } from '../../../auth/components/PasswordStrength';
import { validatePasswordPolicy } from '../../../../shared/utils/validation';
import { Popover, PopoverTrigger, PopoverContent } from '../../../../shared/components/ui/popover';
import LegalContentDialog from '../../../legal/components/LegalContentDialog';
import type { LegalPageType } from '../../../legal/components/legal-content';
import { useConfirmRadix } from '../../../../shared/hooks/useConfirm';
import { usePermissions } from '../../../../shared/hooks/usePermissions';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage: string | null;
}

const initialFormData: ProfileFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  profileImage: null,
};

interface MyAccountContentProps {
  onDirtyChange?: (isDirty: boolean) => void;
  onSavingChange?: (isSaving: boolean) => void;
}

const MyAccountContent = ({ onDirtyChange, onSavingChange }: MyAccountContentProps) => {
  const { t } = useTranslation('myAccount');
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  const [originalFormData, setOriginalFormData] = useState<ProfileFormData>(initialFormData);
  const [_, setProfileData] = useState<TeamMemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [pwInteracted, setPwInteracted] = useState(false);
  const [legalDialogType, setLegalDialogType] = useState<LegalPageType | null>(null);

  const userHasPassword = user?.hasPassword === true;
  const isPasswordPolicyValid = validatePasswordPolicy(newPassword) === true;
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmitPassword = isPasswordPolicyValid && passwordsMatch && confirmPassword.length > 0
    && (!userHasPassword || currentPassword.trim().length > 0);

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await getTeamMemberProfile();
      setProfileData(response.profile);
      const newFormData = {
        firstName: response.profile.firstName || '',
        lastName: response.profile.lastName || '',
        email: response.profile.email || '',
        phone: response.profile.phone || '',
        profileImage: response.profile.profileImage || null,
      };
      setFormData(newFormData);
      setOriginalFormData(newFormData);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error(error?.message || t('profile.toast.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    onSavingChange?.(true);
    try {
      await updateTeamMemberProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
      });
      toast.success(t('profile.toast.updateSuccess'));
      setOriginalFormData(formData);
      // Refresh user data in Redux
      dispatch(fetchCurrentUserAction.request());
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || t('profile.toast.updateFailed');
      const translatedMessage = Array.isArray(message)
        ? translateMessageCode(message[0])
        : translateMessageCode(message);
      toast.error(translatedMessage);
    } finally {
      setIsSaving(false);
      onSavingChange?.(false);
    }
  };

  // Check if form has changes
  const hasChanges = formData.firstName !== originalFormData.firstName ||
    formData.lastName !== originalFormData.lastName ||
    formData.email !== originalFormData.email ||
    formData.phone !== originalFormData.phone;

  // Notify parent of dirty state
  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const handleSetPasswordClick = () => {
    // Small delay to allow modal to close first, then focus and scroll to the password input
    setTimeout(() => {
      passwordInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus after scroll starts
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 300);
    }, 100);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('profile.toast.invalidImage'));
      return;
    }

    // Validate file size (10MB max)
    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(t('profile.toast.fileTooLarge', { max: maxSizeMB }));
      return;
    }

    try {
      setIsUploadingImage(true);
      const response = await uploadTeamMemberProfileImage(file);

      setFormData(prev => ({
        ...prev,
        profileImage: response.profileImage,
      }));
      setOriginalFormData(prev => ({
        ...prev,
        profileImage: response.profileImage,
      }));

      toast.success(t('profile.toast.imageUploadSuccess'));

      // Refresh user data to update sidebar/header
      dispatch(fetchCurrentUserAction.request());
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      const message = error?.response?.data?.message || error?.message || t('profile.toast.imageUploadFailed');
      const translatedMessage = Array.isArray(message)
        ? translateMessageCode(message[0])
        : translateMessageCode(message);
      toast.error(translatedMessage);
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChangePassword = async () => {
    setPwFocused(false);
    const policyResult = validatePasswordPolicy(newPassword);
    if (policyResult !== true) {
      toast.error(t('profile.toast.passwordPolicyFailed'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('profile.toast.passwordsNoMatch'));
      return;
    }

    setIsChangingPassword(true);
    try {
      if (userHasPassword) {
        await changeTeamMemberPassword({ currentPassword, newPassword });
        toast.success(t('profile.toast.passwordChanged'));
      } else {
        await setPasswordApi({ password: newPassword });
        toast.success(t('profile.toast.passwordSet'));
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwInteracted(false);
      dispatch(fetchCurrentUserAction.request());
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || t('profile.toast.passwordUpdateFailed');
      const translatedMessage = Array.isArray(message)
        ? translateMessageCode(message[0])
        : translateMessageCode(message);
      toast.error(translatedMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    // Inline import to avoid top-level import for skeleton-only usage
    const Skeleton = React.lazy(() => import('../../../../shared/components/ui/skeleton').then(m => ({ default: m.Skeleton })));

    return (
      <React.Suspense fallback={null}>
        <div className="space-y-6">
          {/* Personal Information Skeleton */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 pb-2 border-b border-border mb-6">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-72" />
                <div className="pt-2">
                  <Skeleton className="h-24 w-24 rounded-full" />
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex-1 min-w-[280px] space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex-1 min-w-[280px] space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Skeleton */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 pb-2 border-b border-border mb-6">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex-1 min-w-[280px] space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex-1 min-w-[280px] space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          {/* Account Security Skeleton */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 pb-2 border-b border-border mb-6">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-72" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
              <div className="pt-4 border-t border-border">
                <div className="space-y-1 mb-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <div className="flex flex-wrap gap-6">
                  <div className="flex-1 min-w-[280px] space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="flex-1 min-w-[280px] space-y-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 mt-4">
                  <div className="flex-1 min-w-[280px] space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="flex-1 min-w-[280px]" />
                </div>
                <Skeleton className="h-9 w-36 mt-4" />
              </div>
            </div>
          </div>
        </div>
      </React.Suspense>
    );
  }

  return (
    <form
      id="my-account-form"
      onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}
      className="space-y-6"
    >
      {/* Basic Information Section */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <FormSectionHeader
          icon={User}
          title={t('profile.personalInfo.title')}
          description={t('profile.personalInfo.description')}
          className="mb-6"
        />

        <div className="space-y-6">
          {/* Profile Image Upload - Circular Display */}
          <div className="space-y-2">
            <Label className="text-base font-medium text-foreground-1">{t('profile.profilePhoto.label')}</Label>
            <p className="text-sm text-foreground-3 dark:text-foreground-2">
              {t('profile.profilePhoto.description')}
            </p>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,image/avif"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Circular Profile Image Preview with Edit Button */}
            <div className="flex items-center gap-4 pt-2">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
                  {formData.profileImage ? (
                    <img
                      src={formData.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                {/* Edit Button on Image */}
                <div
                  onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-surface text-foreground-1 text-xs font-medium rounded-md shadow-lg hover:bg-surface-hover transition-colors border border-border ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                >
                  <Camera className="h-3 w-3" />
                  {isUploadingImage ? t('profile.profilePhoto.uploading') : t('profile.profilePhoto.edit')}
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout - Name Fields */}
          <div className="flex flex-wrap gap-6">
            <div className="flex-1 min-w-[280px]">
              <TextField
                label={t('profile.fields.firstName')}
                placeholder={t('profile.fields.firstNamePlaceholder')}
                value={formData.firstName}
                onChange={(value) => setFormData(prev => ({ ...prev, firstName: value }))}
                icon={User}
                disabled={isSaving}
                maxLength={32}
              />
            </div>

            <div className="flex-1 min-w-[280px]">
              <TextField
                label={t('profile.fields.lastName')}
                placeholder={t('profile.fields.lastNamePlaceholder')}
                value={formData.lastName}
                onChange={(value) => setFormData(prev => ({ ...prev, lastName: value }))}
                icon={User}
                disabled={isSaving}
                maxLength={32}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <FormSectionHeader
          icon={Mail}
          title={t('profile.contactInfo.title')}
          description={t('profile.contactInfo.description')}
          className="mb-6"
        />

        <div className="flex flex-wrap gap-6">
          <div className="flex-1 min-w-[280px]">
            <TextField
              label={t('profile.fields.email')}
              placeholder={t('profile.fields.emailPlaceholder')}
              value={formData.email}
              onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
              icon={Mail}
              disabled={isSaving}
              maxLength={150}
            />
          </div>

          <div className="flex-1 min-w-[280px]">
            <TextField
              label={t('profile.fields.phone')}
              placeholder={t('profile.fields.phonePlaceholder')}
              value={formData.phone}
              onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
              icon={Phone}
              disabled={isSaving}
            />
          </div>
        </div>
      </div>

      {/* Account Security Section */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <FormSectionHeader
          icon={Shield}
          title={t('profile.accountSecurity.title')}
          description={t('profile.accountSecurity.description')}
          className="mb-6"
        />

        <div className="space-y-6">
          {/* Google Account Link/Unlink */}
          <GoogleAccountManager
            onSetPasswordClick={handleSetPasswordClick}
            returnUrl="/my-account"
          />

          {/* Password Section */}
          <div className="pt-4 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0 mb-4">
                <Label className="text-sm font-medium text-foreground">
                  {t('profile.accountSecurity.changePassword')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('profile.accountSecurity.changePasswordHint')}
                </p>
              </div>
            </div>

            {userHasPassword && (
              <div className="flex flex-wrap gap-6">
                <div className="flex-1 min-w-[280px]">
                  <TextField
                    id="current-password"
                    label={t('profile.accountSecurity.currentPassword')}
                    placeholder={t('profile.accountSecurity.currentPasswordPlaceholder')}
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    type="password"
                    icon={Lock}
                    disabled={isChangingPassword}
                    inputRef={passwordInputRef}
                  />
                </div>
                <div className="flex-1 min-w-[280px]" />
              </div>
            )}

            <div className="flex flex-wrap gap-6">
              <div className="flex-1 min-w-[280px] space-y-2 pt-2">
                <Label htmlFor="new-password" className="text-base font-medium">
                  {t('profile.accountSecurity.newPassword')}
                </Label>
                <Popover open={pwFocused} modal={false}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Input
                        ref={!userHasPassword ? passwordInputRef : undefined}
                        id="new-password"
                        type="password"
                        placeholder={t('profile.accountSecurity.newPasswordPlaceholder')}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); if (!pwInteracted) setPwInteracted(true); }}
                        onFocus={() => { setPwFocused(true); setPwInteracted(true); }}
                        onBlur={() => setPwFocused(false)}
                        disabled={isChangingPassword}
                        className="!pr-11 transition-all focus-visible:ring-1 focus-visible:ring-offset-0 border-border dark:border-border-subtle hover:border-border-strong focus:border-focus focus-visible:ring-focus"
                      />
                      <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="start"
                    sideOffset={8}
                    avoidCollisions={false}
                    className="p-0 border-none bg-transparent shadow-none w-auto"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <PasswordStrength password={newPassword} variant="panel" />
                  </PopoverContent>
                </Popover>
                <div className="min-h-[28px]">
                  {pwInteracted && newPassword.length > 0 ? (
                    <PasswordStrength password={newPassword} variant="bar" />
                  ) : (
                    <span className="invisible block text-xs leading-normal" aria-hidden="true">0</span>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-[280px]">
                <TextField
                  id="confirm-password"
                  label={t('profile.accountSecurity.confirmPassword')}
                  placeholder={t('profile.accountSecurity.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  type="password"
                  icon={Lock}
                  disabled={isChangingPassword}
                  error={confirmPassword.length > 0 && !passwordsMatch ? t('profile.toast.passwordsNoMatch') : undefined}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (canSubmitPassword) handleChangePassword();
                    }
                  }}
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                size="sm"
                rounded="full"
                className="!h-10 md:!h-11 !px-4 md:!px-6 !min-w-34 md:!w-44"
                onClick={handleChangePassword}
                disabled={!canSubmitPassword || isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('profile.accountSecurity.updating')}
                  </>
                ) : (
                  <>
                    {t('profile.accountSecurity.changePassword')}
                    <Save className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Legal Documents */}
          <div className="pt-4 border-t border-border">
            <div className="space-y-1 mb-3">
              <Label className="text-sm font-medium text-foreground">
                {t('profile.accountSecurity.legalTitle')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('profile.accountSecurity.legalDescription')}
              </p>
            </div>
            <div className="space-y-1">
              {(['terms', 'privacy', 'cookies'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLegalDialogType(type)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground-2 transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{t(`profile.accountSecurity.legal_${type}`)}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Settings Section */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm mb-10">
        <FormSectionHeader
          icon={Settings}
          title={t('advanced.title')}
          description={t('advanced.description')}
          className="mb-6"
        />
        <AdvancedAccountSection />
      </div>

      <LegalContentDialog
        type={legalDialogType}
        onOpenChange={(open) => { if (!open) setLegalDialogType(null); }}
      />
    </form>
  );
};

const AdvancedAccountSection = () => {
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

      {/* Account Actions */}
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

      {/* Leave Organisation confirmation */}
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

      {/* Must Leave All Organisations */}
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
    </div>
  );
};

export default MyAccountContent;
