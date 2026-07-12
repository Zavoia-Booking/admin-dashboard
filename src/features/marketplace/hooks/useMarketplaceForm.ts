import { useCallback } from 'react';
import type { Business, PublishMarketplaceListingPayload } from '../types';
import { useProfileDetails } from './useProfileDetails';

interface UseMarketplaceFormProps {
  business: Business | null;
  marketplaceName?: string | null;
  marketplaceEmail?: string | null;
  marketplacePhone?: string | null;
  marketplaceDescription?: string | null;
  useBusinessName: boolean;
  useBusinessEmail: boolean;
  useBusinessPhone: boolean;
  useBusinessDescription: boolean;
  selectedIndustryTags: { id: number; name: string }[];
  onSave: (data: PublishMarketplaceListingPayload) => void;
}

/**
 * Marketplace profile form: identity overrides, contact toggles, and industry tags.
 * Website content edits/saves live entirely in features/website (PUT /website-builder) —
 * Website dirty state or validation can never block a Marketplace save.
 */
export function useMarketplaceForm({
  business,
  marketplaceName,
  marketplaceEmail,
  marketplacePhone,
  marketplaceDescription,
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
    useBusinessName: initialUseBusinessName,
    useBusinessEmail: initialUseBusinessEmail,
    useBusinessPhone: initialUseBusinessPhone,
    useBusinessDescription: initialUseBusinessDescription,
    selectedIndustryTags: initialSelectedIndustryTags,
  });

  const isDirty = profile.isDirty;

  const handleSave = useCallback(() => {
    if (!profile.validateBeforeSave()) return;

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
      // Website Builder fields are NEVER sent through Marketplace publish by this client —
      // they save through the dedicated PUT /website-builder with optimistic concurrency.
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
    selectedIndustryTags: profile.selectedIndustryTags,
    nameError: profile.nameError,
    emailError: profile.emailError,
    phoneError: profile.phoneError,
    descriptionError: profile.descriptionError,
    industryTagsError: profile.industryTagsError,
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
    setSelectedIndustryTags: profile.setSelectedIndustryTags,

    handleSave,
  };
}
