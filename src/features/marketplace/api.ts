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

// Keys allowed by backend UpdateBookingSettingsDto (strip id, businessId, createdAt, updatedAt)
const BOOKING_SETTINGS_UPDATE_KEYS = [
  'minAdvanceBookingMinutes',
  'maxAdvanceBookingMinutes',
  'slotIntervalMinutes',
  'bufferTimeMinutes',
  'cancellationWindowMinutes',
  'allowCustomerCancellation',
  'allowCustomerReschedule',
  'autoConfirmBookings',
  'allowStaffSelection',
  'showAnyStaffOption',
  'allowStaffCancelWithoutConfirmation',
  'allowStaffRescheduleWithoutConfirmation',
  'allowStaffBlockCalendarWithoutConfirmation',
  'staffBlockCalendarTypes',
  'emailEnabled',
  'smsEnabled',
  'reminderHoursBefore',
  'enforceMinAdvanceForAdmin',
] as const;

// Booking Settings API (backend may return { message, settings }; normalize to BookingSettings)
export const updateBookingSettingsApi = async (payload: Partial<UpdateBookingSettingsPayload>): Promise<BookingSettings> => {
  const body = Object.fromEntries(
    BOOKING_SETTINGS_UPDATE_KEYS.filter((k) => k in payload).map((k) => [k, (payload as Record<string, unknown>)[k]])
  );
  const { data } = await apiClient().put<BookingSettings | { message: string; settings: BookingSettings }>('/marketplace-listing/booking-settings', body);
  return (data as { settings?: BookingSettings }).settings ?? (data as BookingSettings);
}

