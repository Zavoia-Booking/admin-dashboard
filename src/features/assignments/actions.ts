import { createAsyncAction, createAction } from "typesafe-actions";
import type { 
  TeamMemberAssignment,
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