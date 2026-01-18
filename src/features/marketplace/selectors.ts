import type { RootState } from "../../app/providers/store";

// Marketplace selectors
export const selectMarketplaceBusiness = (state: RootState) => state.marketplace.business;
export const selectMarketplaceListing = (state: RootState) => state.marketplace.listing;
export const selectMarketplaceLoading = (state: RootState) => state.marketplace.isLoading;
export const selectMarketplaceError = (state: RootState) => state.marketplace.error;
export const selectLocationCatalog = (state: RootState) => state.marketplace.locationCatalog;
export const selectMarketplaceIndustries = (state: RootState) => state.marketplace.industries;
export const selectMarketplaceIndustryTags = (state: RootState) => state.marketplace.industryTags;
export const selectMarketplaceSelectedIndustryTags = (state: RootState) => state.marketplace.selectedIndustryTags;
export const selectMarketplacePublishing = (state: RootState) => state.marketplace.isPublishing;
export const selectMarketplaceUpdatingVisibility = (state: RootState) => state.marketplace.isUpdatingVisibility;

// Booking Settings selectors
export const selectBookingSettings = (state: RootState) => state.marketplace.bookingSettings;
export const selectBookingSettingsLoading = (state: RootState) => state.marketplace.isLoadingBookingSettings;
export const selectBookingSettingsSaving = (state: RootState) => state.marketplace.isSavingBookingSettings;