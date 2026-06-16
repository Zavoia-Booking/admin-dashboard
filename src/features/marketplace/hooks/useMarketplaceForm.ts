import { useCallback } from 'react';
import type { Business } from '../types';
import { useProfileDetails } from './useProfileDetails';

interface UseMarketplaceFormProps {
  business: Business | null;
  marketplaceName?: string | null;
  marketplaceEmail?: string | null;
  marketplacePhone?: string | null;
  marketplaceDescription?: string | null;
  // Business-page (microsite) content
  tagline?: string | null;
  aboutContent?: string | null;
  brandColorHex?: string | null;
  businessSlug?: string | null;
  useBusinessName: boolean;
  useBusinessEmail: boolean;
  useBusinessPhone: boolean;
  useBusinessDescription: boolean;
  selectedIndustryTags: { id: number; name: string }[];
  onSave: (data: any) => void;
}

export function useMarketplaceForm({
  business,
  marketplaceName,
  marketplaceEmail,
  marketplacePhone,
  marketplaceDescription,
  tagline: initialTagline,
  aboutContent: initialAboutContent,
  brandColorHex: initialBrandColorHex,
  businessSlug: initialBusinessSlug,
  useBusinessName: initialUseBusinessName,
  useBusinessEmail: initialUseBusinessEmail,
  useBusinessPhone: initialUseBusinessPhone,
  useBusinessDescription: initialUseBusinessDescription,
  selectedIndustryTags: initialSelectedIndustryTags,
  onSave,
}: UseMarketplaceFormProps) {

  const profile = useProfileDetails({
    business,
    marketplaceName,
    marketplaceEmail,
    marketplacePhone,
    marketplaceDescription,
    tagline: initialTagline,
    aboutContent: initialAboutContent,
    brandColorHex: initialBrandColorHex,
    businessSlug: initialBusinessSlug,
    useBusinessName: initialUseBusinessName,
    useBusinessEmail: initialUseBusinessEmail,
    useBusinessPhone: initialUseBusinessPhone,
    useBusinessDescription: initialUseBusinessDescription,
    selectedIndustryTags: initialSelectedIndustryTags,
  });

  // Per-location portfolio is owned by each LocationPanel (its own usePortfolioManagement),
  // so this form only tracks the business-level profile/branding fields.
  const isDirty = profile.isDirty;

  const handleSave = useCallback(() => {
    const isProfileValid = profile.validateBeforeSave();
    if (!isProfileValid) return;

    onSave({
      marketplaceName: profile.useBusinessName ? (business?.name || '') : profile.name,
      marketplaceEmail: profile.useBusinessEmail ? (business?.email || '') : profile.email,
      marketplacePhone: profile.useBusinessPhone ? (business?.phone || '') : profile.phone,
      marketplaceDescription: profile.useBusinessDescription ? (business?.description || '') : profile.description,
      useBusinessName: profile.useBusinessName,
      useBusinessEmail: profile.useBusinessEmail,
      useBusinessPhone: profile.useBusinessPhone,
      useBusinessDescription: profile.useBusinessDescription,
      industryTagIds: profile.selectedIndustryTags.map((tag) => tag.id),
      // tagline/aboutContent have no format validator → send the raw value (incl. "") so a
      // saved value can be cleared, matching the clearable marketplaceDescription pattern.
      tagline: profile.tagline,
      aboutContent: profile.aboutContent,
      // brandColorHex/businessSlug have @Matches validators that reject "" (and an empty slug
      // would collide on the partial-unique index), so send undefined when empty.
      brandColorHex: profile.brandColorHex.trim() || undefined,
      businessSlug: profile.businessSlug.trim() || undefined,
    });
  }, [profile, business, onSave]);

  return {
    // Profile state
    useBusinessName: profile.useBusinessName,
    useBusinessEmail: profile.useBusinessEmail,
    useBusinessPhone: profile.useBusinessPhone,
    useBusinessDescription: profile.useBusinessDescription,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    description: profile.description,
    tagline: profile.tagline,
    aboutContent: profile.aboutContent,
    brandColorHex: profile.brandColorHex,
    businessSlug: profile.businessSlug,
    selectedIndustryTags: profile.selectedIndustryTags,
    nameError: profile.nameError,
    emailError: profile.emailError,
    phoneError: profile.phoneError,
    descriptionError: profile.descriptionError,
    industryTagsError: profile.industryTagsError,
    taglineError: profile.taglineError,
    brandColorError: profile.brandColorError,
    slugError: profile.slugError,
    hasValidationErrors: profile.hasValidationErrors,

    isDirty,

    setUseBusinessName: profile.setUseBusinessName,
    setUseBusinessEmail: profile.setUseBusinessEmail,
    setUseBusinessPhone: profile.setUseBusinessPhone,
    setUseBusinessDescription: profile.setUseBusinessDescription,
    setName: profile.setName,
    setEmail: profile.setEmail,
    setPhone: profile.setPhone,
    setDescription: profile.setDescription,
    setTagline: profile.setTagline,
    setAboutContent: profile.setAboutContent,
    setBrandColorHex: profile.setBrandColorHex,
    setBusinessSlug: profile.setBusinessSlug,
    setSelectedIndustryTags: profile.setSelectedIndustryTags,

    handleSave,
  };
}
