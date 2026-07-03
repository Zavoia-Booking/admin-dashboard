import * as actions from "./actions";
import type { MarketplaceState } from "./types";
import { getType, type ActionType } from "typesafe-actions";
import type { Reducer } from "redux";

type Actions = ActionType<typeof actions>;

const initialState: MarketplaceState = {
  isLoading: false,
  error: null,
  business: null,
  listing: null,
  locationCatalog: [],
  industries: [],
  industryTags: [],
  selectedIndustryTags: [],
  isPublishing: false,
  updatingLocationFlags: [],
  // Booking settings
  bookingSettings: null,
  isSavingBookingSettings: false,
  // Server-driven website builder offering (sections + variants)
  variantCatalog: [],
  sectionCatalog: [],
  isLoadingVariantCatalog: false,
  isCreatingVariantCheckout: false,
  variantCart: [],
  sectionCart: [],
};

export const MarketplaceReducer: Reducer<MarketplaceState, any> = (state: MarketplaceState = initialState, action: Actions) => {
  switch (action.type) {
    case getType(actions.fetchMarketplaceListingAction.request):
      return { ...state, isLoading: true, error: null };

    case getType(actions.fetchMarketplaceListingAction.success):
      return {
        ...state,
        isLoading: false,
        business: action.payload.business,
        listing: action.payload.listing,
        locationCatalog: action.payload.locationCatalog || [],
        industries: action.payload.industries || [],
        industryTags: action.payload.industryTags || [],
        selectedIndustryTags: action.payload.selectedIndustryTags || [],
        bookingSettings: action.payload.bookingSettings,
        error: null,
      };

    case getType(actions.fetchMarketplaceListingAction.failure):
      return { ...state, isLoading: false, error: action.payload.message };

    case getType(actions.publishMarketplaceListingAction.request):
      return { ...state, isPublishing: true, error: null };

    case getType(actions.publishMarketplaceListingAction.success):
      // The POST resolved 200, so the server set isListed=true. Reflect it immediately (the saga
      // also refetches) so the status strip doesn't flash back to the "to go live" checklist with a
      // re-enabled Publish button during the window between success and the refetch landing.
      return {
        ...state,
        isPublishing: false,
        error: null,
        listing: state.listing ? { ...state.listing, isListed: true } : state.listing,
      };

    case getType(actions.publishMarketplaceListingAction.failure):
      return { ...state, isPublishing: false, error: action.payload.message };

    case getType(actions.updateLocationMarketplaceFlagsAction.request):
      return {
        ...state,
        updatingLocationFlags: state.updatingLocationFlags.includes(action.payload.locationId)
          ? state.updatingLocationFlags
          : [...state.updatingLocationFlags, action.payload.locationId],
        error: null,
      };

    case getType(actions.updateLocationMarketplaceFlagsAction.success):
      return {
        ...state,
        updatingLocationFlags: state.updatingLocationFlags.filter((id) => id !== action.payload.locationId),
        locationCatalog: state.locationCatalog.map((loc) =>
          loc.id === action.payload.locationId
            ? { ...loc, isPublic: action.payload.isPublic, allowOnlineBooking: action.payload.allowOnlineBooking }
            : loc,
        ),
        error: null,
      };

    case getType(actions.setLocationPortfolioAction):
      return {
        ...state,
        locationCatalog: state.locationCatalog.map((loc) =>
          loc.id === action.payload.locationId
            ? {
                ...loc,
                portfolioImages: action.payload.portfolioImages,
                featuredImage: action.payload.featuredImage,
              }
            : loc,
        ),
      };

    case getType(actions.setListingHeroAction):
      return {
        ...state,
        listing: state.listing
          ? {
              ...state.listing,
              heroImageUrl: action.payload.heroImageUrl,
              heroImageKey: action.payload.heroImageKey,
            }
          : state.listing,
      };

    case getType(actions.setBusinessLogoAction):
      return {
        ...state,
        business: state.business
          ? { ...state.business, logo: action.payload.logo, logoKey: action.payload.logoKey }
          : state.business,
      };

    case getType(actions.updateLocationMarketplaceFlagsAction.failure):
      return {
        ...state,
        updatingLocationFlags: state.updatingLocationFlags.filter((id) => id !== action.payload.locationId),
        error: action.payload.message,
      };

    // Booking Settings
    case getType(actions.updateBookingSettingsAction.request):
      return { ...state, isSavingBookingSettings: true, error: null };

    case getType(actions.updateBookingSettingsAction.success):
      return { ...state, isSavingBookingSettings: false, bookingSettings: action.payload, error: null };

    case getType(actions.updateBookingSettingsAction.failure):
      return { ...state, isSavingBookingSettings: false, error: action.payload.message };

    // Paid section variants (website builder). Note: catalog failures don't touch the global
    // `error` — the catalog is an enhancement (locked/owned pills) and must never trip the
    // page-level error view; ownership is enforced server-side at publish regardless.
    case getType(actions.fetchWebsiteVariantCatalogAction.request):
      return { ...state, isLoadingVariantCatalog: true };

    case getType(actions.fetchWebsiteVariantCatalogAction.success):
      return {
        ...state,
        isLoadingVariantCatalog: false,
        variantCatalog: action.payload.variants,
        sectionCatalog: action.payload.sections,
      };

    case getType(actions.fetchWebsiteVariantCatalogAction.failure):
      return { ...state, isLoadingVariantCatalog: false };

    case getType(actions.createWebsiteVariantCheckoutAction.request):
      return { ...state, isCreatingVariantCheckout: true };

    // Stay "in flight" on success — the saga immediately redirects to Stripe, so the buy
    // button keeps its busy state instead of flashing back to idle before navigation.
    case getType(actions.createWebsiteVariantCheckoutAction.success):
      return state;

    case getType(actions.createWebsiteVariantCheckoutAction.failure):
      return { ...state, isCreatingVariantCheckout: false };

    // Shopping cart (deduplicated ids; localStorage sync lives in the builder tab).
    // Variants and section unlocks queue separately, check out together.
    case getType(actions.addVariantToCartAction):
      return state.variantCart.includes(action.payload)
        ? state
        : { ...state, variantCart: [...state.variantCart, action.payload] };

    case getType(actions.removeVariantFromCartAction):
      return { ...state, variantCart: state.variantCart.filter((id) => id !== action.payload) };

    case getType(actions.addSectionToCartAction):
      return state.sectionCart.includes(action.payload)
        ? state
        : { ...state, sectionCart: [...state.sectionCart, action.payload] };

    case getType(actions.removeSectionFromCartAction):
      return { ...state, sectionCart: state.sectionCart.filter((id) => id !== action.payload) };

    case getType(actions.clearVariantCartAction):
      return { ...state, variantCart: [], sectionCart: [] };

    case getType(actions.hydrateVariantCartAction):
      return { ...state, variantCart: [...new Set(action.payload)] };

    case getType(actions.hydrateSectionCartAction):
      return { ...state, sectionCart: [...new Set(action.payload)] };

    default:
      return state;
  }
}

