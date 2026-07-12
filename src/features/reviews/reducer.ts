import * as actions from "./actions";
import type { ReviewsState } from "./types";
import { getType, type ActionType } from "typesafe-actions";
import type { Reducer } from "redux";
import {
  hydrateSessionAction,
  logoutRequestAction,
  selectBusinessAction,
  setAuthUserAction,
} from "../auth/actions";

type Actions =
  | ActionType<typeof actions>
  | ActionType<typeof hydrateSessionAction>
  | ActionType<typeof logoutRequestAction>
  | ActionType<typeof selectBusinessAction>
  | ActionType<typeof setAuthUserAction>;

const initialState: ReviewsState = {
  scopeBusinessId: null,
  stats: null,
  statsLoading: false,
  businessReviews: [],
  businessReviewsTotal: 0,
  businessReviewsLoading: false,
  businessReviewsMoreLoading: false,
  teamMemberReviews: [],
  teamMemberReviewsTotal: 0,
  teamMemberReviewsLoading: false,
  teamMemberReviewsMoreLoading: false,
  highlightReviews: [],
  highlightReviewsLoading: false,
  error: null,
};

function normalizeScopeBusinessId(value: number | string | null | undefined): string | null {
  return value === null || value === undefined ? null : String(value);
}

function resetForScope(state: ReviewsState, scopeBusinessId: string | null): ReviewsState {
  return state.scopeBusinessId === scopeBusinessId
    ? state
    : { ...initialState, scopeBusinessId };
}

export const ReviewsReducer: Reducer<ReviewsState, any> = (
  state: ReviewsState = initialState,
  action: Actions,
) => {
  switch (action.type) {
    case getType(setAuthUserAction):
      return resetForScope(state, normalizeScopeBusinessId(action.payload.user?.businessId));

    case getType(hydrateSessionAction.success):
      return resetForScope(
        state,
        normalizeScopeBusinessId(action.payload.businessId ?? action.payload.user?.businessId),
      );

    case getType(selectBusinessAction.success):
      return resetForScope(state, normalizeScopeBusinessId(action.payload.user?.businessId));

    case getType(logoutRequestAction.success):
      return initialState;

    // Stats
    case getType(actions.fetchReviewStatsAction.request):
      return { ...state, statsLoading: true, error: null };
    case getType(actions.fetchReviewStatsAction.success):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return { ...state, statsLoading: false, stats: action.payload };
    case getType(actions.fetchReviewStatsAction.failure):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return { ...state, statsLoading: false, error: action.payload.message };

    // Business reviews (replace)
    case getType(actions.fetchBusinessReviewsAction.request):
      return { ...state, businessReviewsLoading: true, error: null };
    case getType(actions.fetchBusinessReviewsAction.success):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return {
        ...state,
        businessReviewsLoading: false,
        businessReviews: action.payload.data,
        businessReviewsTotal: action.payload.pagination.total,
      };
    case getType(actions.fetchBusinessReviewsAction.failure):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return {
        ...state,
        businessReviewsLoading: false,
        error: action.payload.message,
      };

    // Business reviews (append for "load more") — uses *MoreLoading so the
    // list skeleton doesn't flash over rows the user just expanded.
    case getType(actions.fetchMoreBusinessReviewsAction.request):
      return { ...state, businessReviewsMoreLoading: true, error: null };
    case getType(actions.fetchMoreBusinessReviewsAction.success):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return {
        ...state,
        businessReviewsMoreLoading: false,
        businessReviews: [...state.businessReviews, ...action.payload.data],
        businessReviewsTotal: action.payload.pagination.total,
      };
    case getType(actions.fetchMoreBusinessReviewsAction.failure):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return {
        ...state,
        businessReviewsMoreLoading: false,
        error: action.payload.message,
      };

    // Team member reviews (replace)
    case getType(actions.fetchTeamMemberReviewsAction.request):
      return { ...state, teamMemberReviewsLoading: true, error: null };
    case getType(actions.fetchTeamMemberReviewsAction.success):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return {
        ...state,
        teamMemberReviewsLoading: false,
        teamMemberReviews: action.payload.data,
        teamMemberReviewsTotal: action.payload.pagination.total,
      };
    case getType(actions.fetchTeamMemberReviewsAction.failure):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return {
        ...state,
        teamMemberReviewsLoading: false,
        error: action.payload.message,
      };

    // Team member reviews (append for "load more") — uses *MoreLoading.
    case getType(actions.fetchMoreTeamMemberReviewsAction.request):
      return { ...state, teamMemberReviewsMoreLoading: true, error: null };
    case getType(actions.fetchMoreTeamMemberReviewsAction.success):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return {
        ...state,
        teamMemberReviewsMoreLoading: false,
        teamMemberReviews: [
          ...state.teamMemberReviews,
          ...action.payload.data,
        ],
        teamMemberReviewsTotal: action.payload.pagination.total,
      };
    case getType(actions.fetchMoreTeamMemberReviewsAction.failure):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return {
        ...state,
        teamMemberReviewsMoreLoading: false,
        error: action.payload.message,
      };

    // Highlight reviews (business-page preview). Failure is intentionally silent — it must not surface
    // an error in the Reviews tab (which reads `error`); the preview just degrades to no quotes.
    case getType(actions.fetchHighlightReviewsAction.request):
      return { ...state, highlightReviewsLoading: true };
    case getType(actions.fetchHighlightReviewsAction.success):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return {
        ...state,
        highlightReviewsLoading: false,
        highlightReviews: action.payload.data,
      };
    case getType(actions.fetchHighlightReviewsAction.failure):
      if (action.payload.scopeBusinessId !== state.scopeBusinessId) return state;
      return { ...state, highlightReviewsLoading: false };

    default:
      return state;
  }
};
