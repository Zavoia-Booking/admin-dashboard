import { createAsyncAction, createAction } from "typesafe-actions";
import type { 
  AssignmentFilterState, 
  AssignmentGroup, 
  AssignmentItem, 
  AssignmentRequestPayload,
  AssignmentPerspective,
  TeamMemberAssignment,
  ServiceAssignment,
  LocationAssignment,
  BulkAssignmentPayload
} from "./types";

// Legacy actions (keep for backwards compatibility)
export const listAssignmentsAction = createAsyncAction(
  'ASSIGNMENTS/LIST_REQUEST',
  'ASSIGNMENTS/LIST_SUCCESS',
  'ASSIGNMENTS/LIST_FAILURE',
)<void, Array<AssignmentGroup>, { message: string }>();

export const setAssignmentFiltersAction = createAsyncAction(
  'ASSIGNMENTS/SET_FILTERS_REQUEST',
  'ASSIGNMENTS/SET_FILTERS_SUCCESS',
  'ASSIGNMENTS/SET_FILTERS_FAILURE',
)<AssignmentFilterState, AssignmentFilterState, { message: string }>();

export const createAssignmentAction = createAsyncAction(
  'ASSIGNMENTS/CREATE_REQUEST',
  'ASSIGNMENTS/CREATE_SUCCESS',
  'ASSIGNMENTS/CREATE_FAILURE',
)<AssignmentRequestPayload, any, any>();

export const editAssignmentAction = createAsyncAction(
    'ASSIGNMENTS/EDIT/REQUEST',
    'ASSIGNMENTS/EDIT/SUCCESS',
    'ASSIGNMENTS/EDIT/FAILURE',
)<AssignmentRequestPayload, void, void>();

export const toggleAssignmentFormAction = createAction('ASSIGNMENTS/TOGGLE_ADD_FORM')<boolean>();
export const closeViewDetailsFormAction = createAction('ASSIGNMENTS/TOGGLE_VIEW_FORM')<void>();
export const toggleEditAssignmentFormAction = createAction('ASSIGNMENTS/TOGGLE/EDIT/FORM')<{open: boolean, item: AssignmentItem | null}>();

export const viewAssignmentDetailsAction = createAsyncAction(
    'ASSIGNMENTS/DETAILS/REQUEST',
    'ASSIGNMENTS/DETAILS/SUCCESS',
    'ASSIGNMENTS/DETAILS/FAILURE',
)<{serviceId: number}, Array<AssignmentItem>, { message: string }>();

export const deleteAssignmentAction = createAsyncAction(
    'ASSIGNMENTS/DELETE/REQUEST',
    'ASSIGNMENTS/DELETE/SUCCESS',
    'ASSIGNMENTS/DELETE/FAILURE',
)<{serviceId: number, userId: number}, void, void>();

// New perspective-based actions
export const setPerspectiveAction = createAction('ASSIGNMENTS/SET_PERSPECTIVE')<AssignmentPerspective>();

export const setSearchQueryAction = createAction('ASSIGNMENTS/SET_SEARCH_QUERY')<string>();

// Team Members perspective
export const fetchTeamMemberAssignmentsAction = createAsyncAction(
  'ASSIGNMENTS/FETCH_TEAM_MEMBERS_REQUEST',
  'ASSIGNMENTS/FETCH_TEAM_MEMBERS_SUCCESS',
  'ASSIGNMENTS/FETCH_TEAM_MEMBERS_FAILURE',
)<void, TeamMemberAssignment[], { message: string }>();

export const selectTeamMemberAction = createAction('ASSIGNMENTS/SELECT_TEAM_MEMBER')<number | null>();

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

// Services perspective
export const fetchServiceAssignmentsAction = createAsyncAction(
  'ASSIGNMENTS/FETCH_SERVICES_REQUEST',
  'ASSIGNMENTS/FETCH_SERVICES_SUCCESS',
  'ASSIGNMENTS/FETCH_SERVICES_FAILURE',
)<void, ServiceAssignment[], { message: string }>();

export const selectServiceAction = createAction('ASSIGNMENTS/SELECT_SERVICE')<number | null>();

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

// Locations perspective
export const fetchLocationAssignmentsAction = createAsyncAction(
  'ASSIGNMENTS/FETCH_LOCATIONS_REQUEST',
  'ASSIGNMENTS/FETCH_LOCATIONS_SUCCESS',
  'ASSIGNMENTS/FETCH_LOCATIONS_FAILURE',
)<void, LocationAssignment[], { message: string }>();

export const selectLocationAction = createAction('ASSIGNMENTS/SELECT_LOCATION')<number | null>();

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

// Bulk operations
export const bulkAssignAction = createAsyncAction(
  'ASSIGNMENTS/BULK_ASSIGN_REQUEST',
  'ASSIGNMENTS/BULK_ASSIGN_SUCCESS',
  'ASSIGNMENTS/BULK_ASSIGN_FAILURE',
)<BulkAssignmentPayload, void, { message: string }>();