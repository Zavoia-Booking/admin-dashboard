import { all, call, put, select, takeLatest } from "redux-saga/effects";
import {
  listAssignmentsAction,
  setAssignmentFiltersAction,
  createAssignmentAction,
  viewAssignmentDetailsAction,
  deleteAssignmentAction,
  closeViewDetailsFormAction,
  editAssignmentAction,
  fetchTeamMemberAssignmentsAction,
  fetchServiceAssignmentsAction,
  fetchLocationAssignmentsAction,
  assignServicesToTeamMemberAction,
  assignLocationsToTeamMemberAction,
  assignTeamMembersToServiceAction,
  assignLocationsToServiceAction,
  assignTeamMembersToLocationAction,
  assignServicesToLocationAction,
  bulkAssignAction,
  setPerspectiveAction,
} from "./actions";
import {
  createAssignmentRequest,
  deleteAssignmentRequest,
  editAssignmentRequest,
  getAssignmentsByIdRequest,
  listAssignmentsRequest,
  fetchTeamMemberAssignmentsRequest,
  fetchServiceAssignmentsRequest,
  fetchLocationAssignmentsRequest,
  assignServicesToTeamMemberRequest,
  assignLocationsToTeamMemberRequest,
  assignTeamMembersToServiceRequest,
  assignLocationsToServiceRequest,
  assignTeamMembersToLocationRequest,
  assignServicesToLocationRequest,
  bulkAssignRequest,
} from "./api";
import { getAssignmentsFiltersSelector } from "./selectors";
import { type AssignmentFilterState, mapAssignmentFiltersToGeneric, type LocationAssignment, type ServiceAssignment, type TeamMemberAssignment } from "./types";
import { toast } from "sonner";

// Legacy saga handlers
function* handleListAssignments() {
  const filters: AssignmentFilterState = yield select(getAssignmentsFiltersSelector);
  const mapped = mapAssignmentFiltersToGeneric(filters);
  try {
    const response: {assignments: Array<any>} = yield call(listAssignmentsRequest, mapped);
    yield put(listAssignmentsAction.success(response.assignments));
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
    toast.success('Assignment created successfully');
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
    yield put(closeViewDetailsFormAction());
    yield put(listAssignmentsAction.request());
    toast.success('Deleted assignment successfully');
  } catch {
    toast.error('Failed to delete assignment');
  }
}

function* handleEditAssignment(action: ReturnType<typeof editAssignmentAction.request>) {
  try {
    yield call(editAssignmentRequest, action.payload);
    yield put(viewAssignmentDetailsAction.request({ serviceId: action.payload.serviceId }));
    toast.success('Edited assignment successfully');
  } catch {
    toast.error('Failed to edit assignment');
  }
}

// New perspective-based saga handlers

// Team Members perspective
function* handleFetchTeamMemberAssignments() {
  try {
    const data: { teamMembers: TeamMemberAssignment[] } = yield call(fetchTeamMemberAssignmentsRequest);
    yield put(fetchTeamMemberAssignmentsAction.success(data.teamMembers));
  } catch (error: any) {
    yield put(fetchTeamMemberAssignmentsAction.failure({ message: error?.message || 'Failed to fetch team member assignments' }));
    toast.error('Failed to load team members');
  }
}

function* handleAssignServicesToTeamMember(action: ReturnType<typeof assignServicesToTeamMemberAction.request>) {
  try {
    const { userId, serviceIds } = action.payload;
    yield call(assignServicesToTeamMemberRequest, userId, serviceIds);
    yield put(assignServicesToTeamMemberAction.success());
    yield put(fetchTeamMemberAssignmentsAction.request());
    toast.success('Services assigned successfully');
  } catch (error: any) {
    yield put(assignServicesToTeamMemberAction.failure({ message: error?.message || 'Failed to assign services' }));
    toast.error('Failed to assign services');
  }
}

function* handleAssignLocationsToTeamMember(action: ReturnType<typeof assignLocationsToTeamMemberAction.request>) {
  try {
    const { userId, locationIds } = action.payload;
    yield call(assignLocationsToTeamMemberRequest, userId, locationIds);
    yield put(assignLocationsToTeamMemberAction.success());
    yield put(fetchTeamMemberAssignmentsAction.request());
    toast.success('Locations assigned successfully');
  } catch (error: any) {
    yield put(assignLocationsToTeamMemberAction.failure({ message: error?.message || 'Failed to assign locations' }));
    toast.error('Failed to assign locations');
  }
}

// Services perspective
function* handleFetchServiceAssignments() {
  try {
    const data: { services: ServiceAssignment[] } = yield call(fetchServiceAssignmentsRequest);
    yield put(fetchServiceAssignmentsAction.success(data.services));
  } catch (error: any) {
    yield put(fetchServiceAssignmentsAction.failure({ message: error?.message || 'Failed to fetch service assignments' }));
    toast.error('Failed to load services');
  }
}

function* handleAssignTeamMembersToService(action: ReturnType<typeof assignTeamMembersToServiceAction.request>) {
  try {
    const { serviceId, userIds } = action.payload;
    yield call(assignTeamMembersToServiceRequest, serviceId, userIds);
    yield put(assignTeamMembersToServiceAction.success());
    yield put(fetchServiceAssignmentsAction.request());
    toast.success('Team members assigned successfully');
  } catch (error: any) {
    yield put(assignTeamMembersToServiceAction.failure({ message: error?.message || 'Failed to assign team members' }));
    toast.error('Failed to assign team members');
  }
}

function* handleAssignLocationsToService(action: ReturnType<typeof assignLocationsToServiceAction.request>) {
  try {
    const { serviceId, locationIds } = action.payload;
    yield call(assignLocationsToServiceRequest, serviceId, locationIds);
    yield put(assignLocationsToServiceAction.success());
    yield put(fetchServiceAssignmentsAction.request());
    toast.success('Locations assigned successfully');
  } catch (error: any) {
    yield put(assignLocationsToServiceAction.failure({ message: error?.message || 'Failed to assign locations' }));
    toast.error('Failed to assign locations');
  }
}

// Locations perspective
function* handleFetchLocationAssignments() {
  try {
    const data: { locations: LocationAssignment[] } = yield call(fetchLocationAssignmentsRequest);
    yield put(fetchLocationAssignmentsAction.success(data.locations));
  } catch (error: any) {
    yield put(fetchLocationAssignmentsAction.failure({ message: error?.message || 'Failed to fetch location assignments' }));
    toast.error('Failed to load locations');
  }
}

function* handleAssignTeamMembersToLocation(action: ReturnType<typeof assignTeamMembersToLocationAction.request>) {
  try {
    const { locationId, userIds } = action.payload;
    yield call(assignTeamMembersToLocationRequest, locationId, userIds);
    yield put(assignTeamMembersToLocationAction.success());
    yield put(fetchLocationAssignmentsAction.request());
    toast.success('Team members assigned successfully');
  } catch (error: any) {
    yield put(assignTeamMembersToLocationAction.failure({ message: error?.message || 'Failed to assign team members' }));
    toast.error('Failed to assign team members');
  }
}

function* handleAssignServicesToLocation(action: ReturnType<typeof assignServicesToLocationAction.request>) {
  try {
    const { locationId, serviceIds } = action.payload;
    yield call(assignServicesToLocationRequest, locationId, serviceIds);
    yield put(assignServicesToLocationAction.success());
    yield put(fetchLocationAssignmentsAction.request());
    toast.success('Services assigned successfully');
  } catch (error: any) {
    yield put(assignServicesToLocationAction.failure({ message: error?.message || 'Failed to assign services' }));
    toast.error('Failed to assign services');
  }
}

// Bulk operations
function* handleBulkAssign(action: ReturnType<typeof bulkAssignAction.request>) {
  try {
    yield call(bulkAssignRequest, action.payload);
    yield put(bulkAssignAction.success());
    
    // Refresh the appropriate perspective data
    const { type } = action.payload;
    if (type.includes('team_member')) {
      yield put(fetchTeamMemberAssignmentsAction.request());
    } else if (type.includes('service')) {
      yield put(fetchServiceAssignmentsAction.request());
    } else if (type.includes('location')) {
      yield put(fetchLocationAssignmentsAction.request());
    }
    
    toast.success('Bulk assignment completed successfully');
  } catch (error: any) {
    yield put(bulkAssignAction.failure({ message: error?.message || 'Failed to perform bulk assignment' }));
    toast.error('Failed to perform bulk assignment');
  }
}

// When perspective changes, fetch the appropriate data
function* handleSetPerspective(action: ReturnType<typeof setPerspectiveAction>) {
  const perspective = action.payload;
  
  switch (perspective) {
    case 'team_members':
      yield put(fetchTeamMemberAssignmentsAction.request());
      break;
    case 'services':
      yield put(fetchServiceAssignmentsAction.request());
      break;
    case 'locations':
      yield put(fetchLocationAssignmentsAction.request());
      break;
  }
}

export function* assignmentsSaga() {
  yield all([
    // Legacy sagas
    takeLatest(listAssignmentsAction.request, handleListAssignments),
    takeLatest(setAssignmentFiltersAction.request, handleSetAssignmentFilters),
    takeLatest(createAssignmentAction.request, handleCreateAssignment),
    takeLatest(viewAssignmentDetailsAction.request, handleViewAssignmentDetails),
    takeLatest(deleteAssignmentAction.request, handleDeleteAssignment),
    takeLatest(editAssignmentAction.request, handleEditAssignment),
    
    // New perspective-based sagas
    takeLatest(setPerspectiveAction, handleSetPerspective),
    
    // Team Members
    takeLatest(fetchTeamMemberAssignmentsAction.request, handleFetchTeamMemberAssignments),
    takeLatest(assignServicesToTeamMemberAction.request, handleAssignServicesToTeamMember),
    takeLatest(assignLocationsToTeamMemberAction.request, handleAssignLocationsToTeamMember),
    
    // Services
    takeLatest(fetchServiceAssignmentsAction.request, handleFetchServiceAssignments),
    takeLatest(assignTeamMembersToServiceAction.request, handleAssignTeamMembersToService),
    takeLatest(assignLocationsToServiceAction.request, handleAssignLocationsToService),
    
    // Locations
    takeLatest(fetchLocationAssignmentsAction.request, handleFetchLocationAssignments),
    takeLatest(assignTeamMembersToLocationAction.request, handleAssignTeamMembersToLocation),
    takeLatest(assignServicesToLocationAction.request, handleAssignServicesToLocation),
    
    // Bulk
    takeLatest(bulkAssignAction.request, handleBulkAssign),
  ]);
}
