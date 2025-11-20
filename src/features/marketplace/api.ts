import type { MarketplaceListingResponse, PublishMarketplaceListingPayload } from "./types";
import { apiClient } from "../../shared/lib/http";

export const getMarketplaceListingApi = async (): Promise<MarketplaceListingResponse> => {
  const { data } = await apiClient().get<MarketplaceListingResponse>('/marketplace-listing');
  return data;
}

export const publishMarketplaceListingApi = async (payload: PublishMarketplaceListingPayload): Promise<void> => {
  await apiClient().post('/marketplace-listing/publish', payload);
}

export const updateMarketplaceVisibilityApi = async (isVisible: boolean): Promise<{ isVisible: boolean }> => {
  const { data } = await apiClient().post<{ isVisible: boolean }>('/marketplace-listing/update-visibility', { isVisible });
  return data;
}

