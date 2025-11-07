import type { LocationType, WorkingHours } from "../../shared/types/location";

export interface LocationState {
  isLoading: boolean;
  error: string | null;
  allLocations: LocationType[];
}

export interface NewLocationPayload {
  name: string;
  description?: string;
  phone: string;
  email: string;
  address?: string;
  // Address components for wizard (optional, used for pre-filling on load)
  addressComponents?: {
    street?: string;
    streetNumber?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  addressManualMode?: boolean; // Track if user was in manual or search mode
  timezone: string;
  workingHours: WorkingHours;
  isRemote: boolean;
  isActive: boolean;
  open247?: boolean;
}

export interface EditLocationType {
  id: number;
  name: string;
  address: string;
  email: string;
  phone: string;
  description: string;
  timezone: string;
  isRemote: boolean;
  isActive: boolean;
}

export interface EditLocationWorkingHours {
  id: number;
  workingHours: WorkingHours;
}