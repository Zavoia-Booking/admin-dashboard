import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Building2, Mail, Globe, Shield, Instagram, Facebook, User, Camera, Loader2, Check, Lock, Info, LogOut } from 'lucide-react';
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
import { fetchCurrentBusinessAction, updateBusinessAction } from '../../business/actions';
import type { UpdateBusinessDTO } from '../../business/types';
import { getCurrentBusinessSelector } from '../../business/selectors';
import { fetchCurrentUserAction, logoutRequestAction } from '../../auth/actions';
import { setPasswordApi } from '../../auth/api';
import { translateMessageCode } from '../../../shared/utils/error';
import { industryApi } from '../../../shared/api/industry.api';
import type { Industry } from '../../../shared/types/industry';
import { useIsMobile } from '../../../shared/hooks/use-mobile';

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
});

interface BusinessProfileProps {
  onDirtyChange?: (dirty: boolean) => void;
}

const BusinessProfile: React.FC<BusinessProfileProps> = ({ onDirtyChange }) => {
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const currentBusiness = useSelector(getCurrentBusinessSelector);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<BusinessFormData>(initialFormData);
  const [originalSnapshot, setOriginalSnapshot] = useState<ReturnType<typeof getUpdatePayloadSnapshot> | null>(null);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  // Password setup state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);

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
        toast.error('Failed to load industries');
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
      current.facebookUrl !== originalSnapshot.facebookUrl
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
      toast.error('Please select a valid image file (JPEG, PNG, WebP, SVG, or AVIF)');
      return;
    }

    // Validate file size (10MB max)
    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeMB}MB`);
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
      
      toast.success('Logo uploaded successfully!');
      
      // Refresh user data to update sidebar logo
      dispatch(fetchCurrentUserAction.request());
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(error?.message || 'Failed to upload logo');
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

  const handleSetPassword = async () => {
    if (!newPassword.trim()) {
      toast.error('Please enter a password');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSettingPassword(true);
    try {
      await setPasswordApi({ password: newPassword });
      toast.success('Password set successfully! You can now unlink your Google account.');
      setNewPassword('');
      setConfirmPassword('');
      // Refresh user data to update hasPassword
      dispatch(fetchCurrentUserAction.request());
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to set password';
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
            title="Basic Information"
            description="Essential details about your business"
            className="mb-6"
          />
          
          <div className="space-y-6">
            {/* Logo Upload - Circular Display */}
            <div className="space-y-2">
              <Label className="text-base font-medium text-foreground-1">Business Logo</Label>
              <p className="text-sm text-foreground-3 dark:text-foreground-2">
                Your logo appears on your booking page and communications
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
                    {isUploadingLogo ? 'Uploading...' : 'Edit'}
                  </div>
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="flex flex-wrap gap-6">
              <div className="flex-1 min-w-[280px]">
                <TextField
                  label="Business Name"
                  placeholder="Enter your business name"
                  value={formData.businessName}
                  onChange={(value) => setFormData(prev => ({ ...prev, businessName: value }))}
                  icon={Building2}
                  required
                />
              </div>
              
              <div className="flex-1 min-w-[280px]">
                <OptionSelect
                  label="Industry"
                  placeholder="Select industry"
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
                  <span className="text-sm font-medium text-info">Changing your industry</span>
                </div>
                <ul className="space-y-2 text-sm text-foreground-2 leading-relaxed list-none pl-0">
                  <li className="flex gap-2">
                    <span className="text-info mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-info block" aria-hidden />
                    <span>If you have an active marketplace listing, it will be temporarily set to invisible.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-info mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-info block" aria-hidden />
                    <span>After you save this change, go to your marketplace listing to update your industry categories and make it visible again.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-info mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-info block" aria-hidden />
                    <span>This keeps your business from showing in the wrong category and helps customers find you more easily.</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Description */}
            <TextareaField
              label="Business Description"
              placeholder="Tell your clients about your business..."
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              maxLength={500}
            />

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="businessCurrency" className="text-base font-medium">
                Default Pricing Currency *
              </Label>
              <p className="text-sm text-foreground-3 dark:text-foreground-2">
                Choose your default currency for pricing
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
            title="Contact Information"
            description="How clients can reach you"
            className="mb-6"
          />
          
          <div className="flex flex-wrap gap-6">
            <div className="flex-1 min-w-[280px]">
              <TextField
                label="Business Email"
                placeholder="business@example.com"
                value={formData.businessEmail}
                onChange={(value) => setFormData(prev => ({ ...prev, businessEmail: value }))}
                icon={Mail}
                required
              />
            </div>
            
            <div className="flex-1 min-w-[280px]">
              <TextField
                label="Business Phone"
                placeholder="+1 (555) 123-4567"
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
            title="Social Media Links"
            description="Connect your social media profiles"
            className="mb-6"
          />
          
          <div className="flex flex-wrap gap-6">
            <div className="flex-1 min-w-[280px]">
              <TextField
                label="Instagram URL"
                placeholder="https://instagram.com/yourbusiness"
                value={formData.instagramUrl}
                onChange={(value) => setFormData(prev => ({ ...prev, instagramUrl: value }))}
                icon={Instagram}
              />
            </div>
            
            <div className="flex-1 min-w-[280px]">
              <TextField
                label="Facebook URL"
                placeholder="https://facebook.com/yourbusiness"
                value={formData.facebookUrl}
                onChange={(value) => setFormData(prev => ({ ...prev, facebookUrl: value }))}
                icon={Facebook}
              />
            </div>
          </div>
        </div>
        
        {/* Account Security Section */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <FormSectionHeader
            icon={Shield}
            title="Account Security"
            description="Manage your account authentication and security"
            className="mb-6"
          />
          
          <div className="space-y-6">
            <GoogleAccountManager onSetPasswordClick={handleSetPasswordClick} />
            
            {/* Password Section - always visible */}
            <div className="pt-4 border-t border-border">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0 mb-4">
                  <Label className="text-sm font-medium text-foreground">
                    Change Password
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Update your account password
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-6">
                <div className="flex-1 min-w-[280px]">
                  <TextField
                    id="new-password"
                    label="New Password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={setNewPassword}
                    type="password"
                    icon={Lock}
                    disabled={isSettingPassword}
                    inputRef={passwordInputRef}
                  />
                </div>
                <div className="flex-1 min-w-[280px]">
                  <TextField
                    id="confirm-password"
                    label="Confirm Password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    type="password"
                    icon={Lock}
                    disabled={isSettingPassword}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSetPassword();
                      }
                    }}
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSetPassword}
                  disabled={!newPassword.trim() || !confirmPassword.trim() || isSettingPassword}
                >
                  {isSettingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
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
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

export default BusinessProfile;
