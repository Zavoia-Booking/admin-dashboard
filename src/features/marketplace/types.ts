// Business data from API response
export interface Business {
  id: number;
  name: string;
  email: string;
  description: string;
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
  portfolioImages: string[] | null;
  marketplaceName?: string | null; // Custom name for marketplace
  marketplaceEmail?: string | null; // Public contact email
  marketplaceDescription?: string | null; // Business description
  featuredImage?: string | null; // Featured image URL
  useBusinessName?: boolean; // Use business name or custom
  useBusinessEmail?: boolean; // Use business email or custom
  useBusinessDescription?: boolean; // Use business description or custom
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
  isActive: boolean;
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
  isActive: boolean;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: Category;
}

export interface TeamMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Industry {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
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
}

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
}

