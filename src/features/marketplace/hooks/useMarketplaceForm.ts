import { useCallback } from 'react';
import type { Business, SectionEntry, PageTheme, FaqItem, AnnouncementContent, PublishMarketplaceListingPayload } from '../types';
import { useProfileDetails } from './useProfileDetails';
import { useBusinessPageBuilder } from './useBusinessPageBuilder';

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
  // Section builder (v1)
  pageLayout?: SectionEntry[] | null;
  pageTheme?: PageTheme | null;
  faq?: FaqItem[] | null;
  announcement?: AnnouncementContent | null;
  useBusinessName: boolean;
  useBusinessEmail: boolean;
  useBusinessPhone: boolean;
  useBusinessDescription: boolean;
  selectedIndustryTags: { id: number; name: string }[];
  onSave: (data: PublishMarketplaceListingPayload) => void;
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
  pageLayout,
  pageTheme,
  faq,
  announcement,
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
    useBusinessName: initialUseBusinessName,
    useBusinessEmail: initialUseBusinessEmail,
    useBusinessPhone: initialUseBusinessPhone,
    useBusinessDescription: initialUseBusinessDescription,
    selectedIndustryTags: initialSelectedIndustryTags,
  });

  const builder = useBusinessPageBuilder({ pageLayout, pageTheme, faq, announcement });

  // Save is dirty if either the profile/branding fields or the section builder changed.
  const isDirty = profile.isDirty || builder.isDirty;

  const handleSave = useCallback(() => {
    const isProfileValid = profile.validateBeforeSave();
    if (!isProfileValid) return;

    // Brand colour lives in the profile form (single source); merged into pageTheme by the builder.
    const brandColor = profile.brandColorHex.trim() || null;

    onSave({
      marketplaceName: profile.useBusinessName ? (business?.name || '') : profile.name,
      // A1: when inheriting the business email, send undefined (not "") — an empty string fails the
      // backend @IsEmail and would 400 a publish for a business that has no contact email on file.
      marketplaceEmail: profile.useBusinessEmail ? undefined : profile.email,
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
      // brandColorHex has a @Matches validator that rejects "" → send undefined when empty.
      brandColorHex: brandColor ?? undefined,
      // businessSlug is system-generated on the backend (V1, non-editable) — not sent.
      // Section builder slice: ordered layout + theme (brand colour + font) + net-new content.
      ...builder.getBuilderPayload(brandColor),
    });
  }, [profile, builder, business, onSave]);

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
    // Effective public name → the read-only page-address slug is derived from this in the UI.
    pageName: profile.useBusinessName ? (business?.name ?? '') : profile.name,
    selectedIndustryTags: profile.selectedIndustryTags,
    nameError: profile.nameError,
    emailError: profile.emailError,
    phoneError: profile.phoneError,
    descriptionError: profile.descriptionError,
    industryTagsError: profile.industryTagsError,
    taglineError: profile.taglineError,
    brandColorError: profile.brandColorError,
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
    setSelectedIndustryTags: profile.setSelectedIndustryTags,

    // Section builder state + operations (consumed by the builder UI)
    layout: builder.layout,
    fontKey: builder.fontKey,
    faqItems: builder.faqItems,
    announcementContent: builder.announcementContent,
    reorderSections: builder.reorder,
    toggleSectionVisible: builder.toggleVisible,
    setSectionVariant: builder.setVariant,
    setSectionConfig: builder.setSectionConfig,
    setFontKey: builder.setFontKey,
    setFaqItems: builder.setFaqItems,
    setAnnouncementContent: builder.setAnnouncementContent,

    handleSave,
  };
}
