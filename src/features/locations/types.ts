import type { LocationType, WorkingHours } from "../../shared/types/location";

export interface LocationState {
  current: LocationType | null;
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
  timezone: string;
  workingHours: WorkingHours;
  isRemote: boolean;
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