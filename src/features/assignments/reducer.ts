import { type ActionType, getType } from "typesafe-actions";
import * as actions from "./actions";
import { logoutRequestAction } from "../auth/actions";
import type { AssignmentsState } from "./types";
import { type Reducer } from "redux";

type Actions =
  | ActionType<typeof actions>
  | ActionType<typeof logoutRequestAction>;

const initialState: AssignmentsState = {
  selectedLocationId: null,
  selectedLocationFullAssignment: null,
  staffServices: [],
  isLoading: false,
  isSaving: false,
  isStaffServicesLoading: false,
};

export const AssignmentsReducer: Reducer<AssignmentsState, any> = (
  state: AssignmentsState = initialState,
  action: Actions,
): AssignmentsState => {
  switch (action.type) {
    // Reset state on logout to prevent stale data across accounts
    case getType(logoutRequestAction.success):
      return { ...initialState };

    // Location selection
    case getType(actions.selectLocationAction):
      return {
        ...state,
        selectedLocationId: action.payload,
        selectedLocationFullAssignment:
          action.payload === null ? null : state.selectedLocationFullAssignment,
        staffServices: action.payload === null ? [] : state.staffServices,
      };

    // Fetch full location assignment
    case getType(actions.fetchLocationFullAssignmentAction.request): {
      const payload = action.payload;
      const skipLoading =
        typeof payload === "object" && payload.skipLoading === true;
      return { ...state, isLoading: skipLoading ? false : true };
    }
    case getType(actions.fetchLocationFullAssignmentAction.success):
      return {
        ...state,
        selectedLocationFullAssignment: action.payload,
        isLoading: false,
      };
    case getType(actions.fetchLocationFullAssignmentAction.failure):
      return { ...state, isLoading: false };

    // Update location services
    case getType(actions.updateLocationServicesAction.request):
      return { ...state, isSaving: true };
    case getType(actions.updateLocationServicesAction.success):
    case getType(actions.updateLocationServicesAction.failure):
      return { ...state, isSaving: false };

    // Update location bundles
    case getType(actions.updateLocationBundlesAction.request):
      return { ...state, isSaving: true };
    case getType(actions.updateLocationBundlesAction.success):
    case getType(actions.updateLocationBundlesAction.failure):
      return { ...state, isSaving: false };

    // Fetch staff services at location
    case getType(actions.fetchStaffServicesAtLocationAction.request):
      return { ...state, isStaffServicesLoading: true, staffServices: [] };
    case getType(actions.fetchStaffServicesAtLocationAction.success):
      return {
        ...state,
        staffServices: action.payload.services,
        isStaffServicesLoading: false,
      };
    case getType(actions.fetchStaffServicesAtLocationAction.failure):
      return { ...state, isStaffServicesLoading: false };

    // Update staff services
    case getType(actions.updateStaffServicesAction.request):
      return { ...state, isSaving: true };
    case getType(actions.updateStaffServicesAction.success): {
      // Update team member stats locally to avoid re-fetching entire location data
      // (which would reset unsaved location service changes)
      const payload = action.payload;
      if (!state.selectedLocationFullAssignment) {
        return { ...state, isSaving: false };
      }

      const enabledCount = payload.services.filter((s) => s.canPerform).length;
      const overridesCount = payload.services.filter(
        (s) =>
          s.canPerform && (s.customPrice !== null || s.customDuration !== null),
      ).length;

      return {
        ...state,
        isSaving: false,
        selectedLocationFullAssignment: {
          ...state.selectedLocationFullAssignment,
          teamMembers: state.selectedLocationFullAssignment.teamMembers.map(
            (member) =>
              member.userId === payload.userId
                ? { ...member, servicesEnabled: enabledCount, overridesCount }
                : member,
          ),
        },
      };
    }
    case getType(actions.updateStaffServicesAction.failure):
      return { ...state, isSaving: false };

    // Unified update for location assignments
    case getType(actions.updateLocationAssignmentsAction.request):
      return { ...state, isSaving: true };
    case getType(actions.updateLocationAssignmentsAction.success):
    case getType(actions.updateLocationAssignmentsAction.failure):
      return { ...state, isSaving: false };

    // Update team members at location
    case getType(actions.updateLocationTeamMembersAction.request):
      return { ...state, isSaving: true };
    case getType(actions.updateLocationTeamMembersAction.success):
    case getType(actions.updateLocationTeamMembersAction.failure):
      return { ...state, isSaving: false };

    // Update team member stats without full refetch
    case getType(actions.updateTeamMemberStatsAction):
      if (!state.selectedLocationFullAssignment) {
        return state;
      }
      const { userId, servicesEnabled, overridesCount } = action.payload;
      const existingMember =
        state.selectedLocationFullAssignment.teamMembers.find(
          (m) => m.userId === userId,
        );

      if (existingMember) {
        // Update existing member stats
        return {
          ...state,
          selectedLocationFullAssignment: {
            ...state.selectedLocationFullAssignment,
            teamMembers: state.selectedLocationFullAssignment.teamMembers.map(
              (member) =>
                member.userId === userId
                  ? { ...member, servicesEnabled, overridesCount }
                  : member,
            ),
          },
        };
      } else {
        // Member not in teamMembers array yet - find them in allTeamMembers and add with stats
        const allMember =
          state.selectedLocationFullAssignment.allTeamMembers.find(
            (m) => m.userId === userId,
          );
        if (allMember) {
          return {
            ...state,
            selectedLocationFullAssignment: {
              ...state.selectedLocationFullAssignment,
              teamMembers: [
                ...state.selectedLocationFullAssignment.teamMembers,
                {
                  ...allMember,
                  servicesEnabled,
                  overridesCount,
                },
              ],
            },
          };
        }
      }
      return state;

    default:
      return state;
  }
};
