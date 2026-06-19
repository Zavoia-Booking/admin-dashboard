import type { RootState } from "../../app/providers/store";

export const selectReviewStats = (state: RootState) => state.reviews.stats;
export const selectReviewStatsLoading = (state: RootState) =>
  state.reviews.statsLoading;

export const selectBusinessReviews = (state: RootState) =>
  state.reviews.businessReviews;
export const selectBusinessReviewsTotal = (state: RootState) =>
  state.reviews.businessReviewsTotal;
export const selectBusinessReviewsLoading = (state: RootState) =>
  state.reviews.businessReviewsLoading;
export const selectBusinessReviewsMoreLoading = (state: RootState) =>
  state.reviews.businessReviewsMoreLoading;

export const selectTeamMemberReviews = (state: RootState) =>
  state.reviews.teamMemberReviews;
export const selectTeamMemberReviewsTotal = (state: RootState) =>
  state.reviews.teamMemberReviewsTotal;
export const selectTeamMemberReviewsLoading = (state: RootState) =>
  state.reviews.teamMemberReviewsLoading;
export const selectTeamMemberReviewsMoreLoading = (state: RootState) =>
  state.reviews.teamMemberReviewsMoreLoading;

export const selectHighlightReviews = (state: RootState) =>
  state.reviews.highlightReviews;
export const selectHighlightReviewsLoading = (state: RootState) =>
  state.reviews.highlightReviewsLoading;

export const selectReviewsError = (state: RootState) => state.reviews.error;
