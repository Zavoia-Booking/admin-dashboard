import { createAction, createAsyncAction } from "typesafe-actions";
import type { MarketplaceListingResponse, PublishMarketplaceListingPayload, BookingSettings, UpdateBookingSettingsPayload, PortfolioImageData } from "./types";

export const fetchMarketplaceListingAction = createAsyncAction(
  'marketplace/FETCH_LISTING_REQUEST',
  'marketplace/FETCH_LISTING_SUCCESS',
  'marketplace/FETCH_LISTING_FAILURE',
)<void, MarketplaceListingResponse, { message: string }>();

export const publishMarketplaceListingAction = createAsyncAction(
  'marketplace/PUBLISH_LISTING_REQUEST',
  'marketplace/PUBLISH_LISTING_SUCCESS',
  'marketplace/PUBLISH_LISTING_FAILURE',
)<PublishMarketplaceListingPayload, void, { message: string }>();

export interface UpdateLocationMarketplaceFlagsRequest {
  locationId: number;
  isPublic?: boolean;
  allowOnlineBooking?: boolean;
}

export interface UpdateLocationMarketplaceFlagsSuccess {
  locationId: number;
  isPublic: boolean;
  allowOnlineBooking: boolean;
}

export const updateLocationMarketplaceFlagsAction = createAsyncAction(
  'marketplace/UPDATE_LOCATION_FLAGS_REQUEST',
  'marketplace/UPDATE_LOCATION_FLAGS_SUCCESS',
  'marketplace/UPDATE_LOCATION_FLAGS_FAILURE',
)<UpdateLocationMarketplaceFlagsRequest, UpdateLocationMarketplaceFlagsSuccess, { locationId: number; message: string }>();

/**
 * Local Redux sync after a successful per-location portfolio mutation
 * (upload, delete, set-featured). The API returns the new full state for
 * that location; we mirror it into locationCatalog so the rest of the UI
 * (publish-button gating, switching back to a previously edited location,
 * marketplace-public preview) sees fresh data without re-fetching.
 */
export interface SetLocationPortfolioPayload {
  locationId: number;
  portfolioImages: PortfolioImageData[];
  featuredImage: string | null;
}

export const setLocationPortfolioAction = createAction(
  'marketplace/SET_LOCATION_PORTFOLIO',
)<SetLocationPortfolioPayload>();

// Booking Settings Actions
export const updateBookingSettingsAction = createAsyncAction(
  'marketplace/UPDATE_BOOKING_SETTINGS_REQUEST',
  'marketplace/UPDATE_BOOKING_SETTINGS_SUCCESS',
  'marketplace/UPDATE_BOOKING_SETTINGS_FAILURE',
)<UpdateBookingSettingsPayload, BookingSettings, { message: string }>();

