import type { MarketplaceListingResponse, PublishMarketplaceListingPayload, BookingSettings, UpdateBookingSettingsPayload } from "./types";
import { apiClient } from "../../shared/lib/http";

export const getMarketplaceListingApi = async (): Promise<MarketplaceListingResponse> => {
  const { data } = await apiClient().get<MarketplaceListingResponse>('/marketplace-listing');
  return data;
}

export const uploadMarketplaceImageApi = async (file: File): Promise<{
  url: string;
  key: string;
}> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient().post('/marketplace-listing/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteMarketplaceImageApi = async (key: string): Promise<void> => {
  await apiClient().delete(`/marketplace-listing/delete-image/${encodeURIComponent(key)}`);
};

export const updateMarketplaceFeaturedImageApi = async (url: string): Promise<void> => {
  await apiClient().post('/marketplace-listing/update-featured-image', { url });
};

export const publishMarketplaceListingApi = async (payload: PublishMarketplaceListingPayload): Promise<void> => {
  await apiClient().post('/marketplace-listing/publish', payload);
}

export const updateMarketplaceVisibilityApi = async (isVisible: boolean): Promise<{ isVisible: boolean }> => {
  const { data } = await apiClient().post<{ isVisible: boolean }>('/marketplace-listing/update-visibility', { isVisible });
  return data;
}

// Booking Settings API
export const getBookingSettingsApi = async (): Promise<BookingSettings> => {
  const { data } = await apiClient().get<BookingSettings>('/marketplace-listing/booking-settings');
  return data;
}

export const updateBookingSettingsApi = async (payload: UpdateBookingSettingsPayload): Promise<BookingSettings> => {
  const { data } = await apiClient().put<BookingSettings>('/marketplace-listing/booking-settings', payload);
  return data;
}

