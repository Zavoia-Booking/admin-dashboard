import { createAction, createAsyncAction } from "typesafe-actions";
import type { MarketplaceListingResponse, PublishMarketplaceListingPayload, BookingSettings, UpdateBookingSettingsPayload, PortfolioImageData, WebsiteCatalogResponse, WebsiteVariantCheckoutPayload } from "./types";

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

/**
 * Local Redux sync after a successful business-page hero upload/delete. The API
 * returns the new hero URL/key; we mirror it into the listing so the Business
 * Page tab reflects the change immediately without re-fetching.
 */
export interface SetListingHeroPayload {
  heroImageUrl: string | null;
  heroImageKey: string | null;
}

export const setListingHeroAction = createAction(
  'marketplace/SET_LISTING_HERO',
)<SetListingHeroPayload>();

/**
 * Local Redux sync after a successful business logo upload. The logo is saved
 * immediately via the settings API and lives on the BUSINESS entity; mirror it
 * into marketplace state so the Business Page preview (which reads business.logo)
 * reflects the new logo without waiting for a full listing refetch.
 */
export interface SetBusinessLogoPayload {
  logo: string;
  logoKey: string;
}

export const setBusinessLogoAction = createAction(
  'marketplace/SET_BUSINESS_LOGO',
)<SetBusinessLogoPayload>();

// Booking Settings Actions
export const updateBookingSettingsAction = createAsyncAction(
  'marketplace/UPDATE_BOOKING_SETTINGS_REQUEST',
  'marketplace/UPDATE_BOOKING_SETTINGS_SUCCESS',
  'marketplace/UPDATE_BOOKING_SETTINGS_FAILURE',
)<UpdateBookingSettingsPayload, BookingSettings, { message: string }>();

// Website builder offering (sections + variants): catalog with per-business ownership.
// Fetched on builder load (and again after returning from Stripe) so locked/owned
// states always reflect current ownership.
export const fetchWebsiteVariantCatalogAction = createAsyncAction(
  'marketplace/FETCH_VARIANT_CATALOG_REQUEST',
  'marketplace/FETCH_VARIANT_CATALOG_SUCCESS',
  'marketplace/FETCH_VARIANT_CATALOG_FAILURE',
)<void, WebsiteCatalogResponse, { message: string }>();

// One-time Stripe checkout for one or more paid variants; the saga redirects to the session URL.
export const createWebsiteVariantCheckoutAction = createAsyncAction(
  'marketplace/CREATE_VARIANT_CHECKOUT_REQUEST',
  'marketplace/CREATE_VARIANT_CHECKOUT_SUCCESS',
  'marketplace/CREATE_VARIANT_CHECKOUT_FAILURE',
)<WebsiteVariantCheckoutPayload, { url: string }, { message: string }>();

// Shopping cart (client-side; persisted to localStorage per business in the builder tab).
// Variants and section unlocks queue separately but check out in ONE Stripe session;
// clearVariantCartAction empties both.
export const addVariantToCartAction = createAction('marketplace/VARIANT_CART_ADD')<number>();
export const removeVariantFromCartAction = createAction('marketplace/VARIANT_CART_REMOVE')<number>();
export const clearVariantCartAction = createAction('marketplace/VARIANT_CART_CLEAR')();
export const hydrateVariantCartAction = createAction('marketplace/VARIANT_CART_HYDRATE')<number[]>();
export const addSectionToCartAction = createAction('marketplace/SECTION_CART_ADD')<number>();
export const removeSectionFromCartAction = createAction('marketplace/SECTION_CART_REMOVE')<number>();
export const hydrateSectionCartAction = createAction('marketplace/SECTION_CART_HYDRATE')<number[]>();

