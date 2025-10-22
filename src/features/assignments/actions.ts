import { createAsyncAction, createAction } from "typesafe-actions";
import type { AssignmentFilterState, AssignmentGroup, AssignmentItem, AssignmentRequestPayload } from "./types";

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