import { all, call, put, takeLatest } from "redux-saga/effects";
import {
  fetchTeamMemberAssignmentsAction,
  fetchTeamMemberAssignmentByIdAction,
  assignServicesToTeamMemberAction,
  assignLocationsToTeamMemberAction,
  fetchServiceAssignmentByIdAction,
  assignTeamMembersToServiceAction,
  assignLocationsToServiceAction,
} from "./actions";
import {
  fetchTeamMemberAssignmentsRequest,
  fetchTeamMemberAssignmentByIdRequest,
  assignServicesToTeamMemberRequest,
  assignLocationsToTeamMemberRequest,
  fetchServiceAssignmentByIdRequest,
  assignTeamMembersToServiceRequest,
  assignLocationsToServiceRequest,
} from "./api";
import { type TeamMemberAssignment, type ServiceAssignment } from "./types";
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
    yield put(getServicesAction.request({ reset: true }));
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
    yield put(getServicesAction.request({ reset: true }));
    toast.success('Locations assigned successfully');
  } catch (error: any) {
    yield put(assignLocationsToServiceAction.failure({ message: error?.message || 'Failed to assign locations' }));
    toast.error('Failed to assign locations');
  }
}

export function* assignmentsSaga() {
  yield all([
    // Team Members
    takeLatest(fetchTeamMemberAssignmentsAction.request, handleFetchTeamMemberAssignments),
    takeLatest(fetchTeamMemberAssignmentByIdAction.request, handleFetchTeamMemberAssignmentById),
    takeLatest(assignServicesToTeamMemberAction.request, handleAssignServicesToTeamMember),
    takeLatest(assignLocationsToTeamMemberAction.request, handleAssignLocationsToTeamMember),
    // Services
    takeLatest(fetchServiceAssignmentByIdAction.request, handleFetchServiceAssignmentById),
    takeLatest(assignTeamMembersToServiceAction.request, handleAssignTeamMembersToService),
    takeLatest(assignLocationsToServiceAction.request, handleAssignLocationsToService),
  ]);
}
