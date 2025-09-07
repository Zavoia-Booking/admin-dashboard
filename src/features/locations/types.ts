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
  email?: string;
  address?: string;
  isActive?: boolean;
  timezone: string;
  workingHours: WorkingHours;
  isRemote: boolean;
}
