import { apiClient } from "../../shared/lib/http";
import type { 
  Assignment, 
  AssignmentRequestPayload, 
  AssignmentSummary,
  TeamMemberAssignment,
  ServiceAssignment,
  LocationAssignment,
  BulkAssignmentPayload
} from "./types";
import type { FilterItem } from "../../shared/types/common";

// Legacy API functions
export const listAssignmentsRequest = async (filters: Array<FilterItem>) => {
  const { data } = await apiClient().post<{ summary: AssignmentSummary; assignments: Assignment[] }>(
    "/assignments/list",
    { filters }
  );
  return data;
};

export const createAssignmentRequest = async (payload: AssignmentRequestPayload) => {
  const { data } = await apiClient().post(
    "/assignments",
    payload
  );
  return data;
};

export const getAssignmentsByIdRequest = async (serviceId: number) => {
  const { data } = await apiClient().get(
      `/assignments/service/${serviceId}/users`,
  );
  return data;
};

export const deleteAssignmentRequest = async (serviceId: number, userId: number) => {
  const { data } = await apiClient().delete(
      `/assignments/user/${userId}/service/${serviceId}`,
  );
  return data;
};

export const editAssignmentRequest = async (payload: AssignmentRequestPayload) => {
  const { data} = await apiClient().post(
      "/assignments/edit",
      payload
  );
  return data;
};

// New perspective-based API functions

// Team Members perspective
export const fetchTeamMemberAssignmentsRequest = async (): Promise<TeamMemberAssignment[]> => {
  const { data } = await apiClient().get<TeamMemberAssignment[]>('/assignments/team-members');
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

// Services perspective
export const fetchServiceAssignmentsRequest = async (): Promise<ServiceAssignment[]> => {
  const { data } = await apiClient().get<ServiceAssignment[]>('/assignments/services');
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

export const removeTeamMemberFromServiceRequest = async (serviceId: number, userId: number) => {
  const { data } = await apiClient().delete(`/assignments/services/${serviceId}/team-members/${userId}`);
  return data;
};

export const removeLocationFromServiceRequest = async (serviceId: number, locationId: number) => {
  const { data } = await apiClient().delete(`/assignments/services/${serviceId}/locations/${locationId}`);
  return data;
};

// Locations perspective
export const fetchLocationAssignmentsRequest = async (): Promise<LocationAssignment[]> => {
  const { data } = await apiClient().get<LocationAssignment[]>('/assignments/locations');
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

export const removeTeamMemberFromLocationRequest = async (locationId: number, userId: number) => {
  const { data } = await apiClient().delete(`/assignments/locations/${locationId}/team-members/${userId}`);
  return data;
};

export const removeServiceFromLocationRequest = async (locationId: number, serviceId: number) => {
  const { data } = await apiClient().delete(`/assignments/locations/${locationId}/services/${serviceId}`);
  return data;
};

// Bulk operations
export const bulkAssignRequest = async (payload: BulkAssignmentPayload) => {
  const { data } = await apiClient().post('/assignments/bulk', payload);
  return data;
};


