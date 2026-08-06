import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../../app/providers/store';
import { User, Mail, Phone, Camera, Loader2, Lock, FileText, ChevronRight, LogOut, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/button';
import { Label } from '../../../../shared/components/ui/label';
import { Input } from '../../../../shared/components/ui/input';
import { Skeleton } from '../../../../shared/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from '../../../../shared/components/ui/alert-dialog';
import {
  modalPanel,
  modalEyebrow,
  modalTitleCompact,
  modalBody,
  modalBodyMuted,
  modalHelperSmall,
  modalFooterRowRight,
  modalCancel,
  modalDestructive,
  modalPrimary,
} from '../../../../shared/components/ui/modal-tokens';
import { toast } from 'sonner';
import TextField from '../../../../shared/components/forms/fields/TextField';
import '../../../settings/components/Profile.css';
import { getTeamMemberProfile, updateTeamMemberProfile, changeTeamMemberPassword, uploadTeamMemberProfileImage, leaveOrganisationApi, type TeamMemberProfile } from '../api';
import {
  setPasswordApi,
  deleteAccountApi,
  changeAccountEmailApi,
  resendVerificationEmailApi,
} from '../../../auth/api';
import { fetchCurrentUserAction, logoutRequestAction } from '../../../auth/actions';
import GoogleAccountManager from '../../../settings/components/GoogleAccountManager';
import { getErrorMessage } from '../../../../shared/utils/error';
import { PasswordStrength } from '../../../auth/components/PasswordStrength';
import {
  validatePasswordPolicy,
  validatePersonName,
  requiredEmailError,
  isE164,
  sanitizePhoneToE164Draft,
} from '../../../../shared/utils/validation';
import { Popover, PopoverTrigger, PopoverContent } from '../../../../shared/components/ui/popover';
import { openLegalPage } from '../../../legal/legal-links';
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
  const [, setProfileData] = useState<TeamMemberProfile | null>(null);
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
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPwTouched, setCurrentPwTouched] = useState(false);

  // Account email change state
  const [showAccountEmailSection, setShowAccountEmailSection] = useState(false);
  const [currentEmailInput, setCurrentEmailInput] = useState('');
  const [newEmailInput, setNewEmailInput] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailFieldErrors, setEmailFieldErrors] = useState<{ currentEmail?: string; newEmail?: string }>({});

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Email verification resend state
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [resendLimitReached, setResendLimitReached] = useState(false);

  const validatePhone = (value: string): string | undefined => {
    const v = value.trim();
    if (!v) return undefined;
    return isE164(v) ? undefined : t('common:validation.phoneInvalid');
  };

  const validateAll = (): Record<string, string | undefined> => ({
    firstName: validatePersonName('firstName', formData.firstName, t) ?? undefined,
    lastName:  validatePersonName('lastName',  formData.lastName, t)  ?? undefined,
    phone:     validatePhone(formData.phone),
  });

  const userHasPassword = user?.hasPassword === true;
  const isPasswordPolicyValid = validatePasswordPolicy(newPassword, t) === true;
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmitPassword = isPasswordPolicyValid && passwordsMatch && confirmPassword.length > 0
    && (!userHasPassword || currentPassword.trim().length > 0);

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
      toast.error(getErrorMessage(error, t('profile.toast.loadFailed')));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch profile data on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProfile = async () => {
    const next = validateAll();
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      setTouched(Object.keys(next).reduce((a, k) => ({ ...a, [k]: true }), {} as Record<string, boolean>));
      toast.error(t('profile.toast.fixErrorsBeforeSave'));
      return;
    }

    setIsSaving(true);
    onSavingChange?.(true);
    try {
      await updateTeamMemberProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
      });
      toast.success(t('profile.toast.updateSuccess'));
      setOriginalFormData(formData);
      // Refresh user data in Redux
      dispatch(fetchCurrentUserAction.request());
    } catch (error: any) {
      toast.error(getErrorMessage(error, t('profile.toast.updateFailed')));
    } finally {
      setIsSaving(false);
      onSavingChange?.(false);
    }
  };

  // Check if form has changes
  const hasChanges = formData.firstName !== originalFormData.firstName ||
    formData.lastName !== originalFormData.lastName ||
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

  const resetAccountEmailForm = () => {
    setCurrentEmailInput('');
    setNewEmailInput('');
    setEmailFieldErrors({});
  };

  const handleAccountEmailSubmit = async () => {
    const currentEmail = currentEmailInput.trim();
    const newEmail = newEmailInput.trim();

    const localErrors: { currentEmail?: string; newEmail?: string } = {};
    const currentEmailErr = requiredEmailError('email', currentEmail, t);
    if (currentEmailErr) {
      localErrors.currentEmail = currentEmailErr;
    }
    const newEmailErr = requiredEmailError('email', newEmail, t);
    if (newEmailErr) {
      localErrors.newEmail = newEmailErr;
    } else if (!localErrors.currentEmail && newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      localErrors.newEmail = t('profile.toast.emailSame');
    }
    if (localErrors.currentEmail || localErrors.newEmail) {
      setEmailFieldErrors(localErrors);
      return;
    }

    setEmailFieldErrors({});
    setIsSavingEmail(true);
    try {
      await changeAccountEmailApi({ currentEmail, newEmail });
      toast.success(t('profile.toast.emailChanged'));
      resetAccountEmailForm();
      setShowAccountEmailSection(false);
      // Refresh user data + the team-member profile so the header/email display updates.
      dispatch(fetchCurrentUserAction.request());
      await fetchProfile();
    } catch (error: any) {
      const code = error?.response?.data?.code;
      if (code === 'CURRENT_EMAIL_MISMATCH') {
        setEmailFieldErrors({ currentEmail: t('profile.toast.emailCurrentMismatch') });
      } else if (code === 'EMAIL_TAKEN') {
        setEmailFieldErrors({ newEmail: t('profile.toast.emailTaken') });
      } else if (code === 'SAME_EMAIL') {
        setEmailFieldErrors({ newEmail: t('profile.toast.emailSame') });
      } else {
        toast.error(getErrorMessage(error, t('profile.toast.emailChangeFailed')));
      }
    } finally {
      setIsSavingEmail(false);
    }
  };

  const canSubmitAccountEmail =
    currentEmailInput.trim().length > 0 &&
    newEmailInput.trim().length > 0 &&
    !isSavingEmail;

  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    try {
      const response = await resendVerificationEmailApi();
      if (response.alreadyVerified) {
        toast.success(t('profile.emailVerification.toast.alreadyVerified'));
        dispatch(fetchCurrentUserAction.request());
      } else {
        toast.success(t('profile.emailVerification.toast.sent'));
        setVerificationEmailSent(true);
        if (response.remaining === 0) {
          setResendLimitReached(true);
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 429) {
        setResendLimitReached(true);
      }
      toast.error(getErrorMessage(error));
    } finally {
      setIsResendingVerification(false);
    }
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
      toast.error(getErrorMessage(error, t('profile.toast.imageUploadFailed')));
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
    const policyResult = validatePasswordPolicy(newPassword, t);
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
      setShowPasswordSection(false);
      setCurrentPwTouched(false);
      dispatch(fetchCurrentUserAction.request());
    } catch (error: any) {
      toast.error(getErrorMessage(error, t('profile.toast.passwordUpdateFailed')));
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-grid">
          <div className="profile-col">
            {/* Hero Skeleton */}
            <div className="profile-hero profile-tone-neutral">
              <div className="profile-hero-left">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <div className="profile-hero-meta space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
            </div>

            {/* Personal Information Skeleton */}
            <div className="profile-section">
              <div className="profile-section-header">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
              <div className="profile-field-stack">
                <div className="profile-avatar">
                  <Skeleton className="h-[88px] w-[88px] rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-20 rounded-full" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <div className="profile-field-grid">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Skeleton */}
            <div className="profile-section">
              <div className="profile-section-header">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <div className="profile-field-grid">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>

            {/* Account Security Skeleton */}
            <div className="profile-section">
              <div className="profile-section-header">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-3 w-72" />
                </div>
              </div>
              <div className="profile-field-stack">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
                <div className="profile-divider" />
                <div className="space-y-2 mb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <div className="profile-field-grid">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <Skeleton className="h-9 w-36" />
              </div>
            </div>
          </div>
        </div>
    );
  }

  const displayName = `${formData.firstName} ${formData.lastName}`.trim() || formData.email || t('profile.hero.placeholderName');

  return (
    <form
      id="my-account-form"
      onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}
    >
      <div className="profile-grid">
        <div className="profile-col">
          {/* Hidden file input for avatar upload (triggered from hero edit button) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,image/avif"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Hero band */}
          <header className="profile-hero profile-tone-neutral">
            <div className="profile-hero-left">
              <div className="profile-hero-crest">
                <div className="profile-hero-crest-frame">
                  {formData.profileImage ? (
                    <img src={formData.profileImage} alt="" />
                  ) : (
                    <User aria-hidden />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="profile-hero-crest-edit"
                  aria-label={isUploadingImage ? t('profile.profilePhoto.uploading') : t('profile.profilePhoto.edit')}
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <div className="profile-hero-meta">
                <div className="profile-eyebrow">{t('profile.hero.eyebrow')}</div>
                <h2>{displayName}</h2>
                <div className="profile-row2">
                  {formData.email && <span>{formData.email}</span>}
                  {user?.role && (
                    <>
                      <span className="profile-sep" aria-hidden>·</span>
                      <span>{t(`roles.${user.role}`, {
                        defaultValue: user.role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                      })}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="profile-hero-right">
              {user && (user.emailVerified ? (
                <span className="profile-pill profile-pill-verified">
                  <CheckCircle className="h-3 w-3" />
                  {t('profile.hero.emailVerified')}
                </span>
              ) : (
                <span className="profile-pill profile-pill-warn">
                  <AlertTriangle className="h-3 w-3" />
                  {t('profile.hero.emailNotVerified')}
                </span>
              ))}
            </div>
          </header>

          {/* Section: Personal Information */}
          <section className="profile-section" aria-labelledby="profile-section-personal">
            <header className="profile-section-header">
              <div>
                <h3 id="profile-section-personal" className="profile-section-title">{t('profile.personalInfo.title')}</h3>
                <p className="profile-section-sub">{t('profile.personalInfo.description')}</p>
              </div>
            </header>

            <div className="profile-field-stack">
              <div className="profile-field-grid">
                <TextField
                  label={t('profile.fields.firstName')}
                  placeholder={t('profile.fields.firstNamePlaceholder')}
                  value={formData.firstName}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, firstName: value }));
                    setErrors(prev => ({ ...prev, firstName: validatePersonName('firstName', value, t) ?? undefined }));
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
                  error={touched.firstName ? errors.firstName : undefined}
                  icon={User}
                  disabled={isSaving}
                  maxLength={32}
                  required
                />
                <TextField
                  label={t('profile.fields.lastName')}
                  placeholder={t('profile.fields.lastNamePlaceholder')}
                  value={formData.lastName}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, lastName: value }));
                    setErrors(prev => ({ ...prev, lastName: validatePersonName('lastName', value, t) ?? undefined }));
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
                  error={touched.lastName ? errors.lastName : undefined}
                  icon={User}
                  disabled={isSaving}
                  maxLength={32}
                  required
                />
              </div>
            </div>
          </section>

          {/* Section: Contact Information */}
          <section className="profile-section" aria-labelledby="profile-section-contact">
            <header className="profile-section-header">
              <div>
                <h3 id="profile-section-contact" className="profile-section-title">{t('profile.contactInfo.title')}</h3>
                <p className="profile-section-sub">{t('profile.contactInfo.description')}</p>
              </div>
            </header>

            <div className="profile-field-stack">
              {/* Email verification status */}
              <div className="profile-subgroup">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="profile-subgroup-head flex-1 min-w-0">
                    <div className="profile-subgroup-title flex items-center gap-2 flex-wrap">
                      <span>{t('profile.emailVerification.title')}</span>
                      {user && (user.emailVerified ? (
                        <span className="profile-pill profile-pill-verified">
                          <CheckCircle className="h-3 w-3" />
                          {t('profile.emailVerification.statusVerified')}
                        </span>
                      ) : (
                        <span className="profile-pill profile-pill-warn">
                          <AlertTriangle className="h-3 w-3" />
                          {t('profile.emailVerification.statusNotVerified')}
                        </span>
                      ))}
                    </div>
                    {user?.email && (
                      <div className="profile-subgroup-sub">
                        <span className="font-medium">{user.email}</span>
                      </div>
                    )}
                  </div>
                  {user && !user.emailVerified && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResendingVerification || resendLimitReached}
                      className="profile-btn-ghost profile-btn-compact shrink-0 self-start sm:self-auto"
                    >
                      {isResendingVerification ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {t('profile.emailVerification.sending')}
                        </>
                      ) : (
                        <>
                          <Mail className="h-3 w-3" />
                          {t('profile.emailVerification.resend')}
                        </>
                      )}
                    </button>
                  )}
                </div>

                {user && !user.emailVerified && (
                  verificationEmailSent ? (
                    <div className="profile-banner profile-banner-good">
                      <CheckCircle className="profile-banner-icon h-3.5 w-3.5" />
                      <div className="profile-banner-body">{t('profile.emailVerification.sentHint')}</div>
                    </div>
                  ) : resendLimitReached ? (
                    <div className="profile-banner profile-banner-warn">
                      <AlertTriangle className="profile-banner-icon h-3.5 w-3.5" />
                      <div className="profile-banner-body">{t('profile.emailVerification.limitHint')}</div>
                    </div>
                  ) : (
                    <div className="profile-banner profile-banner-warn">
                      <AlertTriangle className="profile-banner-icon h-3.5 w-3.5" />
                      <div className="profile-banner-body">{t('profile.emailVerification.notVerifiedHint')}</div>
                    </div>
                  )
                )}

                <div className="profile-banner profile-banner-info">
                  <Info className="profile-banner-icon h-3.5 w-3.5" />
                  <div className="profile-banner-body">{t('profile.emailVerification.whyItMatters')}</div>
                </div>
              </div>

              <div className="profile-divider" />

              <div className="profile-field-grid">
                <TextField
                  label={t('profile.fields.phone')}
                  placeholder={t('profile.fields.phonePlaceholder')}
                  value={formData.phone}
                  onChange={(value) => {
                    const sanitized = sanitizePhoneToE164Draft(value);
                    setFormData(prev => ({ ...prev, phone: sanitized }));
                    setErrors(prev => ({ ...prev, phone: validatePhone(sanitized) }));
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                  error={touched.phone ? errors.phone : undefined}
                  icon={Phone}
                  disabled={isSaving}
                />
              </div>
            </div>
          </section>

          {/* Section: Account Security */}
          <section className="profile-section" aria-labelledby="profile-section-security">
            <header className="profile-section-header">
              <div>
                <h3 id="profile-section-security" className="profile-section-title">{t('profile.accountSecurity.title')}</h3>
                <p className="profile-section-sub">{t('profile.accountSecurity.description')}</p>
              </div>
            </header>

            <div className="profile-field-stack">
              <GoogleAccountManager
                onSetPasswordClick={handleSetPasswordClick}
                returnUrl="/my-account"
              />

              <div className="profile-divider" />

              {/* Account email change */}
              <div className="profile-subgroup">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="profile-subgroup-head flex-1 min-w-0">
                    <div className="profile-subgroup-title">{t('profile.accountSecurity.changeEmail')}</div>
                    <div className="profile-subgroup-sub">{t('profile.accountSecurity.changeEmailDescription')}</div>
                    {user?.email && (
                      <div className="profile-subgroup-sub mt-1">
                        <span className="text-muted-foreground">{t('profile.accountSecurity.currentEmailLabel')}:</span>{' '}
                        <span className="font-medium">{user.email}</span>
                      </div>
                    )}
                  </div>
                  {!showAccountEmailSection && (
                    <button
                      type="button"
                      onClick={() => setShowAccountEmailSection(true)}
                      className="profile-btn-ghost profile-btn-compact shrink-0 self-start sm:self-auto"
                    >
                      <Mail className="h-3 w-3" />
                      {t('profile.accountSecurity.changeEmailReveal')}
                    </button>
                  )}
                </div>

                {showAccountEmailSection && (
                  <>
                    <div className="profile-field-grid">
                      <TextField
                        id="current-account-email"
                        label={t('profile.accountSecurity.currentEmail')}
                        placeholder={t('profile.accountSecurity.currentEmailPlaceholder')}
                        value={currentEmailInput}
                        onChange={(value) => {
                          setCurrentEmailInput(value);
                          if (emailFieldErrors.currentEmail) {
                            setEmailFieldErrors(prev => ({ ...prev, currentEmail: undefined }));
                          }
                        }}
                        type="email"
                        icon={Mail}
                        autoComplete="email"
                        disabled={isSavingEmail}
                        error={emailFieldErrors.currentEmail}
                      />
                      <TextField
                        id="new-account-email"
                        label={t('profile.accountSecurity.newEmail')}
                        placeholder={t('profile.accountSecurity.newEmailPlaceholder')}
                        value={newEmailInput}
                        onChange={(value) => {
                          setNewEmailInput(value);
                          if (emailFieldErrors.newEmail) {
                            setEmailFieldErrors(prev => ({ ...prev, newEmail: undefined }));
                          }
                        }}
                        type="email"
                        icon={Mail}
                        autoComplete="email"
                        disabled={isSavingEmail}
                        error={emailFieldErrors.newEmail}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (canSubmitAccountEmail) handleAccountEmailSubmit();
                          }
                        }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAccountEmailSection(false);
                          resetAccountEmailForm();
                        }}
                        disabled={isSavingEmail}
                        className="profile-btn-ghost"
                      >
                        {t('profile.accountSecurity.changeEmailCancel')}
                      </button>
                      <Button
                        type="button"
                        size="sm"
                        rounded="full"
                        className="!h-10 md:!h-11 !px-4 md:!px-6 !min-w-34 md:!w-44"
                        onClick={handleAccountEmailSubmit}
                        disabled={!canSubmitAccountEmail}
                      >
                        {isSavingEmail ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('profile.accountSecurity.updating')}
                          </>
                        ) : (
                          t('profile.accountSecurity.changeEmailButton')
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <div className="profile-divider" />

              {/* Password change */}
              <div className="profile-subgroup">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="profile-subgroup-head flex-1 min-w-0">
                    <div className="profile-subgroup-title">{t('profile.accountSecurity.changePassword')}</div>
                    <div className="profile-subgroup-sub">{t('profile.accountSecurity.changePasswordHint')}</div>
                  </div>
                  {!showPasswordSection && (
                    <button
                      type="button"
                      onClick={() => setShowPasswordSection(true)}
                      className="profile-btn-ghost profile-btn-compact shrink-0 self-start sm:self-auto"
                    >
                      <Lock className="h-3 w-3" />
                      {t('profile.accountSecurity.changePasswordReveal')}
                    </button>
                  )}
                </div>

                {showPasswordSection && (
                  <>
                    {userHasPassword && (
                      <div className="profile-field-grid">
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
                          readOnly={!currentPwTouched}
                          onFocus={() => setCurrentPwTouched(true)}
                        />
                        <div />
                      </div>
                    )}

                    <div className="profile-field-grid">
                      <div className="space-y-2 pt-2">
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
                                autoComplete="new-password"
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
                      <TextField
                        id="confirm-password"
                        label={t('profile.accountSecurity.confirmPassword')}
                        placeholder={t('profile.accountSecurity.confirmPasswordPlaceholder')}
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        type="password"
                        icon={Lock}
                        disabled={isChangingPassword}
                        autoComplete="new-password"
                        error={confirmPassword.length > 0 && !passwordsMatch ? t('profile.toast.passwordsNoMatch') : undefined}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (canSubmitPassword) handleChangePassword();
                          }
                        }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordSection(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                          setPwInteracted(false);
                          setCurrentPwTouched(false);
                        }}
                        disabled={isChangingPassword}
                        className="profile-btn-ghost"
                      >
                        {t('profile.accountSecurity.changePasswordCancel')}
                      </button>
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
                          t('profile.accountSecurity.changePassword')
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <div className="profile-divider" />

              {/* Legal Documents */}
              <div className="profile-subgroup">
                <div className="profile-subgroup-head">
                  <div className="profile-subgroup-title">{t('profile.accountSecurity.legalTitle')}</div>
                  <div className="profile-subgroup-sub">{t('profile.accountSecurity.legalDescription')}</div>
                </div>
                <div>
                  {(['terms', 'privacy', 'cookies'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => openLegalPage(type)}
                      className="profile-line-row"
                    >
                      <div className="profile-line-icon"><FileText className="h-4 w-4" /></div>
                      <div className="profile-line-lbl">{t(`profile.accountSecurity.legal_${type}`)}</div>
                      <ChevronRight className="profile-line-chev h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section: Advanced */}
          <section className="profile-section" aria-labelledby="profile-section-advanced">
            <header className="profile-section-header">
              <div>
                <h3 id="profile-section-advanced" className="profile-section-title">{t('advanced.title')}</h3>
                <p className="profile-section-sub">{t('advanced.description')}</p>
              </div>
            </header>
            <AdvancedAccountSection />
          </section>
        </div>
      </div>

    </form>
  );
};

const AdvancedAccountSection = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('advancedSettings');
  const { isDashboardUser } = usePermissions();

  // Leave organisation state
  const [isLeavingOrganisation, setIsLeavingOrganisation] = useState(false);
  const [showLeaveOrgConfirm, setShowLeaveOrgConfirm] = useState(false);
  const [showLeaveOrgSuccess, setShowLeaveOrgSuccess] = useState(false);
  const [activeAppointmentsCount, setActiveAppointmentsCount] = useState<number | null>(null);

  // Account deletion state
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Leave Organisation ──────────────────────────────────────────────

  const handleLeaveOrganisation = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
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
        toast.error(getErrorMessage(error, t('common:errors.failedToLeaveOrganisation')));
      }
    } finally {
      setIsLeavingOrganisation(false);
    }
  };

  const handleLeaveOrgSuccessOk = () => {
    setShowLeaveOrgSuccess(false);
    dispatch(logoutRequestAction.request());
  };

  // ── Account Deletion (immediate) ───────────────────────────────────

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
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t('toast.failedDelete')));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="profile-field-stack">
      {/* Account Actions */}
      <div className="flex flex-col gap-4">
        {/* Leave Organisation — hidden for dashboard_user */}
        {!isDashboardUser && (
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 rounded-xl border border-border bg-surface-hover/50 p-4 sm:p-5">
            <div className="space-y-1 min-w-0 flex-1">
              <h4 className="text-[14px] font-semibold text-foreground-1 leading-tight">{t('leaveOrganisation.title')}</h4>
              <p className="text-[13px] text-foreground-2 leading-[1.45]">
                {t('leaveOrganisation.cardDescription')}
              </p>
              <div className="profile-banner profile-banner-info" style={{ marginTop: 10 }}>
                <Info className="profile-banner-icon h-3.5 w-3.5" />
                <div className="profile-banner-body" style={{ fontSize: 12 }}>
                  {t('leaveOrganisation.cardHint')}
                </div>
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
          </div>
        )}

        {/* Delete Account */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 rounded-xl border border-border bg-surface-hover/50 p-4 sm:p-5">
          <div className="space-y-1 min-w-0 flex-1">
            <h4 className="text-[14px] font-semibold text-foreground-1 leading-tight">{t('dangerZone.deleteAccount.title')}</h4>
            <p className="text-[13px] text-foreground-2 leading-[1.45]">{t('dangerZone.deleteAccount.description')}</p>
            <p className="text-[12px] text-foreground-3">{t('dangerZone.deleteAccount.irreversible')}</p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            rounded="full"
            onClick={handleDeleteClick}
            loading={isDeleting}
            className="shrink-0 !h-9 !px-4"
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            {t('dangerZone.deleteAccount.button')}
          </Button>
        </div>
      </div>

      {/* Leave Organisation confirmation */}
      <AlertDialog open={showLeaveOrgConfirm} onOpenChange={(open) => !open && setShowLeaveOrgConfirm(false)}>
        <AlertDialogContent className={modalPanel}>
          <AlertDialogHeader className="space-y-4 !text-left">
            <div className={modalEyebrow}>{t('leaveOrganisation.confirmEyebrow')}</div>
            <AlertDialogTitle className={`${modalTitleCompact} text-left`}>
              {t('leaveOrganisation.confirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p className={modalBody}>{t('leaveOrganisation.confirmMessage')}</p>
                <p className={modalBodyMuted}>{t('leaveOrganisation.confirmHint')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={`${modalFooterRowRight} mt-7`}>
            <button
              type="button"
              onClick={() => setShowLeaveOrgConfirm(false)}
              className={modalCancel}
              disabled={isLeavingOrganisation}
            >
              {t('leaveOrganisation.cancel')}
            </button>
            <button
              type="button"
              onClick={handleLeaveOrgConfirm}
              className={modalDestructive}
              disabled={isLeavingOrganisation}
            >
              {isLeavingOrganisation ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('leaveOrganisation.leaving')}</span>
                </>
              ) : (
                <span>{t('leaveOrganisation.confirmButton')}</span>
              )}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Organisation success */}
      <AlertDialog open={showLeaveOrgSuccess} onOpenChange={(open) => !open && handleLeaveOrgSuccessOk()}>
        <AlertDialogContent className={modalPanel}>
          <AlertDialogHeader className="space-y-4 !text-left">
            <div className={modalEyebrow}>{t('leaveOrganisation.successEyebrow')}</div>
            <AlertDialogTitle className={`${modalTitleCompact} text-left`}>
              {t('leaveOrganisation.successTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p className={modalBody}>{t('leaveOrganisation.successMessage')}</p>
                <p className={modalBodyMuted}>{t('leaveOrganisation.successHint')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={`${modalFooterRowRight} mt-7`}>
            <button type="button" onClick={handleLeaveOrgSuccessOk} className={modalPrimary}>
              <span>{t('leaveOrganisation.successButton')}</span>
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Active Appointments — info modal when leave is blocked */}
      <AlertDialog open={activeAppointmentsCount !== null} onOpenChange={(open) => !open && setActiveAppointmentsCount(null)}>
        <AlertDialogContent className={modalPanel}>
          <AlertDialogHeader className="space-y-4 !text-left">
            <div className={modalEyebrow}>{t('activeAppointments.eyebrow')}</div>
            <AlertDialogTitle className={`${modalTitleCompact} text-left`}>
              {t('activeAppointments.title')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                {activeAppointmentsCount !== null && (
                  <p className={modalBody}>
                    {t('activeAppointments.message', { count: activeAppointmentsCount })}
                  </p>
                )}
                <p className={modalBodyMuted}>{t('activeAppointments.hint')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={`${modalFooterRowRight} mt-7`}>
            <button type="button" onClick={() => setActiveAppointmentsCount(null)} className={modalPrimary}>
              <span>{t('activeAppointments.understood')}</span>
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account confirmation — final, immediate */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(false)}>
        <AlertDialogContent className={modalPanel}>
          <AlertDialogHeader className="space-y-4 !text-left">
            <div className={modalEyebrow}>{t('deleteAccountDialog.eyebrow')}</div>
            <AlertDialogTitle className={`${modalTitleCompact} text-left`}>
              {t('deleteAccountDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-left">
                <p className={modalBody}>{t('deleteAccountDialog.intro')}</p>
                <ul className={`${modalBody} list-disc space-y-1.5 pl-5 marker:text-neutral-400 dark:marker:text-neutral-500`}>
                  <li>{t('deleteAccountDialog.bullets.appointments')}</li>
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
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className={modalCancel}
              disabled={isDeleting}
            >
              {t('deleteAccountDialog.cancel')}
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className={modalDestructive}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('deleteAccountDialog.deleting')}</span>
                </>
              ) : (
                <span>{t('deleteAccountDialog.confirmDelete')}</span>
              )}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyAccountContent;
