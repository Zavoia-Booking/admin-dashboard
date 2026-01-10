import type { RootState } from "../../app/providers/store";

// Marketplace selectors
export const selectMarketplaceBusiness = (state: RootState) => state.marketplace.business;
export const selectMarketplaceListing = (state: RootState) => state.marketplace.listing;
export const selectMarketplaceLoading = (state: RootState) => state.marketplace.isLoading;
export const selectMarketplaceError = (state: RootState) => state.marketplace.error;
export const selectMarketplaceLocations = (state: RootState) => state.marketplace.locations;
export const selectMarketplaceServices = (state: RootState) => state.marketplace.services;
export const selectMarketplaceCategories = (state: RootState) => state.marketplace.categories;
export const selectMarketplaceTeamMembers = (state: RootState) => state.marketplace.teamMembers;
export const selectMarketplaceIndustries = (state: RootState) => state.marketplace.industries;
export const selectListedLocations = (state: RootState) => state.marketplace.listedLocations;
export const selectListedServices = (state: RootState) => state.marketplace.listedServices;
export const selectListedCategories = (state: RootState) => state.marketplace.listedCategories;
export const selectListedTeamMembers = (state: RootState) => state.marketplace.listedTeamMembers;
export const selectMarketplacePublishing = (state: RootState) => state.marketplace.isPublishing;
export const selectMarketplaceUpdatingVisibility = (state: RootState) => state.marketplace.isUpdatingVisibility;

// Booking Settings selectors
export const selectBookingSettings = (state: RootState) => state.marketplace.bookingSettings;
export const selectBookingSettingsLoading = (state: RootState) => state.marketplace.isLoadingBookingSettings;
export const selectBookingSettingsSaving = (state: RootState) => state.marketplace.isSavingBookingSettings;