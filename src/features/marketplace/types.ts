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
  hiddenBySystem?: boolean; // System-driven hide (billing/industry change); listing stays published
  showTeamMembers: boolean;
  showServices: boolean;
  showLocations: boolean;
  marketplaceName?: string | null; // Custom name for marketplace
  marketplaceEmail?: string | null; // Public contact email
  marketplacePhone?: string | null; // Public contact phone
  marketplaceDescription?: string | null; // Business description
  useBusinessName?: boolean; // Use business name or custom
  useBusinessEmail?: boolean; // Use business email or custom
  useBusinessPhone?: boolean; // Use business phone or custom
  useBusinessDescription?: boolean; // Use business description or custom
  // Business-page (microsite) content
  heroImageUrl?: string | null; // Hero/cover image URL
  heroImageKey?: string | null; // R2 storage key for hero deletion
  tagline?: string | null; // Short business-page tagline
  aboutContent?: string | null; // Long-form about content
  brandColorHex?: string | null; // Accent color, hex e.g. #1B9C85
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
  isPublic: boolean;
  allowOnlineBooking: boolean;
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

// Minimal bundle shape for marketplace catalog (from assignment tables)
export interface MarketplaceBundle {
  id: number;
  name: string;
}

// Location with assignments (read from actual assignment tables)
export interface LocationWithAssignments extends Location {
  services: Service[];
  bundles?: MarketplaceBundle[];
  teamMembers: TeamMember[];
  portfolioImages: PortfolioImageData[];
  featuredImage: string | null;
  // Cached per-location review stats (denormalized on the backend)
  averageRating?: number | null;
  totalReviews?: number;
}

export interface MarketplaceListingResponse {
  business: Business;
  listing: MarketplaceListing;
  // Location-scoped catalog (read from actual assignment tables)
  locationCatalog: LocationWithAssignments[];
  industries: Industry[];
  industryTags: IndustryTag[];
  selectedIndustryTags: IndustryTag[];
  bookingSettings: BookingSettings;
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
  useBusinessName?: boolean;
  useBusinessEmail?: boolean;
  useBusinessPhone?: boolean;
  useBusinessDescription?: boolean;
  industryTagIds?: number[];
  // Business-page (microsite) content. tagline/aboutContent/brandColorHex persist on the listing;
  // businessSlug persists on the business (vanity URL) and is uniqueness-checked server-side.
  tagline?: string;
  aboutContent?: string;
  brandColorHex?: string;
  businessSlug?: string;
  // Note: Per-location publicity and online-booking flags are toggled inline per location, not in this payload.
  // Note: Assignments are managed in the Assignments flow.
  // Note: Portfolio images AND featured image are saved immediately on change, not on Save.
}

// Booking settings for marketplace
export interface BookingSettings {
  businessId: number;
  minAdvanceBookingMinutes: number;
  maxAdvanceBookingMinutes: number;
  slotIntervalMinutes: number;
  bufferTimeMinutes: number;
  cancellationWindowMinutes: number;
  rescheduleWindowMinutes: number;
  allowCustomerCancellation: boolean;
  allowCustomerReschedule: boolean;
  autoConfirmBookings: boolean;
  allowStaffSelection: boolean;
  showAnyStaffOption: boolean;
  allowStaffCancelWithoutConfirmation: boolean;
  allowStaffRescheduleWithoutConfirmation: boolean;
  allowStaffBlockCalendarWithoutConfirmation: boolean;
  staffBlockCalendarTypes: string[];
  emailEnabled: boolean;
  smsEnabled: boolean;
  reminderHoursBefore: number;
  enforceMinAdvanceForAdmin: boolean;
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
  // Per-location flag updates in flight (location IDs)
  updatingLocationFlags: number[];
  // Booking settings
  bookingSettings: BookingSettings | null;
  isSavingBookingSettings: boolean;
}

