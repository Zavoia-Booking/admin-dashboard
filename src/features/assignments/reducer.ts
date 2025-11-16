import { type ActionType, getType } from "typesafe-actions";
import * as actions from "./actions";
import type { AssignmentsState } from "./types";
import { type Reducer } from "redux";

type Actions = ActionType<typeof actions>;

const initialState: AssignmentsState = {
  selectedTeamMemberId: null,
  teamMemberAssignments: [],
  selectedTeamMemberAssignment: null,
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
      return { ...state, isSaving: true };
    case getType(actions.assignServicesToTeamMemberAction.success):
    case getType(actions.assignServicesToTeamMemberAction.failure):
    case getType(actions.assignLocationsToTeamMemberAction.success):
    case getType(actions.assignLocationsToTeamMemberAction.failure):
      return { ...state, isSaving: false };
      
    default:
      return state;
  }
};
