import type { LocationType, WorkingHours } from "../../shared/types/location";

export interface UpdateLocationResponse {
  message: string;
  location: {
    id: number;
    name: string;
  };
  needsPinConfirmation?: boolean;
}

export interface LocationState {
  isLoading: boolean;
  error: string | null;
  allLocations: LocationType[];
  isDeleting: boolean;
  deleteError: string | null;
  deleteResponse?: any | null;
  updateResponse?: UpdateLocationResponse | null;
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
  open247?: boolean;
  useBusinessContact?: boolean; // Track if using business contact info
  teamMemberIds?: number[];
  serviceIds?: number[];
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
  workingHours?: WorkingHours;
  open247?: boolean;
  // Address components for editing (optional, used for pre-filling on load)
  addressComponents?: {
    street?: string;
    streetNumber?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  addressManualMode?: boolean;
  useBusinessContact?: boolean; // Track if using business contact info
}

export interface EditLocationWorkingHours {
  id: number;
  workingHours: WorkingHours;
}