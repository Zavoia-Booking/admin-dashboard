import { useCallback, useMemo } from 'react';
import type { Business } from '../types';
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
  allowOnlineBooking: boolean;
  isVisible: boolean;
  featuredImage?: string | null;
  portfolioImages?: string[] | null;
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
  allowOnlineBooking,
  isVisible: initialIsVisible,
  featuredImage,
  portfolioImages,
  selectedIndustryTags: initialSelectedIndustryTags,
  onSave,
}: UseMarketplaceFormProps) {

  // Use focused hooks
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
    allowOnlineBooking,
    isVisible: initialIsVisible,
    selectedIndustryTags: initialSelectedIndustryTags,
  });

  const portfolio = usePortfolioManagement({
    featuredImage,
    portfolioImages,
  });

  // Combined dirty state
  const isDirty = useMemo(() => {
    return profile.isDirty || portfolio.isDirty;
  }, [profile.isDirty, portfolio.isDirty]);

  // Save handler with validation
  const handleSave = useCallback(() => {
    // Validate profile details
    const isProfileValid = profile.validateBeforeSave();

    if (!isProfileValid) {
      return;
    }

    // Compose data from all hooks
    onSave({
      marketplaceName: profile.useBusinessName ? (business?.name || '') : profile.name,
      marketplaceEmail: profile.useBusinessEmail ? (business?.email || '') : profile.email,
      marketplacePhone: profile.useBusinessPhone ? (business?.phone || '') : profile.phone,
      marketplaceDescription: profile.useBusinessDescription ? (business?.description || '') : profile.description,
      useBusinessName: profile.useBusinessName,
      useBusinessEmail: profile.useBusinessEmail,
      useBusinessPhone: profile.useBusinessPhone,
      useBusinessDescription: profile.useBusinessDescription,
      allowOnlineBooking: profile.onlineBooking,
      isVisible: profile.isVisible,
      featuredImageId: portfolio.featuredImageId,
      portfolioImages: portfolio.portfolio,
      industryTagIds: profile.selectedIndustryTags.map(tag => tag.id),
    });
  }, [
    profile,
    portfolio,
    business,
    onSave,
  ]);

  // Flatten and return all state/methods for compatibility
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
    onlineBooking: profile.onlineBooking,
    isVisible: profile.isVisible,
    selectedIndustryTags: profile.selectedIndustryTags,
    nameError: profile.nameError,
    emailError: profile.emailError,
    phoneError: profile.phoneError,
    descriptionError: profile.descriptionError,
    industryTagsError: profile.industryTagsError,
    hasValidationErrors: profile.hasValidationErrors,
    
    // Portfolio state
    featuredImageId: portfolio.featuredImageId,
    portfolio: portfolio.portfolio,
    
    // Combined state
    isDirty,
    
    // Profile setters
    setUseBusinessName: profile.setUseBusinessName,
    setUseBusinessEmail: profile.setUseBusinessEmail,
    setUseBusinessPhone: profile.setUseBusinessPhone,
    setUseBusinessDescription: profile.setUseBusinessDescription,
    setName: profile.setName,
    setEmail: profile.setEmail,
    setPhone: profile.setPhone,
    setDescription: profile.setDescription,
    setOnlineBooking: profile.setOnlineBooking,
    setIsVisible: profile.setIsVisible,
    setSelectedIndustryTags: profile.setSelectedIndustryTags,
    
    // Portfolio setters
    setFeaturedImageId: portfolio.setFeaturedImageId,
    setPortfolio: portfolio.setPortfolio,
    
    // Actions
    handleSave,
  };
}
