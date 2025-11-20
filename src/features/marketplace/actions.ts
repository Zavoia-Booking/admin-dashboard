import { createAsyncAction } from "typesafe-actions";
import type { MarketplaceListingResponse, PublishMarketplaceListingPayload } from "./types";

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

export const updateMarketplaceVisibilityAction = createAsyncAction(
  'marketplace/UPDATE_VISIBILITY_REQUEST',
  'marketplace/UPDATE_VISIBILITY_SUCCESS',
  'marketplace/UPDATE_VISIBILITY_FAILURE',
)<{ isVisible: boolean }, { isVisible: boolean }, { message: string }>();

