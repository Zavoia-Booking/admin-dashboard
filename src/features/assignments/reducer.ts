import { type ActionType, getType } from "typesafe-actions";
import * as actions from "./actions";
import type { AssignmentsState, AssignmentFilterState, AssignmentGroup, AssignmentItem } from "./types";
import { getDefaultAssignmentFilters } from "./types";
import { type Reducer } from "redux";

type Actions = ActionType<typeof actions>;

const initialState: AssignmentsState = {
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
    default:
      return state;
  }
}


