import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../auth/selectors';
import { User, Briefcase, Instagram, Facebook, Link2, Award, X, Music2 } from 'lucide-react';
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
import { getErrorMessage } from '../../../../shared/utils/error';
import {
  validateUrlField,
  validateDisplayName,
  validateProfessionalTitle,
  validateDescription,
} from '../../../../shared/utils/validation';

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
  /** User-made edits only — drives unsaved-changes guards. */
  isDirty: () => boolean;
  /** Whether Save has something meaningful to persist (edits, or a creatable prefilled profile). */
  canSave: () => boolean;
  isSaving: () => boolean;
}

export interface ProfileTabProps {
  initialProfile: MarketplaceProfile | null;
  onProfileSaved: (profile: MarketplaceProfile) => void;
  /** Drop the card chrome when already inside a surface (e.g. the owner slider). */
  embedded?: boolean;
}

function ProfileTabInner(
  { initialProfile, onProfileSaved, embedded = false }: ProfileTabProps,
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

  const user = useSelector(selectCurrentUser);
  const accountName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();

  // When no profile exists yet, prefill the display name from the account name
  // so creating a profile is one Save away. Prefill goes into BOTH baselines —
  // an untouched prefill must not count as dirty (it would trip the portal's
  // unsaved-changes guards); canSave covers the create case instead.
  const withPrefill = (data: ProfileFormData): ProfileFormData =>
    initialProfile === null && !data.displayName && accountName
      ? { ...data, displayName: accountName }
      : data;

  const [formData, setFormData] = useState<ProfileFormData>(() => withPrefill(mapProfileToFormData(initialProfile)));
  const [originalFormData, setOriginalFormData] = useState<ProfileFormData>(() => withPrefill(mapProfileToFormData(initialProfile)));
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // All fields validate through the shared validation file: displayName is a
  // required 2–50 char public name, title is an optional 2–100 one, years must
  // be a whole 0–70, about-me is screened for unsafe markup, and each social
  // link must be a valid URL when filled (empty passes).
  const validateYears = useCallback((value: number | ''): string | undefined => {
    if (value === '') return undefined;
    return Number.isInteger(value) && value >= 0 && value <= 70
      ? undefined
      : t('profileTab.yearsInvalid');
  }, [t]);

  const runValidation = useCallback((data: ProfileFormData): Record<string, string | undefined> => ({
    displayName: validateDisplayName(data.displayName, t) ?? undefined,
    professionalTitle: validateProfessionalTitle(data.professionalTitle, t) ?? undefined,
    yearsOfExperience: validateYears(data.yearsOfExperience),
    aboutMe: validateDescription(data.aboutMe, t, 1000) ?? undefined,
    instagram: validateUrlField(data.socialLinks.instagram || '', t) ?? undefined,
    tiktok: validateUrlField(data.socialLinks.tiktok || '', t) ?? undefined,
    facebook: validateUrlField(data.socialLinks.facebook || '', t) ?? undefined,
    website: validateUrlField(data.socialLinks.website || '', t) ?? undefined,
  }), [t, validateYears]);

  const handleSocialChange = (field: keyof SocialLinks, value: string) => {
    setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [field]: value } }));
    setErrors(prev => ({ ...prev, [field]: validateUrlField(value, t) ?? undefined }));
  };

  // Update form when initialProfile changes
  useEffect(() => {
    setFormData(withPrefill(mapProfileToFormData(initialProfile)));
    setOriginalFormData(withPrefill(mapProfileToFormData(initialProfile)));
  }, [initialProfile]);

  const handleSave = useCallback(async () => {
    const nextErrors = runValidation(formData);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setTouched({
        displayName: true, professionalTitle: true, yearsOfExperience: true,
        aboutMe: true, instagram: true, tiktok: true, facebook: true, website: true,
      });
      toast.error(t('toast.fixErrors'));
      return;
    }
    setIsSaving(true);
    try {
      // Blanking a field must persist as "cleared", not be silently ignored.
      // Empty optionals go as null (the backend writes null); arrays go as-is so
      // removing every item clears them; socialLinks collapses to null when empty.
      const social = {
        instagram: (formData.socialLinks.instagram || '').trim() || null,
        tiktok: (formData.socialLinks.tiktok || '').trim() || null,
        facebook: (formData.socialLinks.facebook || '').trim() || null,
        website: (formData.socialLinks.website || '').trim() || null,
      };
      const payload = {
        displayName: formData.displayName.trim(),
        professionalTitle: formData.professionalTitle.trim() || null,
        aboutMe: formData.aboutMe.trim() || null,
        yearsOfExperience: formData.yearsOfExperience === '' ? null : formData.yearsOfExperience,
        languages: formData.languages,
        interests: formData.interests,
        socialLinks: Object.values(social).some(Boolean) ? social : null,
      };

      const response = await updateMarketplaceProfile(payload);
      const newFormData = mapProfileToFormData(response.marketplaceProfile);
      setFormData(newFormData);
      setOriginalFormData(newFormData);
      onProfileSaved(response.marketplaceProfile);
      toast.success(t('toast.saveSuccess'));
    } catch (error: any) {
      const translatedMessage = getErrorMessage(error, t('toast.saveFailed'));
      toast.error(translatedMessage);
    } finally {
      setIsSaving(false);
    }
  }, [formData, onProfileSaved, runValidation, t]);

  // Check if form has changes
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);
  // Save reflects real edits only. The prefilled name is a convenience, not a
  // change — so a freshly opened profile keeps Save disabled until you actually
  // add or edit something.
  const canSave = hasChanges;

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    save: handleSave,
    isDirty: () => hasChanges,
    canSave: () => canSave,
    isSaving: () => isSaving,
  }), [hasChanges, canSave, isSaving, handleSave]);

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
    <div className={embedded ? "" : "max-w-5xl mb-0 md:mb-8"}>
      <Card
        className={
          embedded
            ? "border-none shadow-none bg-transparent overflow-hidden"
            : "border-none pt-0 pb-2 sm:border shadow-none sm:shadow-sm bg-transparent sm:bg-white dark:sm:bg-surface overflow-hidden"
        }
      >
        <CardContent className={embedded ? "p-0" : "p-0 sm:p-4 space-y-10"}>
          {/* Basic Information Section */}
          <div className="px-0 space-y-4">
            <SectionDivider
              title={t('profileTab.basicInfo')}
              className={`${embedded ? "mt-0" : "mt-4"} uppercase tracking-wider text-foreground-2`}
            />
            <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed px-1">
              {t('profileTab.basicInfoDescription')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-1">
              <TextField
                label={t('profileTab.displayName')}
                placeholder={t('profileTab.displayNamePlaceholder')}
                value={formData.displayName}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, displayName: value }));
                  setErrors(prev => ({ ...prev, displayName: validateDisplayName(value, t) ?? undefined }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, displayName: true }))}
                error={touched.displayName ? errors.displayName : undefined}
                icon={User}
                disabled={isSaving}
                maxLength={50}
                required
              />
              <TextField
                label={t('profileTab.professionalTitle')}
                placeholder={t('profileTab.professionalTitlePlaceholder')}
                value={formData.professionalTitle}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, professionalTitle: value }));
                  setErrors(prev => ({ ...prev, professionalTitle: validateProfessionalTitle(value, t) ?? undefined }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, professionalTitle: true }))}
                error={touched.professionalTitle ? errors.professionalTitle : undefined}
                icon={Briefcase}
                disabled={isSaving}
                maxLength={100}
              />
              <NumberField
                label={t('profileTab.yearsOfExperience')}
                placeholder={t('profileTab.yearsOfExperiencePlaceholder')}
                value={formData.yearsOfExperience}
                onChange={(value) => {
                  const next = value === '' ? '' : Number(value);
                  setFormData(prev => ({ ...prev, yearsOfExperience: next }));
                  setErrors(prev => ({ ...prev, yearsOfExperience: validateYears(next) }));
                }}
                error={errors.yearsOfExperience}
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
            <div className="px-1">
              <TextareaField
                label=""
                placeholder={t('profileTab.aboutMePlaceholder')}
                value={formData.aboutMe}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, aboutMe: value }));
                  setErrors(prev => ({ ...prev, aboutMe: validateDescription(value, t, 1000) ?? undefined }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, aboutMe: true }))}
                error={touched.aboutMe ? errors.aboutMe : undefined}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-1">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-1">
              <TextField
                label={t('profileTab.instagram')}
                placeholder={t('profileTab.instagramPlaceholder')}
                value={formData.socialLinks.instagram || ''}
                onChange={(value) => handleSocialChange('instagram', value)}
                onBlur={() => setTouched(prev => ({ ...prev, instagram: true }))}
                error={touched.instagram ? errors.instagram : undefined}
                icon={Instagram}
                disabled={isSaving}
              />
              <TextField
                label={t('profileTab.tiktok')}
                placeholder={t('profileTab.tiktokPlaceholder')}
                value={formData.socialLinks.tiktok || ''}
                onChange={(value) => handleSocialChange('tiktok', value)}
                onBlur={() => setTouched(prev => ({ ...prev, tiktok: true }))}
                error={touched.tiktok ? errors.tiktok : undefined}
                icon={Music2}
                disabled={isSaving}
              />
              <TextField
                label={t('profileTab.facebook')}
                placeholder={t('profileTab.facebookPlaceholder')}
                value={formData.socialLinks.facebook || ''}
                onChange={(value) => handleSocialChange('facebook', value)}
                onBlur={() => setTouched(prev => ({ ...prev, facebook: true }))}
                error={touched.facebook ? errors.facebook : undefined}
                icon={Facebook}
                disabled={isSaving}
              />
              <TextField
                label={t('profileTab.website')}
                placeholder={t('profileTab.websitePlaceholder')}
                value={formData.socialLinks.website || ''}
                onChange={(value) => handleSocialChange('website', value)}
                onBlur={() => setTouched(prev => ({ ...prev, website: true }))}
                error={touched.website ? errors.website : undefined}
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
