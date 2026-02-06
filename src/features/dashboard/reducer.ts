import { getType } from "typesafe-actions";
import { fetchDashboardDataAction, type DashboardApiResponse } from "./actions";
import { logoutRequestAction } from "../auth/actions";

type DashboardState = {
  data: DashboardApiResponse | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: DashboardState = {
  data: null,
  isLoading: false,
  error: null,
};

export default function dashboardReducer(state: DashboardState = initialState, action: any): DashboardState {
  switch (action.type) {
    // Reset state on logout to prevent stale data across accounts
    case getType(logoutRequestAction.success):
      return { ...initialState };

    case getType(fetchDashboardDataAction.request):
      return { ...state, isLoading: true, error: null };

    case getType(fetchDashboardDataAction.success):
      return { ...state, isLoading: false, data: action.payload, error: null };

    case getType(fetchDashboardDataAction.failure):
      return { ...state, isLoading: false, error: action.payload.message };

    default:
      return state;
  }
}
