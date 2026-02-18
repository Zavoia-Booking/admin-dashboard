import { takeLatest, call, put, all } from "redux-saga/effects";
import {
  fetchReviewStatsAction,
  fetchBusinessReviewsAction,
  fetchMoreBusinessReviewsAction,
  fetchTeamMemberReviewsAction,
  fetchMoreTeamMemberReviewsAction,
} from "./actions";
import {
  getReviewStatsApi,
  getBusinessReviewsApi,
  getTeamMemberReviewsApi,
} from "./api";
import type {
  ReviewStatsResponse,
  BusinessReviewsResponse,
  TeamMemberReviewsResponse,
} from "./types";
import type { ActionType } from "typesafe-actions";

function* handleFetchReviewStats() {
  try {
    const response: ReviewStatsResponse = yield call(getReviewStatsApi);
    yield put(fetchReviewStatsAction.success(response.data));
  } catch (error: any) {
    const message =
      error?.response?.data?.error ||
      error?.message ||
      "Failed to fetch review stats";
    yield put(fetchReviewStatsAction.failure({ message }));
  }
}

function* handleFetchBusinessReviews(
  action: ActionType<typeof fetchBusinessReviewsAction.request>,
) {
  try {
    const response: BusinessReviewsResponse = yield call(
      getBusinessReviewsApi,
      action.payload,
    );
    yield put(fetchBusinessReviewsAction.success(response));
  } catch (error: any) {
    const message =
      error?.response?.data?.error ||
      error?.message ||
      "Failed to fetch business reviews";
    yield put(fetchBusinessReviewsAction.failure({ message }));
  }
}

function* handleFetchMoreBusinessReviews(
  action: ActionType<typeof fetchMoreBusinessReviewsAction.request>,
) {
  try {
    const response: BusinessReviewsResponse = yield call(
      getBusinessReviewsApi,
      action.payload,
    );
    yield put(fetchMoreBusinessReviewsAction.success(response));
  } catch (error: any) {
    const message =
      error?.response?.data?.error ||
      error?.message ||
      "Failed to fetch business reviews";
    yield put(fetchMoreBusinessReviewsAction.failure({ message }));
  }
}

function* handleFetchTeamMemberReviews(
  action: ActionType<typeof fetchTeamMemberReviewsAction.request>,
) {
  try {
    const response: TeamMemberReviewsResponse = yield call(
      getTeamMemberReviewsApi,
      action.payload,
    );
    yield put(fetchTeamMemberReviewsAction.success(response));
  } catch (error: any) {
    const message =
      error?.response?.data?.error ||
      error?.message ||
      "Failed to fetch team member reviews";
    yield put(fetchTeamMemberReviewsAction.failure({ message }));
  }
}

function* handleFetchMoreTeamMemberReviews(
  action: ActionType<typeof fetchMoreTeamMemberReviewsAction.request>,
) {
  try {
    const response: TeamMemberReviewsResponse = yield call(
      getTeamMemberReviewsApi,
      action.payload,
    );
    yield put(fetchMoreTeamMemberReviewsAction.success(response));
  } catch (error: any) {
    const message =
      error?.response?.data?.error ||
      error?.message ||
      "Failed to fetch team member reviews";
    yield put(fetchMoreTeamMemberReviewsAction.failure({ message }));
  }
}

export function* reviewsSaga(): Generator<any, void, any> {
  yield all([
    takeLatest(fetchReviewStatsAction.request, handleFetchReviewStats),
    takeLatest(fetchBusinessReviewsAction.request, handleFetchBusinessReviews),
    takeLatest(
      fetchMoreBusinessReviewsAction.request,
      handleFetchMoreBusinessReviews,
    ),
    takeLatest(
      fetchTeamMemberReviewsAction.request,
      handleFetchTeamMemberReviews,
    ),
    takeLatest(
      fetchMoreTeamMemberReviewsAction.request,
      handleFetchMoreTeamMemberReviews,
    ),
  ]);
}
