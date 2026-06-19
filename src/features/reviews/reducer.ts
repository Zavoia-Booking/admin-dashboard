import * as actions from "./actions";
import type { ReviewsState } from "./types";
import { getType, type ActionType } from "typesafe-actions";
import type { Reducer } from "redux";

type Actions = ActionType<typeof actions>;

const initialState: ReviewsState = {
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

export const ReviewsReducer: Reducer<ReviewsState, any> = (
  state: ReviewsState = initialState,
  action: Actions,
) => {
  switch (action.type) {
    // Stats
    case getType(actions.fetchReviewStatsAction.request):
      return { ...state, statsLoading: true, error: null };
    case getType(actions.fetchReviewStatsAction.success):
      return { ...state, statsLoading: false, stats: action.payload };
    case getType(actions.fetchReviewStatsAction.failure):
      return { ...state, statsLoading: false, error: action.payload.message };

    // Business reviews (replace)
    case getType(actions.fetchBusinessReviewsAction.request):
      return { ...state, businessReviewsLoading: true, error: null };
    case getType(actions.fetchBusinessReviewsAction.success):
      return {
        ...state,
        businessReviewsLoading: false,
        businessReviews: action.payload.data,
        businessReviewsTotal: action.payload.pagination.total,
      };
    case getType(actions.fetchBusinessReviewsAction.failure):
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
      return {
        ...state,
        businessReviewsMoreLoading: false,
        businessReviews: [...state.businessReviews, ...action.payload.data],
        businessReviewsTotal: action.payload.pagination.total,
      };
    case getType(actions.fetchMoreBusinessReviewsAction.failure):
      return {
        ...state,
        businessReviewsMoreLoading: false,
        error: action.payload.message,
      };

    // Team member reviews (replace)
    case getType(actions.fetchTeamMemberReviewsAction.request):
      return { ...state, teamMemberReviewsLoading: true, error: null };
    case getType(actions.fetchTeamMemberReviewsAction.success):
      return {
        ...state,
        teamMemberReviewsLoading: false,
        teamMemberReviews: action.payload.data,
        teamMemberReviewsTotal: action.payload.pagination.total,
      };
    case getType(actions.fetchTeamMemberReviewsAction.failure):
      return {
        ...state,
        teamMemberReviewsLoading: false,
        error: action.payload.message,
      };

    // Team member reviews (append for "load more") — uses *MoreLoading.
    case getType(actions.fetchMoreTeamMemberReviewsAction.request):
      return { ...state, teamMemberReviewsMoreLoading: true, error: null };
    case getType(actions.fetchMoreTeamMemberReviewsAction.success):
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
      return {
        ...state,
        highlightReviewsLoading: false,
        highlightReviews: action.payload.data,
      };
    case getType(actions.fetchHighlightReviewsAction.failure):
      return { ...state, highlightReviewsLoading: false };

    default:
      return state;
  }
};
