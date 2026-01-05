import type { Business as GlobalBusiness } from "../business/types";
import type { TeamMember as GlobalTeamMember } from "../../shared/types/team-member";

// Business data from API response - using the global business type
export type Business = GlobalBusiness;

// Marketplace listing model with customizable details
export interface MarketplaceListing {
  businessId: number;
  isListed: boolean;
  isVisible: boolean; // Controls marketplace visibility to users
  showTeamMembers: boolean;
  showServices: boolean;
  showLocations: boolean;
  allowOnlineBooking: boolean;
  portfolioImages: string[] | null;
  marketplaceName?: string | null; // Custom name for marketplace
  marketplaceEmail?: string | null; // Public contact email
  marketplaceDescription?: string | null; // Business description
  featuredImage?: string | null; // Featured image URL
  useBusinessName?: boolean; // Use business name or custom
  useBusinessEmail?: boolean; // Use business email or custom
  useBusinessDescription?: boolean; // Use business description or custom
  // Effective values calculated by backend
  effectiveName?: string;
  effectiveEmail?: string;
  effectiveDescription?: string;
}

export interface Location {
  id: number;
  uuid: string;
  name: string;
  description: string;
  phone: string;
  isRemote: boolean;
  email: string;
  address: string;
  addressComponents: {
    street?: string;
    streetNumber?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  mapPinConfirmed?: boolean;
  timezone: string;
  workingHours: any;
  open247: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  uuid: string;
  name: string;
  description: string;
  color: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: number;
  uuid: string;
  categoryId: number;
  name: string;
  description: string;
  price_amount_minor: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
  category: Category;
}

export type TeamMember = GlobalTeamMember;

export interface Industry {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceListingResponse {
  business: Business;
  listing: MarketplaceListing;
  locations: Location[];
  services: Service[];
  categories: Category[];
  teamMembers: TeamMember[];
  industries: Industry[];
  listedLocations: number[];
  listedServices: number[];
  listedCategories: number[];
  listedTeamMembers: number[];
}

// Payload for publishing marketplace listing
export interface NewImageMeta {
  tempId: string;
}

export interface PublishMarketplaceListingPayload {
  marketplaceName?: string;
  marketplaceEmail?: string;
  marketplaceDescription?: string;
  featuredImage?: string | null;
  portfolioImages?: string[];
  showTeamMembers?: boolean;
  showServices?: boolean;
  showLocations?: boolean;
  allowOnlineBooking?: boolean;
  useBusinessName?: boolean;
  useBusinessEmail?: boolean;
  useBusinessDescription?: boolean;
  locationIds?: number[];
  serviceIds?: number[];
  categoryIds?: number[];
  teamMemberIds?: number[];
  // Images diff payload for backend
  existingImageIds?: number[];
  newImagesMeta?: NewImageMeta[];
  featuredImageKey?: number | string;
}

export interface PublishMarketplaceListingRequest {
  payload: PublishMarketplaceListingPayload;
  newImageFiles?: Record<string, File>;
}

// Booking settings for marketplace
export interface BookingSettings {
  businessId: number;
  minAdvanceBookingMinutes: number;
  maxAdvanceBookingMinutes: number;
  slotIntervalMinutes: number;
  bufferTimeMinutes: number;
  cancellationWindowMinutes: number;
  allowCustomerCancellation: boolean;
  allowCustomerReschedule: boolean;
  autoConfirmBookings: boolean;
  requireCustomerAccount: boolean;
  requirePhoneNumber: boolean;
  allowStaffSelection: boolean;
  showAnyStaffOption: boolean;
  maxActiveBookingsPerCustomer: number | null;
  maxBookingsPerDay: number | null;
  showPrices: boolean;
  showDurations: boolean;
  showStaffImages: boolean;
  cancellationPolicyMessage: string | null;
  bookingConfirmationMessage: string | null;
}

// Payload for updating booking settings (omit businessId as it's not editable)
export type UpdateBookingSettingsPayload = Omit<BookingSettings, 'businessId'>;

// Redux state for marketplace feature
export interface MarketplaceState {
  isLoading: boolean;
  error: string | null;
  business: Business | null;
  listing: MarketplaceListing | null;
  locations: Location[];
  services: Service[];
  categories: Category[];
  teamMembers: TeamMember[];
  industries: Industry[];
  listedLocations: number[];
  listedServices: number[];
  listedCategories: number[];
  listedTeamMembers: number[];
  isPublishing: boolean;
  isUpdatingVisibility: boolean;
  // Booking settings
  bookingSettings: BookingSettings | null;
  isLoadingBookingSettings: boolean;
  isSavingBookingSettings: boolean;
}

