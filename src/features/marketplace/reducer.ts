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
  locations: [],
  services: [],
  categories: [],
  teamMembers: [],
  industries: [],
  listedLocations: [],
  listedServices: [],
  listedCategories: [],
  listedTeamMembers: [],
  isPublishing: false,
  isUpdatingVisibility: false,
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
        locations: action.payload.locations,
        services: action.payload.services,
        categories: action.payload.categories,
        teamMembers: action.payload.teamMembers,
        industries: action.payload.industries,
        // Extract IDs from objects if they're objects, otherwise use as is
        listedLocations: Array.isArray(action.payload.listedLocations) 
          ? action.payload.listedLocations.map((item: any) => typeof item === 'object' ? item.locationId : item)
          : [],
        listedServices: Array.isArray(action.payload.listedServices)
          ? action.payload.listedServices.map((item: any) => typeof item === 'object' ? item.serviceId : item)
          : [],
        listedCategories: Array.isArray(action.payload.listedCategories)
          ? action.payload.listedCategories.map((item: any) => typeof item === 'object' ? item.categoryId : item)
          : [],
        listedTeamMembers: Array.isArray(action.payload.listedTeamMembers)
          ? action.payload.listedTeamMembers.map((item: any) => typeof item === 'object' ? item.userId : item)
          : [],
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

    default:
      return state;
  }
}

