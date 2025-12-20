import { apiClient } from "../../shared/lib/http";
import type { 
  LocationFullAssignment,
  StaffServicesAtLocation,
  ServiceStaffOverrides,
  UpdateLocationServicesPayload,
  UpdateStaffServicesPayload,
  UpdateLocationTeamMembersPayload,
  UpdateLocationAssignmentsPayload,
} from "./types";

// Fetch full location assignment data with services and team members
export const fetchLocationFullAssignmentRequest = async (locationId: number): Promise<LocationFullAssignment> => {
  const { data } = await apiClient().get<LocationFullAssignment>(`/assignments/locations/${locationId}/full`);
  return data;
};

// Update location services (enable/disable and location-level overrides)
export const updateLocationServicesRequest = async (payload: UpdateLocationServicesPayload): Promise<void> => {
  const { locationId, services } = payload;
  await apiClient().put(`/assignments/locations/${locationId}/services`, { services });
};

// Fetch staff services at a specific location
export const fetchStaffServicesAtLocationRequest = async (
  locationId: number,
  userId: number
): Promise<StaffServicesAtLocation> => {
  const { data } = await apiClient().get<StaffServicesAtLocation>(
    `/assignments/locations/${locationId}/staff/${userId}/services`
  );
  return data;
};

// Fetch all staff members with overrides for a specific service at a location
export const fetchServiceStaffOverridesRequest = async (
  locationId: number,
  serviceId: number
): Promise<ServiceStaffOverrides> => {
  const { data } = await apiClient().get<ServiceStaffOverrides>(
    `/assignments/locations/${locationId}/services/${serviceId}/staff-overrides`
  );
  return data;
};

// Update staff services at a location
export const updateStaffServicesRequest = async (payload: UpdateStaffServicesPayload): Promise<void> => {
  const { locationId, userId, services } = payload;
  await apiClient().put(`/assignments/locations/${locationId}/staff/${userId}/services`, { services });
};

// Unified update for location assignments (services and team members)
export const updateLocationAssignmentsRequest = async (payload: UpdateLocationAssignmentsPayload): Promise<void> => {
  const { locationId, services, userIds } = payload;
  await apiClient().put(`/assignments/locations/${locationId}`, { services, userIds });
};

// Update team member assignments at a location (kept for backward compatibility if needed)
export const updateLocationTeamMembersRequest = async (payload: UpdateLocationTeamMembersPayload): Promise<void> => {
  const { locationId, userIds } = payload;
  await apiClient().put(`/assignments/locations/${locationId}/team-members`, { userIds });
};
