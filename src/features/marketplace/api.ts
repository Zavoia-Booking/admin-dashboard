import type { MarketplaceListingResponse, PublishMarketplaceListingPayload, BookingSettings, UpdateBookingSettingsPayload, PortfolioImageData } from "./types";
import { apiClient } from "../../shared/lib/http";

export interface LocationPortfolioMutationResponse {
  url?: string;
  key?: string;
  alreadyExisted?: boolean;
  success?: boolean;
  portfolioImages: PortfolioImageData[];
  featuredImage: string | null;
}

export const getMarketplaceListingApi = async (): Promise<MarketplaceListingResponse> => {
  const { data } = await apiClient().get<MarketplaceListingResponse>('/marketplace-listing');
  return data;
}

export const uploadMarketplaceImageApi = async (
  locationId: number,
  file: File,
): Promise<LocationPortfolioMutationResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient().post<LocationPortfolioMutationResponse>(
    `/marketplace-listing/locations/${locationId}/portfolio`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
};

export const deleteMarketplaceImageApi = async (
  locationId: number,
  key: string,
): Promise<LocationPortfolioMutationResponse> => {
  const { data } = await apiClient().delete<LocationPortfolioMutationResponse>(
    `/marketplace-listing/locations/${locationId}/portfolio/${encodeURIComponent(key)}`,
  );
  return data;
};

export const updateMarketplaceFeaturedImageApi = async (
  locationId: number,
  url: string,
): Promise<LocationPortfolioMutationResponse> => {
  const { data } = await apiClient().post<LocationPortfolioMutationResponse>(
    `/marketplace-listing/locations/${locationId}/portfolio/featured`,
    { url },
  );
  return data;
};

export const publishMarketplaceListingApi = async (payload: PublishMarketplaceListingPayload): Promise<void> => {
  await apiClient().post('/marketplace-listing/publish', payload);
}

export interface LocationMarketplaceFlagsResponse {
  id: number;
  isPublic: boolean;
  allowOnlineBooking: boolean;
}

export const updateLocationMarketplaceFlagsApi = async (
  locationId: number,
  payload: { isPublic?: boolean; allowOnlineBooking?: boolean },
): Promise<LocationMarketplaceFlagsResponse> => {
  const { data } = await apiClient().patch<LocationMarketplaceFlagsResponse>(
    `/marketplace-listing/locations/${locationId}/marketplace-flags`,
    payload,
  );
  return data;
};

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


// ---------------------------------------------------------------------------
// Location marketplace tags — dictionaries + per-location load/save.
// ---------------------------------------------------------------------------

/**
 * Raw dictionary entry returned by the backend.
 *   - `slug` is the stable identifier shared with every consumer.
 *   - `name` is the canonical English display label served from the DB.
 * Frontends use `name` as the default chip label and may override per locale
 * via the `locationMarketplaceDetails` i18n namespace.
 */
export type TagDictionaryEntry = {
  id: number;
  slug: string;
  name: string;
};

export type LocationTagDictionaries = {
  amenities: TagDictionaryEntry[];
  audience: TagDictionaryEntry[];
  values: TagDictionaryEntry[];
  accessibility: TagDictionaryEntry[];
  paymentMethods: TagDictionaryEntry[];
  languages: TagDictionaryEntry[];
};

export type LocationMarketplaceTags = {
  amenityTagIds: number[];
  audienceTagIds: number[];
  valueTagIds: number[];
  accessibilityTagIds: number[];
  paymentMethodTagIds: number[];
  languageTagIds: number[];
};

export const EMPTY_LOCATION_MARKETPLACE_TAGS: LocationMarketplaceTags = {
  amenityTagIds: [],
  audienceTagIds: [],
  valueTagIds: [],
  accessibilityTagIds: [],
  paymentMethodTagIds: [],
  languageTagIds: [],
};

export const getLocationTagDictionariesApi = async (): Promise<LocationTagDictionaries> => {
  const { data } = await apiClient().get<{ dictionaries: LocationTagDictionaries }>(
    "/tags/location-marketplace",
  );
  return data.dictionaries;
};

export const getLocationMarketplaceTagsApi = async (
  locationId: number,
): Promise<LocationMarketplaceTags> => {
  const { data } = await apiClient().get<{ tags: LocationMarketplaceTags }>(
    `/locations/${locationId}/marketplace-tags`,
  );
  return data.tags;
};

export const updateLocationMarketplaceTagsApi = async (
  locationId: number,
  payload: Partial<LocationMarketplaceTags>,
): Promise<LocationMarketplaceTags> => {
  const { data } = await apiClient().patch<{
    message: string;
    tags: LocationMarketplaceTags;
  }>(`/locations/${locationId}/marketplace-tags`, payload);
  return data.tags;
};
