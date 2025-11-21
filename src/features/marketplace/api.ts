import type { MarketplaceListingResponse, PublishMarketplaceListingRequest } from "./types";
import { apiClient } from "../../shared/lib/http";

export const getMarketplaceListingApi = async (): Promise<MarketplaceListingResponse> => {
  const { data } = await apiClient().get<MarketplaceListingResponse>('/marketplace-listing');
  return data;
}

export const publishMarketplaceListingApi = async (req: PublishMarketplaceListingRequest): Promise<void> => {
  const formData = new FormData();
  formData.append('metadata', JSON.stringify(req.payload));

  if (req.newImageFiles) {
    Object.entries(req.newImageFiles).forEach(([tempId, file]) => {
      formData.append(`newImages[${tempId}]`, file);
    });
  }

  await apiClient().post('/marketplace-listing/publish', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export const updateMarketplaceVisibilityApi = async (isVisible: boolean): Promise<{ isVisible: boolean }> => {
  const { data } = await apiClient().post<{ isVisible: boolean }>('/marketplace-listing/update-visibility', { isVisible });
  return data;
}

