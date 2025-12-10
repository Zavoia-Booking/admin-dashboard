import { apiClient } from "../../shared/lib/http";
import type { 
  TeamMemberAssignment,
  ServiceAssignment,
  LocationAssignment,
} from "./types";

// Team Members perspective
export const fetchTeamMemberAssignmentsRequest = async (): Promise<TeamMemberAssignment[]> => {
  const { data } = await apiClient().get<TeamMemberAssignment[]>('/assignments/team-members');
  return data;
};

export const fetchTeamMemberAssignmentByIdRequest = async (id: number): Promise<TeamMemberAssignment> => {
  const { data } = await apiClient().get<TeamMemberAssignment>(`/assignments/team-members/${id}`);
  return data;
};

export const assignServicesToTeamMemberRequest = async (userId: number, serviceIds: number[]) => {
  const { data } = await apiClient().post(`/assignments/team-members/${userId}/services`, { serviceIds });
  return data;
};

export const assignLocationsToTeamMemberRequest = async (userId: number, locationIds: number[]) => {
  const { data } = await apiClient().post(`/assignments/team-members/${userId}/locations`, { locationIds });
  return data;
};

export const removeServiceFromTeamMemberRequest = async (userId: number, serviceId: number) => {
  const { data } = await apiClient().delete(`/assignments/team-members/${userId}/services/${serviceId}`);
  return data;
};

export const removeLocationFromTeamMemberRequest = async (userId: number, locationId: number) => {
  const { data } = await apiClient().delete(`/assignments/team-members/${userId}/locations/${locationId}`);
  return data;
};

export const updateTeamMemberAssignmentsRequest = async (
  userId: number,
  serviceIds: number[],
  locationIds: number[],
  services: Array<{ serviceId: number; customPrice?: number; customDuration?: number }>,
) => {
  const { data } = await apiClient().post(`/assignments/team-members/update/${userId}`, {
    serviceIds,
    locationIds,
    services,
  });
  return data;
};

// Services perspective
export const fetchServiceAssignmentByIdRequest = async (id: number): Promise<ServiceAssignment> => {
  const { data } = await apiClient().get<ServiceAssignment>(`/assignments/services/${id}`);
  return data;
};

export const assignTeamMembersToServiceRequest = async (serviceId: number, userIds: number[]) => {
  const { data } = await apiClient().post(`/assignments/services/${serviceId}/team-members`, { userIds });
  return data;
};

export const assignLocationsToServiceRequest = async (serviceId: number, locationIds: number[]) => {
  const { data } = await apiClient().post(`/assignments/services/${serviceId}/locations`, { locationIds });
  return data;
};

export const updateServiceAssignmentsRequest = async (serviceId: number, teamMemberIds: number[], locationIds: number[]) => {
  const { data } = await apiClient().post(`/assignments/services/update/${serviceId}`, { teamMemberIds, locationIds });
  return data;
};

// Locations perspective
export const fetchLocationAssignmentByIdRequest = async (id: number): Promise<LocationAssignment> => {
  const { data } = await apiClient().get<LocationAssignment>(`/assignments/locations/${id}`);
  return data;
};

export const assignTeamMembersToLocationRequest = async (locationId: number, userIds: number[]) => {
  const { data } = await apiClient().post(`/assignments/locations/${locationId}/team-members`, { userIds });
  return data;
};

export const assignServicesToLocationRequest = async (locationId: number, serviceIds: number[]) => {
  const { data } = await apiClient().post(`/assignments/locations/${locationId}/services`, { serviceIds });
  return data;
};

export const updateLocationAssignmentsRequest = async (locationId: number, teamMemberIds: number[], serviceIds: number[]) => {
  const { data } = await apiClient().post(`/assignments/locations/update/${locationId}`, { teamMemberIds, serviceIds });
  return data;
};


