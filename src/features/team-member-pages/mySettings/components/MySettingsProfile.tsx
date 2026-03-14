import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { User, Mail, Phone, Shield, Camera, Loader2, Save, Lock } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/button';
import { Label } from '../../../../shared/components/ui/label';
import { toast } from 'sonner';
import FormSectionHeader from '../../../../shared/components/forms/FormSectionHeader';
import TextField from '../../../../shared/components/forms/fields/TextField';
import { getTeamMemberProfile, updateTeamMemberProfile, changeTeamMemberPassword, uploadTeamMemberProfileImage, type TeamMemberProfile } from '../api';
import { setPasswordApi } from '../../../auth/api';
import { fetchCurrentUserAction } from '../../../auth/actions';
import GoogleAccountManager from '../../../settings/components/GoogleAccountManager';
import { translateMessageCode } from '../../../../shared/utils/error';

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

interface MySettingsProfileProps {
  onDirtyChange?: (isDirty: boolean) => void;
  onSavingChange?: (isSaving: boolean) => void;
}

const MySettingsProfile = ({ onDirtyChange, onSavingChange }: MySettingsProfileProps) => {
  const { t } = useTranslation('mySettings');
  const dispatch = useDispatch();
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
    if (!newPassword.trim()) {
      toast.error(t('profile.toast.enterPassword'));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t('profile.toast.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('profile.toast.passwordsNoMatch'));
      return;
    }

    setIsChangingPassword(true);
    try {
      // If user provides current password, use change password endpoint
      // If not (Google users setting password for first time), use set password endpoint
      if (currentPassword.trim()) {
        await changeTeamMemberPassword({
          currentPassword,
          newPassword,
        });
        toast.success(t('profile.toast.passwordChanged'));
      } else {
        await setPasswordApi({ password: newPassword });
        toast.success(t('profile.toast.passwordSet'));
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Refresh user data
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
      id="my-settings-profile-form"
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
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-white text-foreground-1 text-xs font-medium rounded-md shadow-lg hover:bg-gray-50 transition-colors border border-border ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
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
            returnUrl="/my-settings"
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
              <div className="flex-1 min-w-[280px]">
                <TextField
                  id="new-password"
                  label={t('profile.accountSecurity.newPassword')}
                  placeholder={t('profile.accountSecurity.newPasswordPlaceholder')}
                  value={newPassword}
                  onChange={setNewPassword}
                  type="password"
                  icon={Lock}
                  disabled={isChangingPassword}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 mt-2">
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleChangePassword();
                    }
                  }}
                />
              </div>
              <div className="flex-1 min-w-[280px]" />
            </div>

            <div className="pt-2">
              <Button
                type="button"
                size="sm"
                rounded="full"
                className="!h-10 md:!h-11 !px-4 md:!px-6 !min-w-34 md:!w-44"
                onClick={handleChangePassword}
                disabled={!newPassword.trim() || !confirmPassword.trim() || isChangingPassword}
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
        </div>
      </div>

    </form>
  );
};

export default MySettingsProfile;
