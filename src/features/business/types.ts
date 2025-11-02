export interface Industry {
  id: number;
  name: string;
}

export interface Business {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  email: string;
  phone: string;
  timezone: string;
  country: string | null;
  stripeCurrency?: string;
  businessCurrency: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  isActive: boolean;
  industry: Industry | null;
  trialEndsAt: string | null;
  daysRemaining: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessState {
  current: Business | null;
  isLoading: boolean;
  error: string | null;
}


