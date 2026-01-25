import { apiClient } from '../../../shared/lib/http';
import type { AssignedLocation, LocationAssignments } from './types';

// Get all locations assigned to the current team member
export const getAssignedLocations = async (): Promise<AssignedLocation[]> => {
  const response = await apiClient().get<{ locations: AssignedLocation[] }>(
    '/team-member-account/assigned-locations'
  );
  return response.data.locations || [];
};

// Get services and bundles assigned at a specific location
export const getLocationAssignments = async (
  locationId: number
): Promise<LocationAssignments> => {
  const response = await apiClient().get<LocationAssignments>(
    `/team-member-account/assignments/${locationId}`
  );
  return response.data;
};
