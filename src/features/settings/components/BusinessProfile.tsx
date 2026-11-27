import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Building2, Mail, Phone, Globe, Instagram, Facebook, Camera, Loader2, Lock, Info, FileText, ChevronRight, ChevronDown, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Label } from '../../../shared/components/ui/label';
import { toast } from 'sonner';
import { ImageCropDialog } from '../../../shared/components/common/ImageCropDialog';
import CurrencySelect from '../../../shared/components/common/CurrencySelect';
import TextField from '../../../shared/components/forms/fields/TextField';
import TextareaField from '../../../shared/components/forms/fields/TextareaField';
import './Profile.css';
import OptionSelect from '../../../shared/components/common/OptionSelect';
import { uploadBusinessLogo } from '../api';
import GoogleAccountManager from './GoogleAccountManager';
import AppleAccountManager from './AppleAccountManager';
import AdvancedSettings from './AdvancedSettings';
import MobilePushNotifications from './MobilePushNotifications';
import { fetchCurrentBusinessAction } from '../../business/actions';
import { updateBusinessApi } from '../../business/api';
import { profileLinkLimits, profileRequestError, profileSaveErrors } from './profileSaveErrors';
import type { UpdateBusinessDTO } from '../../business/types';
import { getCurrentBusinessSelector, getBusinessLoadingSelector, getBusinessErrorSelector } from '../../business/selectors';
import { ErrorState } from '../../../shared/components/common/ErrorState';
import { Skeleton } from '../../../shared/components/ui/skeleton';
import { fetchCurrentUserAction } from '../../auth/actions';
import { setPasswordApi, changeOwnerPasswordApi, changeAccountEmailApi, resendVerificationEmailApi } from '../../auth/api';
import { getErrorMessage } from '../../../shared/utils/error';
import { useIsMobile } from '../../../shared/hooks/use-mobile';
import type { RootState } from '../../../app/providers/store';
import { industryApi } from '../../../shared/api/industry.api';
import type { Industry } from '../../../shared/types/industry';
import { PasswordStrength } from '../../auth/components/PasswordStrength';
import { PersonalInformationSection, type PersonalInformationSectionRef } from './PersonalInformationSection';
import {
  validatePasswordPolicy,
  validateBusinessName,
  validateDescription,
  requiredEmailError,
  isE164,
  sanitizePhoneToE164Draft,
  validateUrlField,
  normalizeProfileLink,
} from '../../../shared/utils/validation';
import { Input } from '../../../shared/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '../../../shared/components/ui/popover';
import { openLegalPage } from '../../legal/legal-links';

const toTitleCase = (s: string) =>
  s.replace(/\b\w/g, (c) => c.toUpperCase());

interface BusinessFormData {
  businessName: string;
  description: string;
  industryId: number | null;
  businessEmail: string;
  businessPhone: string;
  timeZone: string;
  country: string;
  businessCurrency: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  websiteUrl: string;
  pinterestUrl: string;
  bookingSlug: string;
  logo?: string | null;
  logoKey?: string | null;
}

const initialFormData: BusinessFormData = {
  businessName: '',
  description: '',
  industryId: null,
  businessEmail: '',
  businessPhone: '',
  timeZone: 'America/New_York',
  country: '',
  businessCurrency: 'eur',
  instagramUrl: '',
  facebookUrl: '',
  tiktokUrl: '',
  websiteUrl: '',
  pinterestUrl: '',
  bookingSlug: '',
  logo: null,
  logoKey: null,
};

/** Fields that are sent in the business update payload - used for dirty check.
 *  Note: businessEmail is intentionally excluded. The owner's account email is changed
 *  via POST /auth/change-email (in the Account security section), which performs
 *  verification, dual notification, and session revocation. */
const getUpdatePayloadSnapshot = (data: BusinessFormData) => ({
  businessName: data.businessName,
  description: data.description ?? '',
  industryId: data.industryId,
  businessPhone: data.businessPhone,
  businessCurrency: data.businessCurrency,
  instagramUrl: data.instagramUrl,
  facebookUrl: data.facebookUrl,
  tiktokUrl: data.tiktokUrl,
  websiteUrl: data.websiteUrl,
  pinterestUrl: data.pinterestUrl,
});

type BusinessSnapshot = ReturnType<typeof getUpdatePayloadSnapshot>;

const socialFields = [
  { field: 'instagramUrl', label: 'instagram', icon: Instagram },
  { field: 'facebookUrl', label: 'facebook', icon: Facebook },
  { field: 'tiktokUrl', label: 'tiktok', icon: Globe },
  { field: 'websiteUrl', label: 'website', icon: Globe },
  { field: 'pinterestUrl', label: 'pinterest', icon: Globe },
] as const;

function changedBusinessFields(current: BusinessSnapshot, baseline?: BusinessSnapshot | null): Partial<BusinessSnapshot> {
  if (!baseline) return {};
  return Object.fromEntries(Object.entries(current).filter(
    ([field, value]) => value !== baseline[field as keyof BusinessSnapshot],
  ));
}

interface BusinessProfileProps {
  onDirtyChange?: (dirty: boolean) => void;
  onSavingChange?: (saving: boolean) => void;
}

const BusinessProfile: React.FC<BusinessProfileProps> = ({ onDirtyChange, onSavingChange }) => {
  const { t } = useTranslation('settings');
  const { t: tIndustry } = useTranslation('industries');
  const isMobile = useIsMobile();
  const dispatch = useDispatch();
  const currentBusiness = useSelector(getCurrentBusinessSelector);
  const isBusinessLoading = useSelector(getBusinessLoadingSelector);
  const businessError = useSelector(getBusinessErrorSelector);
  const user = useSelector((state: RootState) => state.auth.user);
  // Owners that haven't finished the setup wizard have no business yet, so
  // /business/profile would 403. Skip the business fetch and render only the
  // account-level sections (security, push notifications, delete account).
  const isOwnerWithoutBusiness = user?.role === 'owner' && !user?.wizardCompleted;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const emailVerificationRef = useRef<HTMLDivElement>(null);
  const personalRef = useRef<PersonalInformationSectionRef>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const savingRef = useRef(false);
  const mounted = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const baselineRef = useRef<{ id: number; snapshot: BusinessSnapshot } | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      onSavingChange?.(false);
    };
  }, [onSavingChange]);
  const [personalDirty, setPersonalDirty] = useState(false);

  const [formData, setFormData] = useState<BusinessFormData>(initialFormData);
  const [originalSnapshot, setOriginalSnapshot] = useState<BusinessSnapshot | null>(null);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
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


  // Email verification resend state
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [resendLimitReached, setResendLimitReached] = useState(false);

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const CURRENCY_WHITELIST = ['eur','usd','ron','gbp','chf','sek','nok','dkk','pln','czk','huf','bgn','hrk','try'];

  const validatePhone = (value: string): string | undefined => {
    const v = value.trim();
    if (!v) return t('common:validation.phoneRequired');
    return isE164(v) ? undefined : t('common:validation.phoneInvalid');
  };

  const validateAll = (): Record<string, string | undefined> => ({
    businessName: validateBusinessName(formData.businessName, t) ?? undefined,
    businessPhone: validatePhone(formData.businessPhone),
    industryId: formData.industryId == null ? t('common:validation.industryRequired') : undefined,
    description: validateDescription(formData.description, t, 500) ?? undefined,
    businessCurrency: CURRENCY_WHITELIST.includes(formData.businessCurrency?.toLowerCase())
      ? undefined
      : t('common:validation.currencyInvalid'),
    ...Object.fromEntries(socialFields.map(({ field }) => [
      field, validateUrlField(formData[field], t, profileLinkLimits[field]) ?? undefined,
    ])),
  });

  const userHasPassword = user?.hasPassword === true;
  const isPasswordPolicyValid = validatePasswordPolicy(newPassword, t) === true;
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmitPassword = isPasswordPolicyValid && passwordsMatch && confirmPassword.length > 0
    && (!userHasPassword || currentPassword.trim().length > 0);

  // Fetch business data on mount (skipped pre-wizard: no business exists yet)
  useEffect(() => {
    if (isOwnerWithoutBusiness) return;
    dispatch(fetchCurrentBusinessAction.request());
  }, [dispatch, isOwnerWithoutBusiness]);

  // Fetch industries on mount (only used by the business form)
  useEffect(() => {
    if (isOwnerWithoutBusiness) return;
    industryApi
      .getAll()
      .then(setIndustries)
      .catch((err) => {
        console.error('Failed to fetch industries:', err);
        toast.error(t('profile.toast.industriesLoadFailed'));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwnerWithoutBusiness]);

  // Populate form when business data is loaded (and set baseline for dirty check)
  useEffect(() => {
    if (currentBusiness) {
      const data = {
        businessName: currentBusiness.name || '',
        description: currentBusiness.description || '',
        industryId: currentBusiness.industry?.id ?? null,
        businessEmail: currentBusiness.email || '',
        businessPhone: currentBusiness.phone || '',
        timeZone: currentBusiness.timezone || 'America/New_York',
        country: currentBusiness.country || '',
        businessCurrency: currentBusiness.businessCurrency || 'eur',
        instagramUrl: currentBusiness.instagramUrl || '',
        facebookUrl: currentBusiness.facebookUrl || '',
        tiktokUrl: currentBusiness.tiktokUrl || '',
        websiteUrl: currentBusiness.websiteUrl || '',
        pinterestUrl: currentBusiness.pinterestUrl || '',
        bookingSlug: currentBusiness.uuid || '',
        logo: currentBusiness.logo || null,
        logoKey: null,
      };
      const previous = baselineRef.current;
      const snapshot = getUpdatePayloadSnapshot(data);
      baselineRef.current = { id: currentBusiness.id, snapshot };
      setOriginalSnapshot(snapshot);
      // Keep newer edits when a background fetch refreshes the same business.
      setFormData(current => ({
        ...data,
        ...changedBusinessFields(getUpdatePayloadSnapshot(current),
          previous?.id === currentBusiness.id ? previous.snapshot : null),
      }));
      if (previous?.id !== currentBusiness.id) {
        setTouched({});
        setErrors({});
      }
    } else {
      baselineRef.current = null;
    }
  }, [currentBusiness]);

  const changes = useMemo(() => changedBusinessFields(
    getUpdatePayloadSnapshot(formData), originalSnapshot,
  ), [formData, originalSnapshot]);
  const isDirty = Object.keys(changes).length > 0;

  useEffect(() => {
    onDirtyChange?.(isDirty || personalDirty);
  }, [isDirty, personalDirty, onDirtyChange]);

  const selectedIndustryName = useMemo(() => {
    if (formData.industryId == null) return null;
    const found = industries.find(i => i.id === formData.industryId);
    return found ? tIndustry(found.slug, toTitleCase(found.name)) : null;
  }, [formData.industryId, industries, tIndustry]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
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

    setPendingLogo(file);
  };

  const uploadSelectedLogo = async (file: File) => {
    setPendingLogo(null);
    try {
      setIsUploadingLogo(true);
      const response = await uploadBusinessLogo(file);
      
      setFormData(prev => ({
        ...prev,
        logo: response.logo,
        logoKey: response.logoKey,
      }));
      
      toast.success(t('profile.toast.logoUploaded'));
      
      // Refresh user data to update sidebar logo
      dispatch(fetchCurrentUserAction.request());
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(getErrorMessage(error, t('profile.toast.logoUploadFailed')));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isOwnerWithoutBusiness || !currentBusiness || savingRef.current) return;

    const personal = personalRef.current;
    const names = personal?.getChanges() ?? {};
    const savePersonal = Object.keys(names).length > 0;
    if (!isDirty && !savePersonal) return;

    const focusInvalid = () => requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('fieldset [aria-invalid="true"]')?.focus();
    });
    const showBusinessErrors = (fields: Record<string, string>) => {
      setErrors(fields);
      setTouched(Object.fromEntries(Object.keys(fields).map(field => [field, true])));
    };
    const validation = validateAll();
    const invalid: Record<string, string> = {};
    for (const [field, message] of Object.entries(validation)) {
      if (message && Object.hasOwn(changes, field)) invalid[field] = message;
    }
    showBusinessErrors(invalid);
    const personalValid = personal?.validate(names) ?? true;
    if (!personalValid || Object.keys(invalid).length) {
      focusInvalid();
      return;
    }

    const submitted = getUpdatePayloadSnapshot(formData);
    const businessId = currentBusiness.id;
    const isCurrent = () => mounted.current && baselineRef.current?.id === businessId;
    savingRef.current = true;
    setIsSaving(true);
    onSavingChange?.(true);
    try {
      const { businessName, businessPhone, industryId, ...rest } = changes;
      const payload: UpdateBusinessDTO = {
        ...rest,
        ...names,
        name: businessName?.trim(),
        phone: businessPhone?.trim(),
        industryId: industryId ?? undefined,
      };
      const accepted = { ...changes };
      if (payload.name !== undefined) accepted.businessName = payload.name;
      if (payload.phone !== undefined) accepted.businessPhone = payload.phone;
      for (const { field } of socialFields) {
        const raw = changes[field];
        if (raw === undefined) continue;
        const normalized = normalizeProfileLink(raw);
        payload[field] = normalized;
        accepted[field] = normalized;
      }

      const response = await updateBusinessApi(payload);
      if (isDirty) dispatch(fetchCurrentBusinessAction.request());
      dispatch(fetchCurrentUserAction.request());
      const baseline = baselineRef.current;
      if (!isCurrent() || !baseline) return;
      if (savePersonal) personal?.acceptSaved(names);
      if (isDirty) {
        const snapshot = { ...baseline.snapshot, ...accepted };
        baselineRef.current = { ...baseline, snapshot };
        setOriginalSnapshot(snapshot);
        setFormData(current => ({
          ...current, ...accepted, ...changedBusinessFields(getUpdatePayloadSnapshot(current), submitted),
        }));
      }
      const successKey = !savePersonal ? 'business:page.toasts.updateSuccess'
        : isDirty ? 'profile.toast.changesSaved' : 'profile.personal.toast.saved';
      toast.success(t(successKey));
      if (response.shouldRedirectToMarketplace) {
        window.location.href = '/marketplace?tab=business#industry';
      }
    } catch (error) {
      if (!isCurrent()) return;
      const { firstName, lastName, ...businessFields } = profileSaveErrors(error, t);
      if (firstName || lastName || Object.keys(businessFields).length) {
        personal?.showErrors({ firstName, lastName });
        showBusinessErrors(businessFields);
        focusInvalid();
      } else {
        const fallback = t(isDirty ? 'messages:BUSINESS.E02' : 'profile.personal.toast.saveFailed');
        toast.error(profileRequestError(error, fallback));
      }
    } finally {
      savingRef.current = false;
      if (mounted.current) {
        setIsSaving(false);
        onSavingChange?.(false);
      }
    }
  };

  const handleSetPasswordClick = () => {
    // Expand the password section so passwordInputRef gets attached to the actual input.
    // Without this, the ref is null while the section is collapsed and the scroll/focus
    // below would silently no-op for Google-registered users coming from the unlink dialog.
    setShowPasswordSection(true);
    // Small delay to allow modal to close + section to mount, then focus and scroll.
    setTimeout(() => {
      passwordInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

    // Reuse the shared per-error-mode validator (same one the setup wizard uses for
    // businessInfo.email) so users see granular messages: "Email must include an @
    // symbol", "Email must include a domain (like .com)", etc., already translated.
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
      dispatch(fetchCurrentUserAction.request());
      dispatch(fetchCurrentBusinessAction.request());
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

  const handleGoToEmailVerification = () => {
    const target = emailVerificationRef.current;
    if (!target) return;

    target.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'center' });
  };

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

  const handlePasswordSubmit = async () => {
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

    setIsSettingPassword(true);
    try {
      if (userHasPassword) {
        await changeOwnerPasswordApi({ currentPassword, newPassword });
        toast.success(t('profile.toast.passwordChanged'));
      } else {
        await setPasswordApi({ password: newPassword });
        toast.success(t('profile.toast.passwordSetSuccess'));
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwInteracted(false);
      setShowPasswordSection(false);
      setCurrentPwTouched(false);
      dispatch(fetchCurrentUserAction.request());
    } catch (error: any) {
      const fallback = userHasPassword ? t('profile.toast.passwordChangeFailed') : t('profile.toast.passwordSetFailed');
      toast.error(getErrorMessage(error, fallback));
    } finally {
      setIsSettingPassword(false);
    }
  };

  // Without the business the form would render dead empty defaults (and a bogus
  // "name required" error) that can't be edited meaningfully. A retained
  // business keeps rendering the form; only the no-data cases are gated.
  // Pre-wizard owners bypass both gates: no fetch ran, account sections render.
  if (!isOwnerWithoutBusiness && !currentBusiness && isBusinessLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-6 w-44" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!isOwnerWithoutBusiness && !currentBusiness && businessError) {
    return (
      <ErrorState
        variant="page"
        body={businessError}
        onRetry={() => dispatch(fetchCurrentBusinessAction.request())}
      />
    );
  }

  const logoCrest = (
    <div className="profile-hero-crest">
      <div className="profile-hero-crest-frame">
        {formData.logo ? (
          <img src={formData.logo} alt="" />
        ) : (
          <Building2 aria-hidden />
        )}
      </div>
      <button
        type="button"
        onClick={() => !isUploadingLogo && fileInputRef.current?.click()}
        disabled={isUploadingLogo}
        className="profile-hero-crest-edit"
        aria-label={isUploadingLogo ? t('profile.basicInfo.uploading') : t('profile.basicInfo.edit')}
      >
        {isUploadingLogo ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );

  return (
    <form ref={formRef} noValidate id="business-info-form" onSubmit={handleSubmit} className="w-full">
      <div className="profile-grid">
        <div className="profile-col">
          {/* Business sections are hidden until the setup wizard is completed */}
          {!isOwnerWithoutBusiness && (<fieldset disabled={isSaving} className="contents">
          {/* Hidden file input triggered by the logo edit button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,image/avif"
            onChange={handleFileSelect}
            className="hidden"
          />
          {pendingLogo && (
            <ImageCropDialog
              file={pendingLogo}
              variant="logo"
              onCancel={() => setPendingLogo(null)}
              onConfirm={uploadSelectedLogo}
            />
          )}

          {/* Hero band */}
          <header className={`profile-hero profile-tone-neutral${isMobile ? ' profile-hero-business-mobile' : ''}`}>
            <div className="profile-hero-left">
              {logoCrest}
              <div className="profile-hero-meta">
                <div className="profile-eyebrow">{t('profile.hero.eyebrow')}</div>
                <h2>{formData.businessName || t('profile.hero.placeholderName')}</h2>
                {selectedIndustryName && (
                  <div className="profile-row2">
                    <span>{selectedIndustryName}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="profile-hero-right">
              {user && !user.emailVerified && (
                <div className="profile-hero-email-status flex">
                  <button
                    type="button"
                    className="profile-hero-email-button"
                    aria-controls="profile-email-verification"
                    onClick={handleGoToEmailVerification}
                  >
                    <span className="profile-pill profile-pill-warn">
                      <AlertTriangle className="h-3 w-3" aria-hidden />
                      {t('profile.hero.emailNotVerified')}
                      <ChevronDown className="h-3 w-3" aria-hidden />
                    </span>
                  </button>
                </div>
              )}
              <span className="profile-pill profile-pill-good profile-hero-owner">
                <span className="profile-pill-dot" />
                {t('profile.hero.ownerBadge')}
              </span>
            </div>
          </header>

          {/* Section: Basic Information */}
          <section className="profile-section" aria-labelledby="profile-section-basic">
            <header className="profile-section-header">
              <div>
                <h3 id="profile-section-basic" className="profile-section-title">{t('profile.basicInfo.title')}</h3>
                <p className="profile-section-sub">{t('profile.basicInfo.subtitle')}</p>
              </div>
            </header>

            <div className="profile-field-stack">
              <div className="profile-field-grid">
                <TextField
                  reserveErrorSpace={false}
                  label={t('profile.basicInfo.businessName')}
                  placeholder={t('profile.basicInfo.businessNamePlaceholder')}
                  value={formData.businessName}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, businessName: value }));
                    setErrors(prev => ({ ...prev, businessName: validateBusinessName(value, t) ?? undefined }));
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, businessName: true }))}
                  error={touched.businessName ? errors.businessName : undefined}
                  icon={Building2}
                  required
                />
                <OptionSelect
                  reserveErrorSpace={false}
                  label={t('profile.basicInfo.industry')}
                  placeholder={t('profile.basicInfo.industryPlaceholder')}
                  value={formData.industryId != null ? String(formData.industryId) : ''}
                  onChange={(value) => {
                    const next = value ? Number(value) : null;
                    setFormData((prev) => ({ ...prev, industryId: next }));
                    setErrors(prev => ({ ...prev, industryId: next == null ? t('common:validation.industryRequired') : undefined }));
                  }}
                  options={industries.map((i) => ({ value: String(i.id), label: tIndustry(i.slug, toTitleCase(i.name)) }))}
                  error={touched.industryId ? errors.industryId : undefined}
                />
              </div>

              {originalSnapshot != null && formData.industryId !== originalSnapshot.industryId && (
                <div className="profile-banner-reveal">
                  <div className="profile-banner profile-banner-info">
                    <Info className="profile-banner-icon h-4 w-4" aria-hidden />
                    <div className="profile-banner-body min-w-0 text-start">
                      <strong>{t('profile.basicInfo.changingIndustry')}</strong>
                      <ul>
                        <li>{t('profile.basicInfo.industryWarning1')}</li>
                        <li>{t('profile.basicInfo.industryWarning2')}</li>
                        <li>{t('profile.basicInfo.industryWarning3')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <TextareaField
                  reserveErrorSpace={false}
                  label={t('profile.basicInfo.description')}
                  placeholder={t('profile.basicInfo.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, description: value }));
                    setErrors(prev => ({ ...prev, description: validateDescription(value, t, 500) ?? undefined }));
                  }}
                  error={errors.description}
                  maxLength={500}
                />
                <p className="text-[13px] text-foreground-3 leading-[1.5]">
                  {t('profile.basicInfo.descriptionTip')}
                </p>
              </div>

              <div className="profile-field-grid items-end">
                <div className="space-y-2">
                  {/* id + aria-labelledby, not htmlFor: label clicks forward to
                      the combobox button and open the picker from 50px away. */}
                  <Label id="businessCurrency-label" className="text-base font-medium">
                    {t('profile.basicInfo.currency')}
                  </Label>
                  <p className="text-sm text-foreground-3 dark:text-foreground-2">
                    {t('profile.basicInfo.currencyDescription')}
                  </p>
                  <CurrencySelect
                    reserveErrorSpace={false}
                    id="businessCurrency"
                    ariaLabelledBy="businessCurrency-label"
                    value={formData.businessCurrency}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, businessCurrency: value }));
                      setErrors(prev => ({
                        ...prev,
                        businessCurrency: CURRENCY_WHITELIST.includes(value?.toLowerCase())
                          ? undefined
                          : t('common:validation.currencyInvalid'),
                      }));
                    }}
                    error={touched.businessCurrency ? errors.businessCurrency : undefined}
                  />
                  {originalSnapshot != null && formData.businessCurrency !== originalSnapshot.businessCurrency && (
                    <div className="profile-banner-reveal">
                      <div className="profile-banner profile-banner-warn">
                        <AlertTriangle className="profile-banner-icon h-4 w-4" aria-hidden />
                        <div className="profile-banner-body">
                          <strong>{t('profile.basicInfo.changingCurrency')}</strong>
                          {t('profile.basicInfo.currencyWarning')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <TextField
                  reserveErrorSpace={false}
                  label={t('profile.basicInfo.phone')}
                  placeholder={t('profile.basicInfo.phonePlaceholder')}
                  type="tel"
                  required
                  value={formData.businessPhone}
                  onChange={(value) => {
                    const sanitized = sanitizePhoneToE164Draft(value);
                    setFormData(prev => ({ ...prev, businessPhone: sanitized }));
                    setErrors(prev => ({ ...prev, businessPhone: validatePhone(sanitized) }));
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, businessPhone: true }))}
                  error={touched.businessPhone ? errors.businessPhone : undefined}
                  icon={Phone}
                />
              </div>
            </div>
          </section>

          {/* Section: Social Media */}
          <section className="profile-section" aria-labelledby="profile-section-social">
            <header className="profile-section-header">
              <div>
                <h3 id="profile-section-social" className="profile-section-title">{t('profile.social.title')}</h3>
                <p className="profile-section-sub">{t('profile.social.description')}</p>
              </div>
            </header>

            <div className="profile-field-grid">
              {socialFields.map(({ field, label, icon }) => (
                <TextField
                  key={field}
                  label={t(`profile.social.${label}`)}
                  placeholder={t(`profile.social.${label}Placeholder`)}
                  value={formData[field]}
                  inputMode="url"
                  maxLength={null}
                  reserveErrorSpace={false}
                  onChange={value => {
                    setFormData(prev => ({ ...prev, [field]: value }));
                    setErrors(prev => ({ ...prev, [field]: validateUrlField(value, t, profileLinkLimits[field]) ?? undefined }));
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, [field]: true }))}
                  error={touched[field] ? errors[field] : undefined}
                  icon={icon}
                />
              ))}
            </div>
          </section>
          <PersonalInformationSection ref={personalRef} onDirtyChange={setPersonalDirty} />
          </fieldset>)}

          {/* Section: Account Security */}
          <section className="profile-section" aria-labelledby="profile-section-security">
            <header className="profile-section-header">
              <div>
                <h3 id="profile-section-security" className="profile-section-title">{t('profile.security.title')}</h3>
                <p className="profile-section-sub">{t('profile.security.description')}</p>
              </div>
            </header>

            <div className="profile-field-stack">
              <GoogleAccountManager onSetPasswordClick={handleSetPasswordClick} />
              <AppleAccountManager onSetPasswordClick={handleSetPasswordClick} />

              <div className="profile-divider" />

              {/* Email verification status */}
              <div className="profile-subgroup">
                <div
                  ref={emailVerificationRef}
                  id="profile-email-verification"
                  role="group"
                  aria-labelledby="profile-email-verification-title"
                  tabIndex={-1}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3"
                >
                  <div className="profile-subgroup-head flex-1 min-w-0">
                    <div className="profile-subgroup-title flex items-center gap-2 flex-wrap">
                      <span id="profile-email-verification-title">{t('profile.emailVerification.title')}</span>
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

              {/* Account email change */}
              <div className="profile-subgroup">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="profile-subgroup-head flex-1 min-w-0">
                    <div className="profile-subgroup-title">{t('profile.security.changeEmail')}</div>
                    <div className="profile-subgroup-sub">{t('profile.security.changeEmailDescription')}</div>
                    {user?.email && (
                      <div className="profile-subgroup-sub mt-1">
                        <span className="text-muted-foreground">{t('profile.security.currentEmailLabel')}:</span>{' '}
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
                      {t('profile.security.changeEmailReveal')}
                    </button>
                  )}
                </div>

                {showAccountEmailSection && (
                  <>
                    <div className="profile-field-grid">
                      <TextField
                        id="current-account-email"
                        label={t('profile.security.currentEmail')}
                        placeholder={t('profile.security.currentEmailPlaceholder')}
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
                        label={t('profile.security.newEmail')}
                        placeholder={t('profile.security.newEmailPlaceholder')}
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
                        {t('profile.security.changeEmailCancel')}
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
                            {t('profile.security.updating')}
                          </>
                        ) : (
                          t('profile.security.changeEmailButton')
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
                    <div className="profile-subgroup-title">{t('profile.security.changePassword')}</div>
                    <div className="profile-subgroup-sub">{t('profile.security.changePasswordDescription')}</div>
                  </div>
                  {!showPasswordSection && (
                    <button
                      type="button"
                      onClick={() => setShowPasswordSection(true)}
                      className="profile-btn-ghost profile-btn-compact shrink-0 self-start sm:self-auto"
                    >
                      <Lock className="h-3 w-3" />
                      {t('profile.security.changePasswordReveal')}
                    </button>
                  )}
                </div>

                {showPasswordSection && (
                  <>
                    {userHasPassword && (
                      <div className="profile-field-grid">
                        <TextField
                          id="current-password"
                          label={t('profile.security.currentPassword')}
                          placeholder={t('profile.security.currentPasswordPlaceholder')}
                          value={currentPassword}
                          onChange={setCurrentPassword}
                          type="password"
                          icon={Lock}
                          disabled={isSettingPassword}
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
                          {t('profile.security.newPassword')}
                        </Label>
                        <Popover open={pwFocused} modal={false}>
                          <PopoverTrigger asChild>
                            <div className="relative">
                              <Input
                                ref={!userHasPassword ? passwordInputRef : undefined}
                                id="new-password"
                                type="password"
                                autoComplete="new-password"
                                placeholder={t('profile.security.newPasswordPlaceholder')}
                                value={newPassword}
                                onChange={(e) => { setNewPassword(e.target.value); if (!pwInteracted) setPwInteracted(true); }}
                                onFocus={() => { setPwFocused(true); setPwInteracted(true); }}
                                onBlur={() => setPwFocused(false)}
                                disabled={isSettingPassword}
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
                        label={t('profile.security.confirmPassword')}
                        placeholder={t('profile.security.confirmPasswordPlaceholder')}
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        type="password"
                        icon={Lock}
                        disabled={isSettingPassword}
                        autoComplete="new-password"
                        error={confirmPassword.length > 0 && !passwordsMatch ? t('profile.toast.passwordsNoMatch') : undefined}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (canSubmitPassword) handlePasswordSubmit();
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
                        disabled={isSettingPassword}
                        className="profile-btn-ghost"
                      >
                        {t('profile.security.changePasswordCancel')}
                      </button>
                      <Button
                        type="button"
                        size="sm"
                        rounded="full"
                        className="!h-10 md:!h-11 !px-4 md:!px-6 !min-w-34 md:!w-44"
                        onClick={handlePasswordSubmit}
                        disabled={!canSubmitPassword || isSettingPassword}
                      >
                        {isSettingPassword ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('profile.security.updating')}
                          </>
                        ) : (
                          userHasPassword ? t('profile.security.changePasswordButton') : t('profile.security.setPasswordButton')
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
                  <div className="profile-subgroup-title">{t('profile.security.legalTitle')}</div>
                  <div className="profile-subgroup-sub">{t('profile.security.legalDescription')}</div>
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
                      <div className="profile-line-lbl">{t(`profile.security.legal_${type}`)}</div>
                      <ChevronRight className="profile-line-chev h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </section>

          {/* Section: Mobile push notifications */}
          <section className="profile-section" aria-labelledby="profile-section-mobile-push">
            <MobilePushNotifications />
          </section>

          {/* Section: Advanced Settings */}
          <section className="profile-section" aria-labelledby="profile-section-advanced">
            <header className="profile-section-header">
              <div>
                <h3 id="profile-section-advanced" className="profile-section-title">{t('profile.advancedSettings.title')}</h3>
                <p className="profile-section-sub">{t('profile.advancedSettings.description')}</p>
              </div>
            </header>
            <AdvancedSettings />
          </section>
        </div>
      </div>

    </form>
  );
};

export default BusinessProfile;
