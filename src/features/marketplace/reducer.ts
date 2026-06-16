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
      return { ...state, isPublishing: false, error: null };

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

    default:
      return state;
  }
}

