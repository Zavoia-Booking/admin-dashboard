import { createAsyncAction, createAction } from "typesafe-actions";
import type { 
  LocationFullAssignment,
  StaffServicesAtLocation,
  UpdateLocationServicesPayload,
  UpdateStaffServicesPayload,
  UpdateLocationTeamMembersPayload,
  UpdateLocationAssignmentsPayload,
} from "./types";

// Location selection
export const selectLocationAction = createAction('ASSIGNMENTS/SELECT_LOCATION')<number | null>();

// Fetch full location assignment data (services with overrides, team members)
export const fetchLocationFullAssignmentAction = createAsyncAction(
  'ASSIGNMENTS/FETCH_LOCATION_FULL_REQUEST',
  'ASSIGNMENTS/FETCH_LOCATION_FULL_SUCCESS',
  'ASSIGNMENTS/FETCH_LOCATION_FULL_FAILURE',
)<number | { locationId: number; skipLoading?: boolean }, LocationFullAssignment, { message: string }>();

// Update location services (enable/disable, set location-level overrides)
export const updateLocationServicesAction = createAsyncAction(
  'ASSIGNMENTS/UPDATE_LOCATION_SERVICES_REQUEST',
  'ASSIGNMENTS/UPDATE_LOCATION_SERVICES_SUCCESS',
  'ASSIGNMENTS/UPDATE_LOCATION_SERVICES_FAILURE',
)<UpdateLocationServicesPayload, void, { message: string }>();

// Fetch staff services at a specific location (for the drawer)
export const fetchStaffServicesAtLocationAction = createAsyncAction(
  'ASSIGNMENTS/FETCH_STAFF_SERVICES_REQUEST',
  'ASSIGNMENTS/FETCH_STAFF_SERVICES_SUCCESS',
  'ASSIGNMENTS/FETCH_STAFF_SERVICES_FAILURE',
)<{ locationId: number; userId: number }, StaffServicesAtLocation, { message: string }>();

// Update staff services at a location (can perform, custom pricing)
export const updateStaffServicesAction = createAsyncAction(
  'ASSIGNMENTS/UPDATE_STAFF_SERVICES_REQUEST',
  'ASSIGNMENTS/UPDATE_STAFF_SERVICES_SUCCESS',
  'ASSIGNMENTS/UPDATE_STAFF_SERVICES_FAILURE',
)<UpdateStaffServicesPayload, UpdateStaffServicesPayload, { message: string }>();

// Unified update for location assignments (services and team members)
export const updateLocationAssignmentsAction = createAsyncAction(
  'ASSIGNMENTS/UPDATE_LOCATION_ASSIGNMENTS_REQUEST',
  'ASSIGNMENTS/UPDATE_LOCATION_ASSIGNMENTS_SUCCESS',
  'ASSIGNMENTS/UPDATE_LOCATION_ASSIGNMENTS_FAILURE',
)<UpdateLocationAssignmentsPayload, void, { message: string }>();

// Update team member assignments at a location (add/remove members) - kept for backward compatibility
export const updateLocationTeamMembersAction = createAsyncAction(
  'ASSIGNMENTS/UPDATE_LOCATION_TEAM_MEMBERS_REQUEST',
  'ASSIGNMENTS/UPDATE_LOCATION_TEAM_MEMBERS_SUCCESS',
  'ASSIGNMENTS/UPDATE_LOCATION_TEAM_MEMBERS_FAILURE',
)<UpdateLocationTeamMembersPayload, void, { message: string }>();

// Update team member stats (servicesEnabled, overridesCount) without full refetch
export const updateTeamMemberStatsAction = createAction('ASSIGNMENTS/UPDATE_TEAM_MEMBER_STATS')<{
  userId: number;
  servicesEnabled: number;
  overridesCount: number;
}>();
