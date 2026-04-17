import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Building2, Mail, Globe, Shield, Instagram, Facebook, User, Camera, Loader2, Save, Lock, Info, LogOut, FileText, ChevronRight, Settings } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Label } from '../../../shared/components/ui/label';
import { toast } from 'sonner';
import CurrencySelect from '../../../shared/components/common/CurrencySelect';
import FormSectionHeader from '../../../shared/components/forms/FormSectionHeader';
import TextField from '../../../shared/components/forms/fields/TextField';
import TextareaField from '../../../shared/components/forms/fields/TextareaField';
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
import { validatePasswordPolicy } from '../../../shared/utils/validation';
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
  const [legalDialogType, setLegalDialogType] = useState<LegalPageType | null>(null);

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
      <div className="space-y-6">
        {/* Basic Information Section */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <FormSectionHeader
            icon={Building2}
            title={t('profile.basicInfo.title')}
            description={t('profile.basicInfo.description')}
            className="mb-6"
          />
          
          <div className="space-y-6">
            {/* Logo Upload - Circular Display */}
            <div className="space-y-2">
              <Label className="text-base font-medium text-foreground-1">{t('profile.basicInfo.logo')}</Label>
              <p className="text-sm text-foreground-3 dark:text-foreground-2">
                {t('profile.basicInfo.logoDescription')}
              </p>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,image/avif"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {/* Circular Logo Preview with Edit Button */}
              <div className="flex items-center gap-4 pt-2">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
                    {formData.logo ? (
                      <img
                        src={formData.logo}
                        alt="Business logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  {/* Edit Button on Logo */}
                  <div
                    onClick={() => !isUploadingLogo && fileInputRef.current?.click()}
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-white text-foreground-1 text-xs font-medium rounded-md shadow-lg hover:bg-gray-50 transition-colors border border-border ${
                      isUploadingLogo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <Camera className="h-3 w-3" />
                    {isUploadingLogo ? t('profile.basicInfo.uploading') : t('profile.basicInfo.edit')}
                  </div>
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="flex flex-wrap gap-6">
              <div className="flex-1 min-w-[280px]">
                <TextField
                  label={t('profile.basicInfo.businessName')}
                  placeholder={t('profile.basicInfo.businessNamePlaceholder')}
                  value={formData.businessName}
                  onChange={(value) => setFormData(prev => ({ ...prev, businessName: value }))}
                  icon={Building2}
                  required
                />
              </div>
              
              <div className="flex-1 min-w-[280px]">
                <OptionSelect
                  label={t('profile.basicInfo.industry')}
                  placeholder={t('profile.basicInfo.industryPlaceholder')}
                  value={formData.industryId != null ? String(formData.industryId) : ''}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      industryId: value ? Number(value) : null,
                    }))
                  }
                  options={industries.map((i) => ({ value: String(i.id), label: toTitleCase(i.name) }))}
                />
              </div>
            </div>

            {originalSnapshot != null && formData.industryId !== originalSnapshot.industryId && (
              <div className="rounded-lg border border-info-border bg-info-bg dark:bg-info-bg/30 p-4 mt-1">
                <div className="flex gap-2 mb-2">
                  <Info className="h-4 w-4 text-info shrink-0 mt-0.5" aria-hidden />
                  <span className="text-sm font-medium text-info">{t('profile.basicInfo.changingIndustry')}</span>
                </div>
                <ul className="space-y-2 text-sm text-foreground-2 leading-relaxed list-none pl-0">
                  <li className="flex gap-2">
                    <span className="text-info mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-info block" aria-hidden />
                    <span>{t('profile.basicInfo.industryWarning1')}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-info mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-info block" aria-hidden />
                    <span>{t('profile.basicInfo.industryWarning2')}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-info mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-info block" aria-hidden />
                    <span>{t('profile.basicInfo.industryWarning3')}</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Description */}
            <TextareaField
              label={t('profile.basicInfo.description')}
              placeholder={t('profile.basicInfo.descriptionPlaceholder')}
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              maxLength={500}
            />

            {/* Currency */}
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
                onChange={(value) => setFormData(prev => ({ ...prev, businessCurrency: value }))}
              />
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <FormSectionHeader
            icon={Mail}
            title={t('profile.contact.title')}
            description={t('profile.contact.description')}
            className="mb-6"
          />
          
          <div className="flex flex-wrap gap-6">
            <div className="flex-1 min-w-[280px]">
              <TextField
                label={t('profile.contact.email')}
                placeholder={t('profile.contact.emailPlaceholder')}
                value={formData.businessEmail}
                onChange={(value) => setFormData(prev => ({ ...prev, businessEmail: value }))}
                icon={Mail}
                required
              />
            </div>
            
            <div className="flex-1 min-w-[280px]">
              <TextField
                label={t('profile.contact.phone')}
                placeholder={t('profile.contact.phonePlaceholder')}
                value={formData.businessPhone}
                onChange={(value) => setFormData(prev => ({ ...prev, businessPhone: value }))}
                icon={Globe}
              />
            </div>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <FormSectionHeader
            icon={Globe}
            title={t('profile.social.title')}
            description={t('profile.social.description')}
            className="mb-6"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <TextField
                label={t('profile.social.instagram')}
                placeholder={t('profile.social.instagramPlaceholder')}
                value={formData.instagramUrl}
                onChange={(value) => setFormData(prev => ({ ...prev, instagramUrl: value }))}
                icon={Instagram}
              />
            </div>
            
            <div>
              <TextField
                label={t('profile.social.facebook')}
                placeholder={t('profile.social.facebookPlaceholder')}
                value={formData.facebookUrl}
                onChange={(value) => setFormData(prev => ({ ...prev, facebookUrl: value }))}
                icon={Facebook}
              />
            </div>

            <div>
              <TextField
                label={t('profile.social.tiktok')}
                placeholder={t('profile.social.tiktokPlaceholder')}
                value={formData.tiktokUrl}
                onChange={(value) => setFormData(prev => ({ ...prev, tiktokUrl: value }))}
                icon={Globe}
              />
            </div>

            <div>
              <TextField
                label={t('profile.social.website')}
                placeholder={t('profile.social.websitePlaceholder')}
                value={formData.websiteUrl}
                onChange={(value) => setFormData(prev => ({ ...prev, websiteUrl: value }))}
                icon={Globe}
              />
            </div>

            <div>
              <TextField
                label={t('profile.social.pinterest')}
                placeholder={t('profile.social.pinterestPlaceholder')}
                value={formData.pinterestUrl}
                onChange={(value) => setFormData(prev => ({ ...prev, pinterestUrl: value }))}
                icon={Globe}
              />
            </div>
          </div>
        </div>
        
        {/* Account Security Section */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm mb-10">
          <FormSectionHeader
            icon={Shield}
            title={t('profile.security.title')}
            description={t('profile.security.description')}
            className="mb-6"
          />
          
          <div className="space-y-6">
            <GoogleAccountManager onSetPasswordClick={handleSetPasswordClick} />
            
            {/* Password Section - always visible */}
            <div className="pt-4 border-t border-border">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0 mb-4">
                  <Label className="text-sm font-medium text-foreground">
                    {t('profile.security.changePassword')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('profile.security.changePasswordDescription')}
                  </p>
                </div>
              </div>

              {userHasPassword && (
                <div className="flex flex-wrap gap-6">
                  <div className="flex-1 min-w-[280px]">
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
                    />
                  </div>
                  <div className="flex-1 min-w-[280px]" />
                </div>
              )}
              
              <div className="flex flex-wrap gap-6">
                <div className="flex-1 min-w-[280px] space-y-2 pt-2">
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
                <div className="flex-1 min-w-[280px]">
                  <TextField
                    id="confirm-password"
                    label={t('profile.security.confirmPassword')}
                    placeholder={t('profile.security.confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    type="password"
                    icon={Lock}
                    disabled={isSettingPassword}
                    error={confirmPassword.length > 0 && !passwordsMatch ? t('profile.toast.passwordsNoMatch') : undefined}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (canSubmitPassword) handlePasswordSubmit();
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
                  onClick={handlePasswordSubmit}
                  disabled={!canSubmitPassword || isSettingPassword}
                >
                  {isSettingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('profile.security.updating')}
                    </>
                  ) : (
                    <>
                      {userHasPassword ? t('profile.security.changePasswordButton') : t('profile.security.setPasswordButton')}
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
                  {t('profile.security.legalTitle')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('profile.security.legalDescription')}
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
                    <span className="flex-1 text-left">{t(`profile.security.legal_${type}`)}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>

            {/* Log out - only on mobile; desktop has it in the sidebar */}
            {isMobile && (
              <div className="pt-4 mt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => dispatch(logoutRequestAction.request())}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 active:bg-red-500/15 dark:hover:text-red-400 dark:hover:border-red-500/40"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {t('profile.security.logOut')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Settings Section */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm mb-10">
          <FormSectionHeader
            icon={Settings}
            title={t('profile.advancedSettings.title')}
            description={t('profile.advancedSettings.description')}
            className="mb-6"
          />
          <AdvancedSettings />
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
