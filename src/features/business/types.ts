export interface Industry {
  id: number;
  name: string;
}

export type BillingEntityType = 'company' | 'person';

export interface Business {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  email: string;
  phone: string;
  logo: string | null;
  timezone: string;
  country: string | null;
  countryCode: string | null; // ISO 3166-1 alpha-2 country code (e.g., "ro", "de")
  stripeCurrency?: string;
  businessCurrency: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  websiteUrl: string | null;
  pinterestUrl: string | null;
  businessSlug?: string | null; // Human-readable business-page slug (vanity URL)
  isActive: boolean;
  industry: Industry | null;
  trialEndsAt?: string | null;
  daysRemaining?: number | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateBusinessDTO {
  name?: string;
  description?: string;
  email?: string;
  phone?: string;
  businessCurrency?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  websiteUrl?: string;
  pinterestUrl?: string;
  industryId?: number;
}

export interface BillingDetailsSuggestions {
  businessName: string | null;
  countryCode: string | null;
  firstName: string | null;
  lastName: string | null;
}

export interface BillingDetails {
  billingEntityType: BillingEntityType | null;
  legalName: string | null;
  fiscalCode: string | null;
  registrationNumber: string | null;
  billingAddress: string | null;
  billingCity: string | null;
  billingCounty: string | null;
  billingCountryCode: string | null;
  suggestions: BillingDetailsSuggestions;
}

export interface UpdateBillingDetailsDTO {
  billingEntityType: BillingEntityType;
  legalName: string;
  billingAddress: string;
  billingCity: string;
  billingCounty: string;
  billingCountryCode: string;
  fiscalCode?: string;
  registrationNumber?: string;
}

export interface BusinessState {
  current: Business | null;
  isLoading: boolean;
  error: string | null;
  isUpdating: boolean;
  updateError: string | null;
}


