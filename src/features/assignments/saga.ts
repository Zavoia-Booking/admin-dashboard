import { all, call, put, select, takeLatest } from "redux-saga/effects";
import {
  listAssignmentsAction,
  setAssignmentFiltersAction,
  createAssignmentAction,
  viewAssignmentDetailsAction,
  deleteAssignmentAction,
  closeViewDetailsFormAction,
  editAssignmentAction,
} from "./actions";
import {
  createAssignmentRequest,
  deleteAssignmentRequest,
  editAssignmentRequest,
  getAssignmentsByIdRequest,
  listAssignmentsRequest
} from "./api";
import { getAssignmentsFiltersSelector } from "./selectors";
import { type AssignmentFilterState, mapAssignmentFiltersToGeneric } from "./types";
import { toast } from "sonner";

function* handleListAssignments() {
  const filters: AssignmentFilterState = yield select(getAssignmentsFiltersSelector);
  const mapped = mapAssignmentFiltersToGeneric(filters);
  try {
    const response: {assignments: Array<any>} = yield call(listAssignmentsRequest, mapped);
    yield put(listAssignmentsAction.success(response. assignments));
  } catch (error: any) {
    yield put(listAssignmentsAction.failure({ message: error?.message || 'Failed to fetch assignments' }));
  }
}

function* handleSetAssignmentFilters(action: ReturnType<typeof setAssignmentFiltersAction.request>) {
  yield put(setAssignmentFiltersAction.success(action.payload));
  yield put(listAssignmentsAction.request());
}

function* handleCreateAssignment(action: ReturnType<typeof createAssignmentAction.request>) {

  try {
    yield call(createAssignmentRequest, action.payload);
    toast.success('Assignment created successfully')
    yield put(listAssignmentsAction.request());
  } catch (error: any) {
    yield put(createAssignmentAction.failure({ message: error?.message || 'Failed to create assignment' }));
  }
}

function* handleViewAssignmentDetails(action: ReturnType<typeof viewAssignmentDetailsAction.request>) {

  const { serviceId } = action.payload;

  try {
    const response:{serviceId:number, assignments: Array<any>}  = yield call(getAssignmentsByIdRequest, serviceId);
    yield put(viewAssignmentDetailsAction.success(response.assignments));
  } catch (error: any) {
    yield put(viewAssignmentDetailsAction.failure({ message: error?.message || 'Failed to load assignment details' }));
  }
}

function* handleDeleteAssignment(action: ReturnType<typeof deleteAssignmentAction.request>) {

  const { serviceId, userId } = action.payload;

  try {
    yield call(deleteAssignmentRequest, serviceId, userId);
    yield put(closeViewDetailsFormAction())
    yield put(listAssignmentsAction.request())
    toast.success('Deleted assignment successfully')
  } catch {
    toast.success('Failed to delete successfully')
  }
}

function* handleEditAssignment(action: ReturnType<typeof editAssignmentAction.request>) {
  try {
    yield call(editAssignmentRequest, action.payload);
    
    yield put(viewAssignmentDetailsAction.request({ serviceId: action.payload.serviceId }));
    toast.success('Edited assignment successfully')
  } catch {
    toast.success('Failed to edit assignment')
  }
}


export function* assignmentsSaga() {
  yield all([
    takeLatest(listAssignmentsAction.request, handleListAssignments),
    takeLatest(setAssignmentFiltersAction.request, handleSetAssignmentFilters),
    takeLatest(createAssignmentAction.request, handleCreateAssignment),
    takeLatest(viewAssignmentDetailsAction.request, handleViewAssignmentDetails),
    takeLatest(deleteAssignmentAction.request, handleDeleteAssignment),
    takeLatest(editAssignmentAction.request, handleEditAssignment),
  ]);
}


