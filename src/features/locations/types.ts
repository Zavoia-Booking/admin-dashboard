import type { LocationType, WorkingHours } from "../../shared/types/location";
import type { BlockConflictAppointment } from "../../shared/types/calendar";

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
  createStatus: LocationSaveStatus;
  updateStatus: LocationSaveStatus;
  // List-load failures only — `error` is shared with create/update/fetch flows.
  listError: string | null;
  // True once a list request has settled (success or failure). Distinguishes
  // "no locations yet, still loading" from "this business has no locations".
  listLoaded: boolean;
  allLocations: LocationType[];
  isDeleting: boolean;
  deleteError: string | null;
  deleteResponse?: any | null;
  updateResponse?: UpdateLocationResponse | null;
  hoursConflictOffer: LocationHoursConflictOffer | null;
}

type LocationSaveStatus = 'idle' | 'pending' | 'success' | 'failure';

/** Pending "Save anyway?" offer after a 409: how many upcoming appointments the new hours leave outside, and the soonest one. */
export interface LocationHoursConflictOffer {
  payload: EditLocationType | EditLocationWorkingHours;
  total: number;
  firstAppointment: BlockConflictAppointment | null;
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
    latitude?: number;
    longitude?: number;
  };
  addressManualMode?: boolean; // Track if user was in manual or search mode
  mapPinConfirmed?: boolean; // Track if user confirmed the pin location on the map (top-level)
  timezone: string;
  workingHours: WorkingHours;
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
  workingHours?: WorkingHours;
  open247?: boolean;
  /** Resend after a 409 to keep hours that leave upcoming appointments outside them. */
  overrideConflicts?: boolean;
  // Address components for editing (optional, used for pre-filling on load)
  addressComponents?: {
    street?: string;
    streetNumber?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  addressManualMode?: boolean;
  useBusinessContact?: boolean; // Track if using business contact info
  mapPinConfirmed?: boolean; // Track if map pin has been confirmed
}

export interface EditLocationWorkingHours {
  id: number;
  workingHours: WorkingHours;
}