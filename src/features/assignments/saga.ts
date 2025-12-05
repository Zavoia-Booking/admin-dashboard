import { all, call, put, takeLatest } from "redux-saga/effects";
import {
  fetchTeamMemberAssignmentsAction,
  fetchTeamMemberAssignmentByIdAction,
  assignServicesToTeamMemberAction,
  assignLocationsToTeamMemberAction,
  updateTeamMemberAssignmentsAction,
  fetchServiceAssignmentByIdAction,
  assignTeamMembersToServiceAction,
  assignLocationsToServiceAction,
  updateServiceAssignmentsAction,
  fetchLocationAssignmentByIdAction,
  assignTeamMembersToLocationAction,
  assignServicesToLocationAction,
  updateLocationAssignmentsAction,
} from "./actions";
import {
  fetchTeamMemberAssignmentsRequest,
  fetchTeamMemberAssignmentByIdRequest,
  assignServicesToTeamMemberRequest,
  assignLocationsToTeamMemberRequest,
  updateTeamMemberAssignmentsRequest,
  fetchServiceAssignmentByIdRequest,
  assignTeamMembersToServiceRequest,
  assignLocationsToServiceRequest,
  updateServiceAssignmentsRequest,
  fetchLocationAssignmentByIdRequest,
  assignTeamMembersToLocationRequest,
  assignServicesToLocationRequest,
  updateLocationAssignmentsRequest,
} from "./api";
import { type TeamMemberAssignment, type ServiceAssignment, type LocationAssignment } from "./types";
import { toast } from "sonner";
import { getServicesAction } from "../services/actions";

// Team Members perspective
function* handleFetchTeamMemberAssignments() {
  try {
    const data: TeamMemberAssignment[] = yield call(fetchTeamMemberAssignmentsRequest);
    yield put(fetchTeamMemberAssignmentsAction.success(data));
  } catch (error: any) {
    yield put(fetchTeamMemberAssignmentsAction.failure({ message: error?.message || 'Failed to fetch team member assignments' }));
    toast.error('Failed to load team members');
  }
}

function* handleFetchTeamMemberAssignmentById(action: ReturnType<typeof fetchTeamMemberAssignmentByIdAction.request>) {
  try {
    const data: TeamMemberAssignment = yield call(fetchTeamMemberAssignmentByIdRequest, action.payload);
    yield put(fetchTeamMemberAssignmentByIdAction.success(data));
  } catch (error: any) {
    yield put(fetchTeamMemberAssignmentByIdAction.failure({ message: error?.message || 'Failed to fetch team member assignment' }));
    toast.error('Failed to load team member assignment');
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

function* handleUpdateTeamMemberAssignments(action: ReturnType<typeof updateTeamMemberAssignmentsAction.request>) {
  try {
    const { userId, serviceIds, locationIds } = action.payload;
    yield call(updateTeamMemberAssignmentsRequest, userId, serviceIds, locationIds);
    yield put(updateTeamMemberAssignmentsAction.success());
    
    // Refresh the team member's assignment details
    yield put(fetchTeamMemberAssignmentByIdAction.request(userId));
    
    toast.success('Assignments updated successfully');
  } catch (error: any) {
    yield put(updateTeamMemberAssignmentsAction.failure({ message: error?.message || 'Failed to update assignments' }));
    toast.error('Failed to update assignments');
  }
}

// Services perspective
function* handleFetchServiceAssignmentById(action: ReturnType<typeof fetchServiceAssignmentByIdAction.request>) {
  try {
    const data: ServiceAssignment = yield call(fetchServiceAssignmentByIdRequest, action.payload);
    yield put(fetchServiceAssignmentByIdAction.success(data));
  } catch (error: any) {
    yield put(fetchServiceAssignmentByIdAction.failure({ message: error?.message || 'Failed to fetch service assignment' }));
    toast.error('Failed to load service assignment');
  }
}

function* handleAssignTeamMembersToService(action: ReturnType<typeof assignTeamMembersToServiceAction.request>) {
  try {
    const { serviceId, userIds } = action.payload;
    yield call(assignTeamMembersToServiceRequest, serviceId, userIds);
    yield put(assignTeamMembersToServiceAction.success());
    yield put(getServicesAction.request());
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
    yield put(getServicesAction.request());
    toast.success('Locations assigned successfully');
  } catch (error: any) {
    yield put(assignLocationsToServiceAction.failure({ message: error?.message || 'Failed to assign locations' }));
    toast.error('Failed to assign locations');
  }
}

function* handleUpdateServiceAssignments(action: ReturnType<typeof updateServiceAssignmentsAction.request>) {
  try {
    const { serviceId, teamMemberIds, locationIds } = action.payload;
    yield call(updateServiceAssignmentsRequest, serviceId, teamMemberIds, locationIds);
    yield put(updateServiceAssignmentsAction.success());
    
    // Refresh the service's assignment details
    yield put(fetchServiceAssignmentByIdAction.request(serviceId));
    
    toast.success('Assignments updated successfully');
  } catch (error: any) {
    yield put(updateServiceAssignmentsAction.failure({ message: error?.message || 'Failed to update assignments' }));
    toast.error('Failed to update assignments');
  }
}

// Locations perspective
function* handleFetchLocationAssignmentById(action: ReturnType<typeof fetchLocationAssignmentByIdAction.request>) {
  try {
    const data: LocationAssignment = yield call(fetchLocationAssignmentByIdRequest, action.payload);
    yield put(fetchLocationAssignmentByIdAction.success(data));
  } catch (error: any) {
    yield put(fetchLocationAssignmentByIdAction.failure({ message: error?.message || 'Failed to fetch location assignment' }));
    toast.error('Failed to load location assignment');
  }
}

function* handleAssignTeamMembersToLocation(action: ReturnType<typeof assignTeamMembersToLocationAction.request>) {
  try {
    const { locationId, userIds } = action.payload;
    yield call(assignTeamMembersToLocationRequest, locationId, userIds);
    yield put(assignTeamMembersToLocationAction.success());
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
    toast.success('Services assigned successfully');
  } catch (error: any) {
    yield put(assignServicesToLocationAction.failure({ message: error?.message || 'Failed to assign services' }));
    toast.error('Failed to assign services');
  }
}

function* handleUpdateLocationAssignments(action: ReturnType<typeof updateLocationAssignmentsAction.request>) {
  try {
    const { locationId, teamMemberIds, serviceIds } = action.payload;
    yield call(updateLocationAssignmentsRequest, locationId, teamMemberIds, serviceIds);
    yield put(updateLocationAssignmentsAction.success());
    
    // Refresh the location's assignment details
    yield put(fetchLocationAssignmentByIdAction.request(locationId));
    
    toast.success('Assignments updated successfully');
  } catch (error: any) {
    yield put(updateLocationAssignmentsAction.failure({ message: error?.message || 'Failed to update assignments' }));
    toast.error('Failed to update assignments');
  }
}

export function* assignmentsSaga() {
  yield all([
    // Team Members
    takeLatest(fetchTeamMemberAssignmentsAction.request, handleFetchTeamMemberAssignments),
    takeLatest(fetchTeamMemberAssignmentByIdAction.request, handleFetchTeamMemberAssignmentById),
    takeLatest(assignServicesToTeamMemberAction.request, handleAssignServicesToTeamMember),
    takeLatest(assignLocationsToTeamMemberAction.request, handleAssignLocationsToTeamMember),
    takeLatest(updateTeamMemberAssignmentsAction.request, handleUpdateTeamMemberAssignments),
    // Services
    takeLatest(fetchServiceAssignmentByIdAction.request, handleFetchServiceAssignmentById),
    takeLatest(assignTeamMembersToServiceAction.request, handleAssignTeamMembersToService),
    takeLatest(assignLocationsToServiceAction.request, handleAssignLocationsToService),
    takeLatest(updateServiceAssignmentsAction.request, handleUpdateServiceAssignments),
    // Locations
    takeLatest(fetchLocationAssignmentByIdAction.request, handleFetchLocationAssignmentById),
    takeLatest(assignTeamMembersToLocationAction.request, handleAssignTeamMembersToLocation),
    takeLatest(assignServicesToLocationAction.request, handleAssignServicesToLocation),
    takeLatest(updateLocationAssignmentsAction.request, handleUpdateLocationAssignments),
  ]);
}
