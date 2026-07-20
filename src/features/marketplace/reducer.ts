import * as actions from "./actions";
import type { MarketplaceState } from "./types";
import { getType, type ActionType } from "typesafe-actions";
import type { Reducer } from "redux";
import {
  hydrateSessionAction,
  logoutRequestAction,
  selectBusinessAction,
  setAuthUserAction,
} from "../auth/actions";

type Actions =
  | ActionType<typeof actions>
  | ActionType<typeof hydrateSessionAction>
  | ActionType<typeof logoutRequestAction>
  | ActionType<typeof selectBusinessAction>
  | ActionType<typeof setAuthUserAction>;

const initialState: MarketplaceState = {
  scopeBusinessId: null,
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

function normalizeScopeBusinessId(value: number | string | null | undefined): string | null {
  return value === null || value === undefined ? null : String(value);
}

function resetForScope(state: MarketplaceState, scopeBusinessId: string | null): MarketplaceState {
  return state.scopeBusinessId === scopeBusinessId
    ? state
    : { ...initialState, scopeBusinessId };
}

export const MarketplaceReducer: Reducer<MarketplaceState, any> = (state: MarketplaceState = initialState, action: Actions) => {
  switch (action.type) {
    case getType(setAuthUserAction):
      return resetForScope(state, normalizeScopeBusinessId(action.payload.user?.businessId));

    case getType(hydrateSessionAction.success):
      return resetForScope(
        state,
        normalizeScopeBusinessId(action.payload.businessId ?? action.payload.user?.businessId),
      );

    case getType(selectBusinessAction.success):
      return resetForScope(state, normalizeScopeBusinessId(action.payload.user?.businessId));

    case getType(logoutRequestAction.success):
      return initialState;

    case getType(actions.fetchMarketplaceListingAction.request):
      return { ...state, isLoading: true, error: null };

    case getType(actions.fetchMarketplaceListingAction.success):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
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
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return { ...state, isLoading: false, error: action.payload.message };

    case getType(actions.publishMarketplaceListingAction.request):
      return { ...state, isPublishing: true, error: null };

    case getType(actions.publishMarketplaceListingAction.success):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
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
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
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
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
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

    case getType(actions.setBusinessLogoAction):
      return {
        ...state,
        business: state.business
          ? { ...state.business, logo: action.payload.logo, logoKey: action.payload.logoKey }
          : state.business,
      };

    case getType(actions.updateLocationMarketplaceFlagsAction.failure):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return {
        ...state,
        updatingLocationFlags: state.updatingLocationFlags.filter((id) => id !== action.payload.locationId),
        error: action.payload.message,
      };

    // Booking Settings
    case getType(actions.updateBookingSettingsAction.request):
      return { ...state, isSavingBookingSettings: true, error: null };

    case getType(actions.updateBookingSettingsAction.success):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return { ...state, isSavingBookingSettings: false, bookingSettings: action.payload, error: null };

    case getType(actions.updateBookingSettingsAction.failure):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return { ...state, isSavingBookingSettings: false, error: action.payload.message };

    default:
      return state;
  }
}
