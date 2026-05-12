import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Building2, Mail, Globe, Instagram, Facebook, Camera, Loader2, Lock, Info, LogOut, FileText, ChevronRight } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Label } from '../../../shared/components/ui/label';
import { toast } from 'sonner';
import CurrencySelect from '../../../shared/components/common/CurrencySelect';
import TextField from '../../../shared/components/forms/fields/TextField';
import TextareaField from '../../../shared/components/forms/fields/TextareaField';
import './Profile.css';
import OptionSelect from '../../../shared/components/common/OptionSelect';
import { uploadBusinessLogo } from '../api';
import GoogleAccountManager from './GoogleAccountManager';
import AdvancedSettings from './AdvancedSettings';
import { fetchCurrentBusinessAction, updateBusinessAction } from '../../business/actions';
import type { UpdateBusinessDTO } from '../../business/types';
import { getCurrentBusinessSelector } from '../../business/selectors';
import { fetchCurrentUserAction, logoutRequestAction } from '../../auth/actions';
import { setPasswordApi, changeOwnerPasswordApi } from '../../auth/api';
import { translateMessageCode } from '../../../shared/utils/error';
import type { RootState } from '../../../app/providers/store';
import { industryApi } from '../../../shared/api/industry.api';
import type { Industry } from '../../../shared/types/industry';
import { useIsMobile } from '../../../shared/hooks/use-mobile';
import { PasswordStrength } from '../../auth/components/PasswordStrength';
import {
  validatePasswordPolicy,
  validateBusinessName,
  validateDescription,
  requiredEmailError,
  isE164,
  sanitizePhoneToE164Draft,
  validateUrlField,
} from '../../../shared/utils/validation';
import { Input } from '../../../shared/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '../../../shared/components/ui/popover';
import LegalContentDialog from '../../legal/components/LegalContentDialog';
import type { LegalPageType } from '../../legal/components/legal-content';

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

/** Fields that are sent in the business update payload - used for dirty check */
const getUpdatePayloadSnapshot = (data: BusinessFormData) => ({
  businessName: data.businessName,
  description: data.description ?? '',
  industryId: data.industryId,
  businessEmail: data.businessEmail,
  businessPhone: data.businessPhone,
  businessCurrency: data.businessCurrency,
  instagramUrl: data.instagramUrl,
  facebookUrl: data.facebookUrl,
  tiktokUrl: data.tiktokUrl,
  websiteUrl: data.websiteUrl,
  pinterestUrl: data.pinterestUrl,
});

interface BusinessProfileProps {
  onDirtyChange?: (dirty: boolean) => void;
}

const BusinessProfile: React.FC<BusinessProfileProps> = ({ onDirtyChange }) => {
  const { t } = useTranslation('settings');
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const currentBusiness = useSelector(getCurrentBusinessSelector);
  const user = useSelector((state: RootState) => state.auth.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<BusinessFormData>(initialFormData);
  const [originalSnapshot, setOriginalSnapshot] = useState<ReturnType<typeof getUpdatePayloadSnapshot> | null>(null);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [pwInteracted, setPwInteracted] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPwTouched, setCurrentPwTouched] = useState(false);
  const [legalDialogType, setLegalDialogType] = useState<LegalPageType | null>(null);

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const CURRENCY_WHITELIST = ['eur','usd','ron','gbp','chf','sek','nok','dkk','pln','czk','huf','bgn','hrk','try'];

  const validatePhone = (value: string): string | undefined => {
    const v = value.trim();
    if (!v) return undefined;
    return isE164(v) ? undefined : 'Enter a valid phone number';
  };

  const validateAll = (): Record<string, string | undefined> => ({
    businessName: validateBusinessName(formData.businessName) ?? undefined,
    businessEmail: requiredEmailError('Business email', formData.businessEmail) ?? undefined,
    businessPhone: validatePhone(formData.businessPhone),
    industryId: formData.industryId == null ? 'Please select an industry' : undefined,
    description: validateDescription(formData.description, 500) ?? undefined,
    businessCurrency: CURRENCY_WHITELIST.includes(formData.businessCurrency?.toLowerCase())
      ? undefined
      : 'Please select a valid currency',
    instagramUrl: validateUrlField(formData.instagramUrl) ?? undefined,
    facebookUrl:  validateUrlField(formData.facebookUrl)  ?? undefined,
    tiktokUrl:    validateUrlField(formData.tiktokUrl)    ?? undefined,
    websiteUrl:   validateUrlField(formData.websiteUrl)   ?? undefined,
    pinterestUrl: validateUrlField(formData.pinterestUrl) ?? undefined,
  });

  const userHasPassword = user?.hasPassword === true;
  const isPasswordPolicyValid = validatePasswordPolicy(newPassword) === true;
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmitPassword = isPasswordPolicyValid && passwordsMatch && confirmPassword.length > 0
    && (!userHasPassword || currentPassword.trim().length > 0);

  // Fetch business data on mount
  useEffect(() => {
    dispatch(fetchCurrentBusinessAction.request());
  }, [dispatch]);

  // Fetch industries on mount
  useEffect(() => {
    industryApi
      .getAll()
      .then(setIndustries)
      .catch((err) => {
        console.error('Failed to fetch industries:', err);
        toast.error(t('profile.toast.industriesLoadFailed'));
      });
  }, []);

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
      setFormData(data);
      setOriginalSnapshot(getUpdatePayloadSnapshot(data));
    }
  }, [currentBusiness]);

  const isDirty = useMemo(() => {
    if (originalSnapshot == null) return false;
    const current = getUpdatePayloadSnapshot(formData);
    return (
      current.businessName !== originalSnapshot.businessName ||
      current.description !== originalSnapshot.description ||
      current.industryId !== originalSnapshot.industryId ||
      current.businessEmail !== originalSnapshot.businessEmail ||
      current.businessPhone !== originalSnapshot.businessPhone ||
      current.businessCurrency !== originalSnapshot.businessCurrency ||
      current.instagramUrl !== originalSnapshot.instagramUrl ||
      current.facebookUrl !== originalSnapshot.facebookUrl ||
      current.tiktokUrl !== originalSnapshot.tiktokUrl ||
      current.websiteUrl !== originalSnapshot.websiteUrl ||
      current.pinterestUrl !== originalSnapshot.pinterestUrl
    );
  }, [formData, originalSnapshot]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const selectedIndustryName = useMemo(() => {
    if (formData.industryId == null) return null;
    const found = industries.find(i => i.id === formData.industryId);
    return found ? toTitleCase(found.name) : null;
  }, [formData.industryId, industries]);

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
      toast.error(error?.message || t('profile.toast.logoUploadFailed'));
    } finally {
      setIsUploadingLogo(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const next = validateAll();
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      setTouched(Object.keys(next).reduce((a, k) => ({ ...a, [k]: true }), {} as Record<string, boolean>));
      toast.error(t('profile.toast.fixErrorsBeforeSave'));
      return;
    }

    // Prepare update data (logo is handled separately via upload endpoint)
    const updateData: UpdateBusinessDTO = {
      name: formData.businessName,
      description: formData.description,
      email: formData.businessEmail,
      phone: formData.businessPhone,
      businessCurrency: formData.businessCurrency,
      instagramUrl: formData.instagramUrl,
      facebookUrl: formData.facebookUrl,
      tiktokUrl: formData.tiktokUrl,
      websiteUrl: formData.websiteUrl,
      pinterestUrl: formData.pinterestUrl,
    };
    if (formData.industryId != null) {
      updateData.industryId = formData.industryId;
    }
    dispatch(updateBusinessAction.request(updateData));
  };

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

  const handlePasswordSubmit = async () => {
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
      const message = error?.response?.data?.message || error?.message || fallback;
      const translatedMessage = Array.isArray(message) 
        ? translateMessageCode(message[0]) 
        : translateMessageCode(message);
      toast.error(translatedMessage);
    } finally {
      setIsSettingPassword(false);
    }
  };

  return (
    <form id="business-info-form" onSubmit={handleSubmit} className="w-full">
      <div className="profile-grid">
        <div className="profile-col">
          {/* Hidden file input for logo upload (triggered from hero edit button) */}
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
              <span className="profile-pill profile-pill-good">
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
                  label={t('profile.basicInfo.businessName')}
                  placeholder={t('profile.basicInfo.businessNamePlaceholder')}
                  value={formData.businessName}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, businessName: value }));
                    setErrors(prev => ({ ...prev, businessName: validateBusinessName(value) ?? undefined }));
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, businessName: true }))}
                  error={touched.businessName ? errors.businessName : undefined}
                  icon={Building2}
                  required
                />
                <OptionSelect
                  label={t('profile.basicInfo.industry')}
                  placeholder={t('profile.basicInfo.industryPlaceholder')}
                  value={formData.industryId != null ? String(formData.industryId) : ''}
                  onChange={(value) => {
                    const next = value ? Number(value) : null;
                    setFormData((prev) => ({ ...prev, industryId: next }));
                    setErrors(prev => ({ ...prev, industryId: next == null ? 'Please select an industry' : undefined }));
                  }}
                  options={industries.map((i) => ({ value: String(i.id), label: toTitleCase(i.name) }))}
                  error={touched.industryId ? errors.industryId : undefined}
                />
              </div>

              {originalSnapshot != null && formData.industryId !== originalSnapshot.industryId && (
                <div className="profile-banner profile-banner-info">
                  <Info className="profile-banner-icon h-4 w-4" aria-hidden />
                  <div className="profile-banner-body">
                    <strong>{t('profile.basicInfo.changingIndustry')}</strong>
                    <ul>
                      <li>{t('profile.basicInfo.industryWarning1')}</li>
                      <li>{t('profile.basicInfo.industryWarning2')}</li>
                      <li>{t('profile.basicInfo.industryWarning3')}</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <TextareaField
                  label={t('profile.basicInfo.description')}
                  placeholder={t('profile.basicInfo.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, description: value }));
                    setErrors(prev => ({ ...prev, description: validateDescription(value, 500) ?? undefined }));
                  }}
                  error={errors.description}
                  maxLength={500}
                />
                <p className="text-[13px] text-foreground-3 leading-[1.5]">
                  {t('profile.basicInfo.descriptionTip')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessCurrency" className="text-base font-medium">
                  {t('profile.basicInfo.currency')}
                </Label>
                <p className="text-sm text-foreground-3 dark:text-foreground-2">
                  {t('profile.basicInfo.currencyDescription')}
                </p>
                <CurrencySelect
                  id="businessCurrency"
                  value={formData.businessCurrency}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, businessCurrency: value }));
                    setErrors(prev => ({
                      ...prev,
                      businessCurrency: CURRENCY_WHITELIST.includes(value?.toLowerCase())
                        ? undefined
                        : 'Please select a valid currency',
                    }));
                  }}
                  error={touched.businessCurrency ? errors.businessCurrency : undefined}
                />
              </div>
            </div>
          </section>

          {/* Section: Contact */}
          <section className="profile-section" aria-labelledby="profile-section-contact">
            <header className="profile-section-header">
              <div>
                <h3 id="profile-section-contact" className="profile-section-title">{t('profile.contact.title')}</h3>
                <p className="profile-section-sub">{t('profile.contact.description')}</p>
              </div>
            </header>

            <div className="profile-field-grid">
              <TextField
                label={t('profile.contact.email')}
                placeholder={t('profile.contact.emailPlaceholder')}
                value={formData.businessEmail}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, businessEmail: value }));
                  setErrors(prev => ({ ...prev, businessEmail: requiredEmailError('Business email', value) ?? undefined }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, businessEmail: true }))}
                error={touched.businessEmail ? errors.businessEmail : undefined}
                icon={Mail}
                required
              />
              <TextField
                label={t('profile.contact.phone')}
                placeholder={t('profile.contact.phonePlaceholder')}
                value={formData.businessPhone}
                onChange={(value) => {
                  const sanitized = sanitizePhoneToE164Draft(value);
                  setFormData(prev => ({ ...prev, businessPhone: sanitized }));
                  setErrors(prev => ({ ...prev, businessPhone: validatePhone(sanitized) }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, businessPhone: true }))}
                error={touched.businessPhone ? errors.businessPhone : undefined}
                icon={Globe}
              />
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
              <TextField
                label={t('profile.social.instagram')}
                placeholder={t('profile.social.instagramPlaceholder')}
                value={formData.instagramUrl}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, instagramUrl: value }));
                  setErrors(prev => ({ ...prev, instagramUrl: validateUrlField(value) ?? undefined }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, instagramUrl: true }))}
                error={touched.instagramUrl ? errors.instagramUrl : undefined}
                icon={Instagram}
              />
              <TextField
                label={t('profile.social.facebook')}
                placeholder={t('profile.social.facebookPlaceholder')}
                value={formData.facebookUrl}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, facebookUrl: value }));
                  setErrors(prev => ({ ...prev, facebookUrl: validateUrlField(value) ?? undefined }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, facebookUrl: true }))}
                error={touched.facebookUrl ? errors.facebookUrl : undefined}
                icon={Facebook}
              />
              <TextField
                label={t('profile.social.tiktok')}
                placeholder={t('profile.social.tiktokPlaceholder')}
                value={formData.tiktokUrl}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, tiktokUrl: value }));
                  setErrors(prev => ({ ...prev, tiktokUrl: validateUrlField(value) ?? undefined }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, tiktokUrl: true }))}
                error={touched.tiktokUrl ? errors.tiktokUrl : undefined}
                icon={Globe}
              />
              <TextField
                label={t('profile.social.website')}
                placeholder={t('profile.social.websitePlaceholder')}
                value={formData.websiteUrl}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, websiteUrl: value }));
                  setErrors(prev => ({ ...prev, websiteUrl: validateUrlField(value) ?? undefined }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, websiteUrl: true }))}
                error={touched.websiteUrl ? errors.websiteUrl : undefined}
                icon={Globe}
              />
              <TextField
                label={t('profile.social.pinterest')}
                placeholder={t('profile.social.pinterestPlaceholder')}
                value={formData.pinterestUrl}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, pinterestUrl: value }));
                  setErrors(prev => ({ ...prev, pinterestUrl: validateUrlField(value) ?? undefined }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, pinterestUrl: true }))}
                error={touched.pinterestUrl ? errors.pinterestUrl : undefined}
                icon={Globe}
              />
            </div>
          </section>
        
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
                      onClick={() => setLegalDialogType(type)}
                      className="profile-line-row"
                    >
                      <div className="profile-line-icon"><FileText className="h-4 w-4" /></div>
                      <div className="profile-line-lbl">{t(`profile.security.legal_${type}`)}</div>
                      <ChevronRight className="profile-line-chev h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile-only logout */}
              {isMobile && (
                <>
                  <div className="profile-divider" />
                  <button
                    type="button"
                    onClick={() => dispatch(logoutRequestAction.request())}
                    className="profile-btn-ghost profile-tone-danger"
                    style={{ width: '100%' }}
                  >
                    <LogOut className="h-4 w-4" />
                    {t('profile.security.logOut')}
                  </button>
                </>
              )}
            </div>
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

      <LegalContentDialog
        type={legalDialogType}
        onOpenChange={(open) => { if (!open) setLegalDialogType(null); }}
      />
    </form>
  );
};

export default BusinessProfile;
