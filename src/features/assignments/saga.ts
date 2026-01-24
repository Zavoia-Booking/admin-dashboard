import { all, call, put, takeLatest, select } from "redux-saga/effects";
import {
  fetchLocationFullAssignmentAction,
  updateLocationServicesAction,
  updateLocationBundlesAction,
  fetchStaffServicesAtLocationAction,
  updateStaffServicesAction,
  updateLocationTeamMembersAction,
  updateLocationAssignmentsAction,
} from "./actions";
import {
  fetchLocationFullAssignmentRequest,
  updateLocationServicesRequest,
  updateLocationBundlesRequest,
  fetchStaffServicesAtLocationRequest,
  updateStaffServicesRequest,
  updateLocationTeamMembersRequest,
  updateLocationAssignmentsRequest,
} from "./api";
import type { LocationFullAssignment, StaffServicesAtLocation } from "./types";
import { toast } from "sonner";
import i18n from "../../shared/lib/i18n";

function* handleFetchLocationFullAssignment(
  action: ReturnType<typeof fetchLocationFullAssignmentAction.request>,
) {
  try {
    const locationId =
      typeof action.payload === "number"
        ? action.payload
        : action.payload.locationId;
    const data: LocationFullAssignment = yield call(
      fetchLocationFullAssignmentRequest,
      locationId,
    );
    yield put(fetchLocationFullAssignmentAction.success(data));
  } catch (error: any) {
    yield put(
      fetchLocationFullAssignmentAction.failure({
        message: error?.message || "Failed to fetch location data",
      }),
    );
    toast.error(i18n.t("assignments:page.toasts.failedToLoadLocationData"));
  }
}

function* handleUpdateLocationServices(
  action: ReturnType<typeof updateLocationServicesAction.request>,
) {
  try {
    yield call(updateLocationServicesRequest, action.payload);
    yield put(updateLocationServicesAction.success());

    // Refresh the location's full assignment data
    yield put(
      fetchLocationFullAssignmentAction.request({
        locationId: action.payload.locationId,
      }),
    );

    toast.success(i18n.t("assignments:page.toasts.locationServicesUpdated"));
  } catch (error: any) {
    yield put(
      updateLocationServicesAction.failure({
        message: error?.message || "Failed to update location services",
      }),
    );
    toast.error(
      i18n.t("assignments:page.toasts.failedToUpdateLocationServices"),
    );
  }
}

function* handleUpdateLocationBundles(
  action: ReturnType<typeof updateLocationBundlesAction.request>,
) {
  try {
    yield call(updateLocationBundlesRequest, action.payload);
    yield put(updateLocationBundlesAction.success());

    // Refresh the location's full assignment data
    yield put(
      fetchLocationFullAssignmentAction.request({
        locationId: action.payload.locationId,
      }),
    );

    toast.success(i18n.t("assignments:page.toasts.locationBundlesUpdated"));
  } catch (error: any) {
    yield put(
      updateLocationBundlesAction.failure({
        message: error?.message || "Failed to update location bundles",
      }),
    );
    toast.error(
      i18n.t("assignments:page.toasts.failedToUpdateLocationBundles"),
    );
  }
}

function* handleFetchStaffServicesAtLocation(
  action: ReturnType<typeof fetchStaffServicesAtLocationAction.request>,
) {
  const { locationId, userId } = action.payload;
  try {
    const data: StaffServicesAtLocation = yield call(
      fetchStaffServicesAtLocationRequest,
      locationId,
      userId,
    );
    yield put(fetchStaffServicesAtLocationAction.success(data));
  } catch (error: any) {
    yield put(
      fetchStaffServicesAtLocationAction.failure({
        message: error?.message || "Failed to fetch staff services",
      }),
    );
    toast.error(i18n.t("assignments:page.toasts.failedToLoadStaffServices"));
  }
}

function* handleUpdateStaffServices(
  action: ReturnType<typeof updateStaffServicesAction.request>,
) {
  try {
    yield call(updateStaffServicesRequest, action.payload);
    yield put(updateStaffServicesAction.success(action.payload));

    // Refresh the location's full assignment data to get updated team member stats and service assignments
    yield put(
      fetchLocationFullAssignmentAction.request({
        locationId: action.payload.locationId,
      }),
    );

    toast.success(i18n.t("assignments:page.toasts.staffServicesUpdated"));
  } catch (error: any) {
    yield put(
      updateStaffServicesAction.failure({
        message: error?.message || "Failed to update staff services",
      }),
    );
    toast.error(i18n.t("assignments:page.toasts.failedToUpdateStaffServices"));
  }
}

function* handleUpdateLocationAssignments(
  action: ReturnType<typeof updateLocationAssignmentsAction.request>,
): Generator<any, void, any> {
  try {
    yield call(updateLocationAssignmentsRequest, action.payload);
    yield put(updateLocationAssignmentsAction.success());

    // Only refetch if services were updated (team member toggles update optimistically, no refetch needed)
    // This prevents skeleton/scroll issues when just toggling team members
    if (action.payload.services !== undefined) {
      // Refresh the location's full assignment data to get updated services
      yield put(
        fetchLocationFullAssignmentAction.request({
          locationId: action.payload.locationId,
        }),
      );
      toast.success(i18n.t("assignments:page.toasts.locationServicesUpdated"));
    } else if (action.payload.userIds !== undefined) {
      // Team members were toggled - refetch full location data to get updated data
      // Skip loading state to prevent skeleton from showing
      yield put(
        fetchLocationFullAssignmentAction.request({
          locationId: action.payload.locationId,
          skipLoading: true,
        }),
      );

      // Show personalized toast message for team member toggle
      if (action.payload.teamMemberToggle) {
        const state: any = yield select((state: any) => state.assignments);
        const location = state.selectedLocationFullAssignment;
        const { userId, enabled } = action.payload.teamMemberToggle;

        // Find team member name from allTeamMembers or teamMembers
        const member =
          location?.allTeamMembers?.find((m: any) => m.userId === userId) ||
          location?.teamMembers?.find((m: any) => m.userId === userId);

        const memberName = member
          ? `${member.firstName} ${member.lastName}`
          : i18n.t("assignments:page.locationTeamMembers.stats.member");

        if (enabled) {
          toast.success(
            i18n.t("assignments:page.toasts.teamMemberAssigned", {
              memberName,
            }),
          );
        } else {
          toast.success(
            i18n.t("assignments:page.toasts.teamMemberRemoved", { memberName }),
          );
        }
      } else {
        toast.success(i18n.t("assignments:page.toasts.teamMembersUpdated"));
      }
    } else {
      toast.success(
        i18n.t("assignments:page.toasts.locationAssignmentsUpdated"),
      );
    }
  } catch (error: any) {
    yield put(
      updateLocationAssignmentsAction.failure({
        message: error?.message || "Failed to update location assignments",
      }),
    );

    // Show personalized error message for team member toggle
    if (action.payload.teamMemberToggle) {
      const state: any = yield select((state: any) => state.assignments);
      const location = state.selectedLocationFullAssignment;
      const toggleInfo = action.payload.teamMemberToggle;
      const { userId, enabled } = toggleInfo;

      const member =
        location?.allTeamMembers?.find((m: any) => m.userId === userId) ||
        location?.teamMembers?.find((m: any) => m.userId === userId);

      const memberName = member
        ? `${member.firstName} ${member.lastName}`
        : i18n.t("assignments:page.locationTeamMembers.stats.member");

      if (enabled) {
        toast.error(
          i18n.t("assignments:page.toasts.teamMemberAssignFailed", {
            memberName,
          }),
        );
      } else {
        toast.error(
          i18n.t("assignments:page.toasts.teamMemberRemoveFailed", {
            memberName,
          }),
        );
      }
    } else {
      toast.error(
        i18n.t("assignments:page.toasts.failedToUpdateLocationAssignments"),
      );
    }
  }
}

function* handleUpdateLocationTeamMembers(
  action: ReturnType<typeof updateLocationTeamMembersAction.request>,
) {
  try {
    yield call(updateLocationTeamMembersRequest, action.payload);
    yield put(updateLocationTeamMembersAction.success());

    // Refresh the location's full assignment data to get updated team members
    yield put(
      fetchLocationFullAssignmentAction.request({
        locationId: action.payload.locationId,
      }),
    );

    toast.success(i18n.t("assignments:page.toasts.teamMembersUpdated"));
  } catch (error: any) {
    yield put(
      updateLocationTeamMembersAction.failure({
        message: error?.message || "Failed to update team members",
      }),
    );
    toast.error(i18n.t("assignments:page.toasts.failedToUpdateTeamMembers"));
  }
}

export function* assignmentsSaga() {
  yield all([
    takeLatest(
      fetchLocationFullAssignmentAction.request,
      handleFetchLocationFullAssignment,
    ),
    takeLatest(
      updateLocationServicesAction.request,
      handleUpdateLocationServices,
    ),
    takeLatest(
      updateLocationBundlesAction.request,
      handleUpdateLocationBundles,
    ),
    takeLatest(
      fetchStaffServicesAtLocationAction.request,
      handleFetchStaffServicesAtLocation,
    ),
    takeLatest(updateStaffServicesAction.request, handleUpdateStaffServices),
    takeLatest(
      updateLocationAssignmentsAction.request,
      handleUpdateLocationAssignments,
    ),
    takeLatest(
      updateLocationTeamMembersAction.request,
      handleUpdateLocationTeamMembers,
    ),
  ]);
}
