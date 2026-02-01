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
  isUpdatingVisibility: false,
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

    case getType(actions.updateMarketplaceVisibilityAction.request):
      return { ...state, isUpdatingVisibility: true, error: null };

    case getType(actions.updateMarketplaceVisibilityAction.success):
      return {
        ...state,
        isUpdatingVisibility: false,
        listing: state.listing ? { ...state.listing, isVisible: action.payload.isVisible } : null,
        error: null,
      };

    case getType(actions.updateMarketplaceVisibilityAction.failure):
      return { ...state, isUpdatingVisibility: false, error: action.payload.message };

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

