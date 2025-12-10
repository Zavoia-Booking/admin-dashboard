import { createAsyncAction, createAction } from "typesafe-actions";
import type { 
  TeamMemberAssignment,
  ServiceAssignment,
  LocationAssignment,
} from "./types";

// Team Members perspective
export const fetchTeamMemberAssignmentsAction = createAsyncAction(
  'ASSIGNMENTS/FETCH_TEAM_MEMBERS_REQUEST',
  'ASSIGNMENTS/FETCH_TEAM_MEMBERS_SUCCESS',
  'ASSIGNMENTS/FETCH_TEAM_MEMBERS_FAILURE',
)<void, TeamMemberAssignment[], { message: string }>();

export const selectTeamMemberAction = createAction('ASSIGNMENTS/SELECT_TEAM_MEMBER')<number | null>();

export const fetchTeamMemberAssignmentByIdAction = createAsyncAction(
  'ASSIGNMENTS/FETCH_TEAM_MEMBER_BY_ID_REQUEST',
  'ASSIGNMENTS/FETCH_TEAM_MEMBER_BY_ID_SUCCESS',
  'ASSIGNMENTS/FETCH_TEAM_MEMBER_BY_ID_FAILURE',
)<number, TeamMemberAssignment, { message: string }>();

export const assignServicesToTeamMemberAction = createAsyncAction(
  'ASSIGNMENTS/ASSIGN_SERVICES_TO_TEAM_MEMBER_REQUEST',
  'ASSIGNMENTS/ASSIGN_SERVICES_TO_TEAM_MEMBER_SUCCESS',
  'ASSIGNMENTS/ASSIGN_SERVICES_TO_TEAM_MEMBER_FAILURE',
)<{ userId: number; serviceIds: number[] }, void, { message: string }>();

export const assignLocationsToTeamMemberAction = createAsyncAction(
  'ASSIGNMENTS/ASSIGN_LOCATIONS_TO_TEAM_MEMBER_REQUEST',
  'ASSIGNMENTS/ASSIGN_LOCATIONS_TO_TEAM_MEMBER_SUCCESS',
  'ASSIGNMENTS/ASSIGN_LOCATIONS_TO_TEAM_MEMBER_FAILURE',
)<{ userId: number; locationIds: number[] }, void, { message: string }>();

export const updateTeamMemberAssignmentsAction = createAsyncAction(
  'ASSIGNMENTS/UPDATE_TEAM_MEMBER_ASSIGNMENTS_REQUEST',
  'ASSIGNMENTS/UPDATE_TEAM_MEMBER_ASSIGNMENTS_SUCCESS',
  'ASSIGNMENTS/UPDATE_TEAM_MEMBER_ASSIGNMENTS_FAILURE',
)<{
  userId: number;
  serviceIds: number[];
  locationIds: number[];
  services: Array<{
    serviceId: number;
    customPrice?: number;
    customDuration?: number;
  }>;
}, void, { message: string }>();

// Services perspective
export const selectServiceAction = createAction('ASSIGNMENTS/SELECT_SERVICE')<number | null>();

export const fetchServiceAssignmentByIdAction = createAsyncAction(
  'ASSIGNMENTS/FETCH_SERVICE_BY_ID_REQUEST',
  'ASSIGNMENTS/FETCH_SERVICE_BY_ID_SUCCESS',
  'ASSIGNMENTS/FETCH_SERVICE_BY_ID_FAILURE',
)<number, ServiceAssignment, { message: string }>();

export const assignTeamMembersToServiceAction = createAsyncAction(
  'ASSIGNMENTS/ASSIGN_TEAM_MEMBERS_TO_SERVICE_REQUEST',
  'ASSIGNMENTS/ASSIGN_TEAM_MEMBERS_TO_SERVICE_SUCCESS',
  'ASSIGNMENTS/ASSIGN_TEAM_MEMBERS_TO_SERVICE_FAILURE',
)<{ serviceId: number; userIds: number[] }, void, { message: string }>();

export const assignLocationsToServiceAction = createAsyncAction(
  'ASSIGNMENTS/ASSIGN_LOCATIONS_TO_SERVICE_REQUEST',
  'ASSIGNMENTS/ASSIGN_LOCATIONS_TO_SERVICE_SUCCESS',
  'ASSIGNMENTS/ASSIGN_LOCATIONS_TO_SERVICE_FAILURE',
)<{ serviceId: number; locationIds: number[] }, void, { message: string }>();

export const updateServiceAssignmentsAction = createAsyncAction(
  'ASSIGNMENTS/UPDATE_SERVICE_ASSIGNMENTS_REQUEST',
  'ASSIGNMENTS/UPDATE_SERVICE_ASSIGNMENTS_SUCCESS',
  'ASSIGNMENTS/UPDATE_SERVICE_ASSIGNMENTS_FAILURE',
)<{ serviceId: number; teamMemberIds: number[]; locationIds: number[] }, void, { message: string }>();

// Locations perspective
export const selectLocationAction = createAction('ASSIGNMENTS/SELECT_LOCATION')<number | null>();

export const fetchLocationAssignmentByIdAction = createAsyncAction(
  'ASSIGNMENTS/FETCH_LOCATION_BY_ID_REQUEST',
  'ASSIGNMENTS/FETCH_LOCATION_BY_ID_SUCCESS',
  'ASSIGNMENTS/FETCH_LOCATION_BY_ID_FAILURE',
)<number, LocationAssignment, { message: string }>();

export const assignTeamMembersToLocationAction = createAsyncAction(
  'ASSIGNMENTS/ASSIGN_TEAM_MEMBERS_TO_LOCATION_REQUEST',
  'ASSIGNMENTS/ASSIGN_TEAM_MEMBERS_TO_LOCATION_SUCCESS',
  'ASSIGNMENTS/ASSIGN_TEAM_MEMBERS_TO_LOCATION_FAILURE',
)<{ locationId: number; userIds: number[] }, void, { message: string }>();

export const assignServicesToLocationAction = createAsyncAction(
  'ASSIGNMENTS/ASSIGN_SERVICES_TO_LOCATION_REQUEST',
  'ASSIGNMENTS/ASSIGN_SERVICES_TO_LOCATION_SUCCESS',
  'ASSIGNMENTS/ASSIGN_SERVICES_TO_LOCATION_FAILURE',
)<{ locationId: number; serviceIds: number[] }, void, { message: string }>();

export const updateLocationAssignmentsAction = createAsyncAction(
  'ASSIGNMENTS/UPDATE_LOCATION_ASSIGNMENTS_REQUEST',
  'ASSIGNMENTS/UPDATE_LOCATION_ASSIGNMENTS_SUCCESS',
  'ASSIGNMENTS/UPDATE_LOCATION_ASSIGNMENTS_FAILURE',
)<{ locationId: number; teamMemberIds: number[]; serviceIds: number[] }, void, { message: string }>();