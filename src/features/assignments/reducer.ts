import { type ActionType, getType } from "typesafe-actions";
import * as actions from "./actions";
import type { AssignmentsState } from "./types";
import { type Reducer } from "redux";

type Actions = ActionType<typeof actions>;

const initialState: AssignmentsState = {
  selectedTeamMemberId: null,
  selectedServiceId: null,
  selectedLocationId: null,
  teamMemberAssignments: [],
  selectedTeamMemberAssignment: null,
  selectedServiceAssignment: null,
  selectedLocationAssignment: null,
  isLoading: false,
  isSaving: false,
};

export const AssignmentsReducer: Reducer<AssignmentsState, any> = (state: AssignmentsState = initialState, action: Actions): AssignmentsState => {
  switch (action.type) {
    // Team Members
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
      
    case getType(actions.fetchTeamMemberAssignmentByIdAction.request):
      return { ...state, isLoading: true };
    case getType(actions.fetchTeamMemberAssignmentByIdAction.success):
      return { 
        ...state, 
        selectedTeamMemberAssignment: action.payload,
        isLoading: false 
      };
    case getType(actions.fetchTeamMemberAssignmentByIdAction.failure):
      return { ...state, isLoading: false };
      
    case getType(actions.selectTeamMemberAction):
      return { ...state, selectedTeamMemberId: action.payload };
      
    case getType(actions.assignServicesToTeamMemberAction.request):
    case getType(actions.assignLocationsToTeamMemberAction.request):
    case getType(actions.updateTeamMemberAssignmentsAction.request):
      return { ...state, isSaving: true };
    case getType(actions.assignServicesToTeamMemberAction.success):
    case getType(actions.assignServicesToTeamMemberAction.failure):
    case getType(actions.assignLocationsToTeamMemberAction.success):
    case getType(actions.assignLocationsToTeamMemberAction.failure):
    case getType(actions.updateTeamMemberAssignmentsAction.success):
    case getType(actions.updateTeamMemberAssignmentsAction.failure):
      return { ...state, isSaving: false };
    
    // Services
    case getType(actions.fetchServiceAssignmentByIdAction.request):
      return { ...state, isLoading: true };
    case getType(actions.fetchServiceAssignmentByIdAction.success):
      return { 
        ...state, 
        selectedServiceAssignment: action.payload,
        isLoading: false 
      };
    case getType(actions.fetchServiceAssignmentByIdAction.failure):
      return { ...state, isLoading: false };
      
    case getType(actions.selectServiceAction):
      return { ...state, selectedServiceId: action.payload };
      
    case getType(actions.assignTeamMembersToServiceAction.request):
    case getType(actions.assignLocationsToServiceAction.request):
    case getType(actions.updateServiceAssignmentsAction.request):
      return { ...state, isSaving: true };
    case getType(actions.assignTeamMembersToServiceAction.success):
    case getType(actions.assignTeamMembersToServiceAction.failure):
    case getType(actions.assignLocationsToServiceAction.success):
    case getType(actions.assignLocationsToServiceAction.failure):
    case getType(actions.updateServiceAssignmentsAction.success):
    case getType(actions.updateServiceAssignmentsAction.failure):
      return { ...state, isSaving: false };
    
    // Locations
    case getType(actions.fetchLocationAssignmentByIdAction.request):
      return { ...state, isLoading: true };
    case getType(actions.fetchLocationAssignmentByIdAction.success):
      return { 
        ...state, 
        selectedLocationAssignment: action.payload,
        isLoading: false 
      };
    case getType(actions.fetchLocationAssignmentByIdAction.failure):
      return { ...state, isLoading: false };
      
    case getType(actions.selectLocationAction):
      return { ...state, selectedLocationId: action.payload };
      
    case getType(actions.assignTeamMembersToLocationAction.request):
    case getType(actions.assignServicesToLocationAction.request):
    case getType(actions.updateLocationAssignmentsAction.request):
      return { ...state, isSaving: true };
    case getType(actions.assignTeamMembersToLocationAction.success):
    case getType(actions.assignTeamMembersToLocationAction.failure):
    case getType(actions.assignServicesToLocationAction.success):
    case getType(actions.assignServicesToLocationAction.failure):
    case getType(actions.updateLocationAssignmentsAction.success):
    case getType(actions.updateLocationAssignmentsAction.failure):
      return { ...state, isSaving: false };
      
    default:
      return state;
  }
};
