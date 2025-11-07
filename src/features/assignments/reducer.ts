import { type ActionType, getType } from "typesafe-actions";
import * as actions from "./actions";
import type { AssignmentsState, AssignmentFilterState, AssignmentGroup, AssignmentItem } from "./types";
import { getDefaultAssignmentFilters } from "./types";
import { type Reducer } from "redux";

type Actions = ActionType<typeof actions>;

const initialState: AssignmentsState = {
  // New perspective-based state
  activePerspective: 'team_members',
  selectedTeamMemberId: null,
  selectedServiceId: null,
  selectedLocationId: null,
  teamMemberAssignments: [],
  serviceAssignments: [],
  locationAssignments: [],
  searchQuery: '',
  isLoading: false,
  isSaving: false,
  
  // Legacy state
  assignments: [],
  summary: null,
  filters: getDefaultAssignmentFilters(),
  addForm: {
    open: false
  },
  editForm: {
    open: false,
    item: null,
  },
  viewDetailsPopup: {
    open: false,
    item: []
  }
};

export function setAssignments(state: AssignmentsState, payload: Array<AssignmentGroup>) {
  return { ...state, assignments: payload };
}

export function handleToggleAddForm(state: AssignmentsState, payload: boolean): AssignmentsState {
  return {
    ...state,
    addForm: {
      open: payload,
    }
  }
}

export function handleViewDetailsSuccess(state: AssignmentsState, payload: any): AssignmentsState {
  return {
    ...state,
    viewDetailsPopup: {
      open: true,
      item: payload,
    }
  }
}

export function handleCloseViewDetails(state: AssignmentsState): AssignmentsState {
  return {
    ...state,
    viewDetailsPopup: {
      open: false,
      item: []
    }
  }
}

export function handleToggleEditForm(state: AssignmentsState, payload: {open: boolean, item: AssignmentItem | null}): AssignmentsState {
  return {
    ...state,
    editForm: payload,
  }
}

export const AssignmentsReducer: Reducer<AssignmentsState, any> = (state: AssignmentsState = initialState, action: Actions): AssignmentsState => {
  switch (action.type) {
    // Legacy actions
    case getType(actions.listAssignmentsAction.success):
      return setAssignments(state, action.payload);
    case getType(actions.setAssignmentFiltersAction.success):
      return { ...state, filters: action.payload as AssignmentFilterState };
    case getType(actions.toggleAssignmentFormAction):
      return handleToggleAddForm(state, action.payload);
    case getType(actions.viewAssignmentDetailsAction.success):
      return handleViewDetailsSuccess(state, action.payload);
    case getType(actions.toggleEditAssignmentFormAction):
      return handleToggleEditForm(state, action.payload);
    case getType(actions.closeViewDetailsFormAction):
      return handleCloseViewDetails(state);
      
    // New perspective-based actions
    case getType(actions.setPerspectiveAction):
      return { 
        ...state, 
        activePerspective: action.payload,
        // Clear selections when switching perspectives
        selectedTeamMemberId: null,
        selectedServiceId: null,
        selectedLocationId: null
      };
      
    case getType(actions.setSearchQueryAction):
      return { ...state, searchQuery: action.payload };
      
    // Team Members perspective
    case getType(actions.fetchTeamMemberAssignmentsAction.request):
      return { ...state, isLoading: true };
    case getType(actions.fetchTeamMemberAssignmentsAction.success):
      return { 
        ...state, 
        teamMemberAssignments: action.payload,
        isLoading: false 
      };
    case getType(actions.fetchTeamMemberAssignmentsAction.failure):
      return { ...state, isLoading: false };
      
    case getType(actions.selectTeamMemberAction):
      return { ...state, selectedTeamMemberId: action.payload };
      
    case getType(actions.assignServicesToTeamMemberAction.request):
    case getType(actions.assignLocationsToTeamMemberAction.request):
      return { ...state, isSaving: true };
    case getType(actions.assignServicesToTeamMemberAction.success):
    case getType(actions.assignServicesToTeamMemberAction.failure):
    case getType(actions.assignLocationsToTeamMemberAction.success):
    case getType(actions.assignLocationsToTeamMemberAction.failure):
      return { ...state, isSaving: false };
      
    // Services perspective
    case getType(actions.fetchServiceAssignmentsAction.request):
      return { ...state, isLoading: true };
    case getType(actions.fetchServiceAssignmentsAction.success):
      return { 
        ...state, 
        serviceAssignments: action.payload,
        isLoading: false 
      };
    case getType(actions.fetchServiceAssignmentsAction.failure):
      return { ...state, isLoading: false };
      
    case getType(actions.selectServiceAction):
      return { ...state, selectedServiceId: action.payload };
      
    case getType(actions.assignTeamMembersToServiceAction.request):
    case getType(actions.assignLocationsToServiceAction.request):
      return { ...state, isSaving: true };
    case getType(actions.assignTeamMembersToServiceAction.success):
    case getType(actions.assignTeamMembersToServiceAction.failure):
    case getType(actions.assignLocationsToServiceAction.success):
    case getType(actions.assignLocationsToServiceAction.failure):
      return { ...state, isSaving: false };
      
    // Locations perspective
    case getType(actions.fetchLocationAssignmentsAction.request):
      return { ...state, isLoading: true };
    case getType(actions.fetchLocationAssignmentsAction.success):
      return { 
        ...state, 
        locationAssignments: action.payload,
        isLoading: false 
      };
    case getType(actions.fetchLocationAssignmentsAction.failure):
      return { ...state, isLoading: false };
      
    case getType(actions.selectLocationAction):
      return { ...state, selectedLocationId: action.payload };
      
    case getType(actions.assignTeamMembersToLocationAction.request):
    case getType(actions.assignServicesToLocationAction.request):
      return { ...state, isSaving: true };
    case getType(actions.assignTeamMembersToLocationAction.success):
    case getType(actions.assignTeamMembersToLocationAction.failure):
    case getType(actions.assignServicesToLocationAction.success):
    case getType(actions.assignServicesToLocationAction.failure):
      return { ...state, isSaving: false };
      
    // Bulk operations
    case getType(actions.bulkAssignAction.request):
      return { ...state, isSaving: true };
    case getType(actions.bulkAssignAction.success):
    case getType(actions.bulkAssignAction.failure):
      return { ...state, isSaving: false };
      
    default:
      return state;
  }
};
