import type { Business as GlobalBusiness } from "../business/types";
import type { TeamMember as GlobalTeamMember } from "../../shared/types/team-member";

// Business data from API response - using the global business type
export type Business = GlobalBusiness;

export interface PortfolioImageData {
  url: string;
  key: string;
  originalName?: string;
  size?: number;
}

// Marketplace listing model with customizable details
export interface MarketplaceListing {
  businessId: number;
  isListed: boolean;
  isVisible: boolean; // Controls marketplace visibility to users
  showTeamMembers: boolean;
  showServices: boolean;
  showLocations: boolean;
  allowOnlineBooking: boolean;
  portfolioImages: PortfolioImageData[] | null;
  marketplaceName?: string | null; // Custom name for marketplace
  marketplaceEmail?: string | null; // Public contact email
  marketplacePhone?: string | null; // Public contact phone
  marketplaceDescription?: string | null; // Business description
  featuredImage?: string | null; // Featured image URL
  useBusinessName?: boolean; // Use business name or custom
  useBusinessEmail?: boolean; // Use business email or custom
  useBusinessPhone?: boolean; // Use business phone or custom
  useBusinessDescription?: boolean; // Use business description or custom
  // Effective values calculated by backend
  effectiveName?: string;
  effectiveEmail?: string;
  effectivePhone?: string;
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
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IndustryTag {
  id: number;
  name: string;
  slug?: string;
}

// Location with assignments (read from actual assignment tables)
export interface LocationWithAssignments extends Location {
  services: Service[];
  teamMembers: TeamMember[];
}

export interface MarketplaceListingResponse {
  business: Business;
  listing: MarketplaceListing;
  // Location-scoped catalog (read from actual assignment tables)
  locationCatalog: LocationWithAssignments[];
  industries: Industry[];
  industryTags: IndustryTag[];
  selectedIndustryTags: IndustryTag[];
}

// Payload for publishing marketplace listing
export interface PublishMarketplaceListingPayload {
  marketplaceName?: string;
  marketplaceEmail?: string;
  marketplacePhone?: string;
  marketplaceDescription?: string;
  showTeamMembers?: boolean;
  showServices?: boolean;
  showLocations?: boolean;
  allowOnlineBooking?: boolean;
  isVisible?: boolean;
  useBusinessName?: boolean;
  useBusinessEmail?: boolean;
  useBusinessPhone?: boolean;
  useBusinessDescription?: boolean;
  industryTagIds?: number[];
  // Note: Assignments are managed in the Assignments flow
  // Note: Portfolio images AND featured image are saved immediately on change, not on Save
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
  allowStaffSelection: boolean;
  showAnyStaffOption: boolean;
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
  // Location-scoped catalog (read from actual assignment tables)
  locationCatalog: LocationWithAssignments[];
  industries: Industry[];
  industryTags: IndustryTag[];
  selectedIndustryTags: IndustryTag[];
  isPublishing: boolean;
  isUpdatingVisibility: boolean;
  // Booking settings
  bookingSettings: BookingSettings | null;
  isLoadingBookingSettings: boolean;
  isSavingBookingSettings: boolean;
}

