import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Briefcase, Instagram, Facebook, Link2, Award, X } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '../../../../shared/components/ui/label';
import { Card, CardContent } from '../../../../shared/components/ui/card';
import { Badge } from '../../../../shared/components/ui/badge';
import { SectionDivider } from '../../../../shared/components/common/SectionDivider';
import TextField from '../../../../shared/components/forms/fields/TextField';
import TextareaField from '../../../../shared/components/forms/fields/TextareaField';
import NumberField from '../../../../shared/components/forms/fields/NumberField';
import { MultiSelect, type MultiSelectOption } from '../../../../shared/components/common/MultiSelect';
import { 
  updateMarketplaceProfile,
  type MarketplaceProfile,
  type SocialLinks,
  AVAILABLE_LANGUAGES,
  AVAILABLE_INTERESTS,
} from '../api';
import { translateMessageCode } from '../../../../shared/utils/error';

interface ProfileFormData {
  displayName: string;
  professionalTitle: string;
  aboutMe: string;
  yearsOfExperience: number | '';
  languages: string[];
  interests: string[];
  socialLinks: SocialLinks;
}

const initialFormData: ProfileFormData = {
  displayName: '',
  professionalTitle: '',
  aboutMe: '',
  yearsOfExperience: '',
  languages: [],
  interests: [],
  socialLinks: {
    instagram: '',
    tiktok: '',
    facebook: '',
    website: '',
  },
};

// Convert arrays to MultiSelectOption format
const languageOptions: MultiSelectOption[] = AVAILABLE_LANGUAGES.map((lang) => ({
  id: lang,
  name: lang,
}));

const interestOptions: MultiSelectOption[] = AVAILABLE_INTERESTS.map((interest) => ({
  id: interest,
  name: interest,
}));

export interface ProfileTabRef {
  save: () => Promise<void>;
  isDirty: () => boolean;
  isSaving: () => boolean;
}

export interface ProfileTabProps {
  initialProfile: MarketplaceProfile | null;
  onProfileSaved: (profile: MarketplaceProfile) => void;
}

function ProfileTabInner(
  { initialProfile, onProfileSaved }: ProfileTabProps,
  ref: React.ForwardedRef<ProfileTabRef>
) {
  const { t } = useTranslation('myProfile');
  const mapProfileToFormData = (profile: MarketplaceProfile | null): ProfileFormData => {
    if (!profile) return initialFormData;
    return {
      displayName: profile.displayName || '',
      professionalTitle: profile.professionalTitle || '',
      aboutMe: profile.aboutMe || '',
      yearsOfExperience: profile.yearsOfExperience ?? '',
      languages: profile.languages || [],
      interests: profile.interests || [],
      socialLinks: {
        instagram: profile.socialLinks?.instagram || '',
        tiktok: profile.socialLinks?.tiktok || '',
        facebook: profile.socialLinks?.facebook || '',
        website: profile.socialLinks?.website || '',
      },
    };
  };

  const [formData, setFormData] = useState<ProfileFormData>(() => mapProfileToFormData(initialProfile));
  const [originalFormData, setOriginalFormData] = useState<ProfileFormData>(() => mapProfileToFormData(initialProfile));
  const [isSaving, setIsSaving] = useState(false);

  // Update form when initialProfile changes
  useEffect(() => {
    const newFormData = mapProfileToFormData(initialProfile);
    setFormData(newFormData);
    setOriginalFormData(newFormData);
  }, [initialProfile]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const payload = {
        displayName: formData.displayName || undefined,
        professionalTitle: formData.professionalTitle || undefined,
        aboutMe: formData.aboutMe || undefined,
        yearsOfExperience: formData.yearsOfExperience === '' ? undefined : formData.yearsOfExperience,
        languages: formData.languages.length > 0 ? formData.languages : undefined,
        interests: formData.interests.length > 0 ? formData.interests : undefined,
        socialLinks: {
          instagram: formData.socialLinks.instagram || undefined,
          tiktok: formData.socialLinks.tiktok || undefined,
          facebook: formData.socialLinks.facebook || undefined,
          website: formData.socialLinks.website || undefined,
        },
      };

      const response = await updateMarketplaceProfile(payload);
      const newFormData = mapProfileToFormData(response.marketplaceProfile);
      setFormData(newFormData);
      setOriginalFormData(newFormData);
      onProfileSaved(response.marketplaceProfile);
      toast.success(t('toast.saveSuccess'));
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || t('toast.saveFailed');
      const translatedMessage = Array.isArray(message)
        ? translateMessageCode(message[0])
        : translateMessageCode(message);
      toast.error(translatedMessage);
    } finally {
      setIsSaving(false);
    }
  }, [formData, onProfileSaved]);

  // Check if form has changes
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    save: handleSave,
    isDirty: () => hasChanges,
    isSaving: () => isSaving,
  }), [hasChanges, isSaving, handleSave]);

  const removeLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== lang),
    }));
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest),
    }));
  };

  return (
    <div className="max-w-5xl mb-0 md:mb-8">
      <Card className="border-none pt-0 pb-2 sm:border shadow-none sm:shadow-sm bg-transparent sm:bg-white dark:sm:bg-surface overflow-hidden">
        <CardContent className="p-0 sm:p-4 space-y-10">
          {/* Basic Information Section */}
          <div className="px-0 space-y-4">
            <SectionDivider
              title={t('profileTab.basicInfo')}
              className="mt-4 uppercase tracking-wider text-foreground-2"
            />
            <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed px-1">
              {t('profileTab.basicInfoDescription')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2.5">
              <TextField
                label={t('profileTab.displayName')}
                placeholder={t('profileTab.displayNamePlaceholder')}
                value={formData.displayName}
                onChange={(value) => setFormData(prev => ({ ...prev, displayName: value }))}
                icon={User}
                disabled={isSaving}
                maxLength={50}
              />
              <TextField
                label={t('profileTab.professionalTitle')}
                placeholder={t('profileTab.professionalTitlePlaceholder')}
                value={formData.professionalTitle}
                onChange={(value) => setFormData(prev => ({ ...prev, professionalTitle: value }))}
                icon={Briefcase}
                disabled={isSaving}
                maxLength={100}
              />
              <NumberField
                label={t('profileTab.yearsOfExperience')}
                placeholder={t('profileTab.yearsOfExperiencePlaceholder')}
                value={formData.yearsOfExperience}
                onChange={(value) => setFormData(prev => ({
                  ...prev,
                  yearsOfExperience: value === '' ? '' : Number(value),
                }))}
                icon={Award}
                min={0}
                max={70}
                step={1}
                helpText={t('profileTab.yearsOfExperienceHelp')}
              />
            </div>
          </div>

          {/* About Me Section */}
          <div className="px-0 space-y-4">
            <SectionDivider
              title={t('profileTab.aboutMe')}
              className="uppercase tracking-wider text-foreground-2"
            />
            <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed px-1">
              {t('profileTab.aboutMeDescription')}
            </p>
            <div className="px-2.5">
              <TextareaField
                label=""
                placeholder={t('profileTab.aboutMePlaceholder')}
                value={formData.aboutMe}
                onChange={(value) => setFormData(prev => ({ ...prev, aboutMe: value }))}
                maxLength={1000}
                rows={4}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Languages & Interests Section */}
          <div className="px-0 space-y-4">
            <SectionDivider
              title={t('profileTab.languagesInterests')}
              className="uppercase tracking-wider text-foreground-2"
            />
            <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed px-1">
              {t('profileTab.languagesInterestsDescription')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2.5">
              {/* Languages */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground-2">{t('profileTab.languages')}</Label>
                <MultiSelect
                  value={formData.languages}
                  onChange={(selected) => setFormData(prev => ({ ...prev, languages: selected as string[] }))}
                  options={languageOptions}
                  placeholder={t('profileTab.languagesPlaceholder')}
                  searchPlaceholder={t('profileTab.languagesSearchPlaceholder')}
                />
                {formData.languages.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {formData.languages.map((lang) => (
                      <Badge
                        key={lang}
                        variant="filter"
                        className="gap-1.5 px-3 py-1.5 text-sm"
                      >
                        {lang}
                        <div
                          onClick={() => !isSaving && removeLanguage(lang)}
                          className="hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-full p-1 transition-colors cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </div>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Interests */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground-2">{t('profileTab.interests')}</Label>
                <MultiSelect
                  value={formData.interests}
                  onChange={(selected) => setFormData(prev => ({ ...prev, interests: selected as string[] }))}
                  options={interestOptions}
                  placeholder={t('profileTab.interestsPlaceholder')}
                  searchPlaceholder={t('profileTab.interestsSearchPlaceholder')}
                />
                {formData.interests.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {formData.interests.map((interest) => (
                      <Badge
                        key={interest}
                        variant="filter"
                        className="gap-1.5 px-3 py-1.5 text-sm"
                      >
                        {interest}
                        <div
                          onClick={() => !isSaving && removeInterest(interest)}
                          className="hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-full p-1 transition-colors cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </div>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Social Links Section */}
          <div className="px-0 space-y-4">
            <SectionDivider
              title={t('profileTab.socialLinks')}
              className="uppercase tracking-wider text-foreground-2"
            />
            <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed px-1">
              {t('profileTab.socialLinksDescription')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2.5">
              <TextField
                label={t('profileTab.instagram')}
                placeholder={t('profileTab.instagramPlaceholder')}
                value={formData.socialLinks.instagram || ''}
                onChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  socialLinks: { ...prev.socialLinks, instagram: value } 
                }))}
                icon={Instagram}
                disabled={isSaving}
              />
              <TextField
                label={t('profileTab.tiktok')}
                placeholder={t('profileTab.tiktokPlaceholder')}
                value={formData.socialLinks.tiktok || ''}
                onChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  socialLinks: { ...prev.socialLinks, tiktok: value } 
                }))}
                disabled={isSaving}
              />
              <TextField
                label={t('profileTab.facebook')}
                placeholder={t('profileTab.facebookPlaceholder')}
                value={formData.socialLinks.facebook || ''}
                onChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  socialLinks: { ...prev.socialLinks, facebook: value } 
                }))}
                icon={Facebook}
                disabled={isSaving}
              />
              <TextField
                label={t('profileTab.website')}
                placeholder={t('profileTab.websitePlaceholder')}
                value={formData.socialLinks.website || ''}
                onChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  socialLinks: { ...prev.socialLinks, website: value } 
                }))}
                icon={Link2}
                disabled={isSaving}
              />
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

export const ProfileTab = forwardRef<ProfileTabRef, ProfileTabProps>(ProfileTabInner);
export default ProfileTab;
