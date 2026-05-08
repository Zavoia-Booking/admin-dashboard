import { useCallback, useMemo } from 'react';
import type { Business, LocationWithAssignments } from '../types';
import { useProfileDetails } from './useProfileDetails';
import { usePortfolioManagement } from './usePortfolioManagement';

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
  selectedLocationId: number | null;
  locationsWithAssignments: LocationWithAssignments[];
  selectedIndustryTags: { id: number; name: string }[];
  onSave: (data: any) => void;
}

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
  selectedLocationId,
  locationsWithAssignments,
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

  const portfolio = usePortfolioManagement({
    locationId: selectedLocationId,
    locationsWithAssignments,
  });

  // True if at least one location has any portfolio image — required for publish.
  const hasAnyPortfolioImage = useMemo(
    () => locationsWithAssignments.some((l) => (l.portfolioImages || []).length > 0),
    [locationsWithAssignments],
  );

  const isDirty = useMemo(() => {
    return profile.isDirty || portfolio.isDirty;
  }, [profile.isDirty, portfolio.isDirty]);

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

    // Portfolio (per active location)
    featuredImageId: portfolio.featuredImageId,
    portfolio: portfolio.portfolio,
    hasAnyPortfolioImage,

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

    setFeaturedImageId: portfolio.setFeaturedImageId,
    setPortfolio: portfolio.setPortfolio,

    handleSave,
  };
}
