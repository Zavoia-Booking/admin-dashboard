import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { User, Briefcase, Instagram, Facebook, Link2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '../../../../shared/components/ui/label';
import { Card, CardContent } from '../../../../shared/components/ui/card';
import { Badge } from '../../../../shared/components/ui/badge';
import { SectionDivider } from '../../../../shared/components/common/SectionDivider';
import TextField from '../../../../shared/components/forms/fields/TextField';
import TextareaField from '../../../../shared/components/forms/fields/TextareaField';
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
  languages: string[];
  interests: string[];
  socialLinks: SocialLinks;
}

const initialFormData: ProfileFormData = {
  displayName: '',
  professionalTitle: '',
  aboutMe: '',
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
  const mapProfileToFormData = (profile: MarketplaceProfile | null): ProfileFormData => {
    if (!profile) return initialFormData;
    return {
      displayName: profile.displayName || '',
      professionalTitle: profile.professionalTitle || '',
      aboutMe: profile.aboutMe || '',
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
      toast.success('Profile saved successfully!');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to save profile';
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
              title="Basic Information"
              className="mt-4 uppercase tracking-wider text-foreground-2"
            />
            <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed px-1">
              Your public identity on the marketplace. Choose a display name and title that represents you professionally.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2.5">
              <TextField
                label="Display Name"
                placeholder="Enter your display name"
                value={formData.displayName}
                onChange={(value) => setFormData(prev => ({ ...prev, displayName: value }))}
                icon={User}
                disabled={isSaving}
                maxLength={50}
              />
              <TextField
                label="Professional Title"
                placeholder="e.g., Senior Hair Stylist"
                value={formData.professionalTitle}
                onChange={(value) => setFormData(prev => ({ ...prev, professionalTitle: value }))}
                icon={Briefcase}
                disabled={isSaving}
                maxLength={100}
              />
            </div>
          </div>

          {/* About Me Section */}
          <div className="px-0 space-y-4">
            <SectionDivider
              title="About Me"
              className="uppercase tracking-wider text-foreground-2"
            />
            <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed px-1">
              Tell potential clients about yourself, your experience, and what makes you unique. A great bio helps build trust and attract the right clients.
            </p>
            <div className="px-2.5">
              <TextareaField
                label=""
                placeholder="Share your experience, skills, and what makes you unique..."
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
              title="Languages & Interests"
              className="uppercase tracking-wider text-foreground-2"
            />
            <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed px-1">
              Share the languages you speak and your personal interests. Let clients get to know you beyond your professional skills.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2.5">
              {/* Languages */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground-2">Languages</Label>
                <MultiSelect
                  value={formData.languages}
                  onChange={(selected) => setFormData(prev => ({ ...prev, languages: selected as string[] }))}
                  options={languageOptions}
                  placeholder="Select languages"
                  searchPlaceholder="Search languages..."
                />
                {formData.languages.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    {formData.languages.map((lang) => (
                      <Badge
                        key={lang}
                        variant="filter"
                        className="gap-1 px-2 py-0.5 text-xs"
                      >
                        {lang}
                        <div
                          onClick={() => !isSaving && removeLanguage(lang)}
                          className="hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-full p-0.5 transition-colors cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </div>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Interests */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground-2">Interests</Label>
                <MultiSelect
                  value={formData.interests}
                  onChange={(selected) => setFormData(prev => ({ ...prev, interests: selected as string[] }))}
                  options={interestOptions}
                  placeholder="Select interests"
                  searchPlaceholder="Search interests..."
                />
                {formData.interests.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    {formData.interests.map((interest) => (
                      <Badge
                        key={interest}
                        variant="filter"
                        className="gap-1 px-2 py-0.5 text-xs"
                      >
                        {interest}
                        <div
                          onClick={() => !isSaving && removeInterest(interest)}
                          className="hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-full p-0.5 transition-colors cursor-pointer"
                        >
                          <X className="h-3 w-3" />
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
              title="Social Links"
              className="uppercase tracking-wider text-foreground-2"
            />
            <p className="text-sm text-foreground-3 dark:text-foreground-2 leading-relaxed px-1">
              Connect with clients beyond the platform. Add your social media profiles and website to build your personal brand.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2.5">
              <TextField
                label="Instagram"
                placeholder="https://instagram.com/username"
                value={formData.socialLinks.instagram || ''}
                onChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  socialLinks: { ...prev.socialLinks, instagram: value } 
                }))}
                icon={Instagram}
                disabled={isSaving}
              />
              <TextField
                label="TikTok"
                placeholder="https://tiktok.com/@username"
                value={formData.socialLinks.tiktok || ''}
                onChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  socialLinks: { ...prev.socialLinks, tiktok: value } 
                }))}
                disabled={isSaving}
              />
              <TextField
                label="Facebook"
                placeholder="https://facebook.com/username"
                value={formData.socialLinks.facebook || ''}
                onChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  socialLinks: { ...prev.socialLinks, facebook: value } 
                }))}
                icon={Facebook}
                disabled={isSaving}
              />
              <TextField
                label="Website"
                placeholder="https://yourwebsite.com"
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
