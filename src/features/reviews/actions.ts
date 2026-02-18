import { createAsyncAction } from "typesafe-actions";
import type {
  BusinessReviewsResponse,
  TeamMemberReviewsResponse,
  ReviewStatsData,
  FetchBusinessReviewsPayload,
  FetchTeamMemberReviewsPayload,
} from "./types";

export const fetchReviewStatsAction = createAsyncAction(
  "reviews/FETCH_STATS_REQUEST",
  "reviews/FETCH_STATS_SUCCESS",
  "reviews/FETCH_STATS_FAILURE",
)<void, ReviewStatsData, { message: string }>();

export const fetchBusinessReviewsAction = createAsyncAction(
  "reviews/FETCH_BUSINESS_REVIEWS_REQUEST",
  "reviews/FETCH_BUSINESS_REVIEWS_SUCCESS",
  "reviews/FETCH_BUSINESS_REVIEWS_FAILURE",
)<
  FetchBusinessReviewsPayload,
  BusinessReviewsResponse,
  { message: string }
>();

export const fetchMoreBusinessReviewsAction = createAsyncAction(
  "reviews/FETCH_MORE_BUSINESS_REVIEWS_REQUEST",
  "reviews/FETCH_MORE_BUSINESS_REVIEWS_SUCCESS",
  "reviews/FETCH_MORE_BUSINESS_REVIEWS_FAILURE",
)<
  FetchBusinessReviewsPayload,
  BusinessReviewsResponse,
  { message: string }
>();

export const fetchTeamMemberReviewsAction = createAsyncAction(
  "reviews/FETCH_TEAM_MEMBER_REVIEWS_REQUEST",
  "reviews/FETCH_TEAM_MEMBER_REVIEWS_SUCCESS",
  "reviews/FETCH_TEAM_MEMBER_REVIEWS_FAILURE",
)<
  FetchTeamMemberReviewsPayload,
  TeamMemberReviewsResponse,
  { message: string }
>();

export const fetchMoreTeamMemberReviewsAction = createAsyncAction(
  "reviews/FETCH_MORE_TEAM_MEMBER_REVIEWS_REQUEST",
  "reviews/FETCH_MORE_TEAM_MEMBER_REVIEWS_SUCCESS",
  "reviews/FETCH_MORE_TEAM_MEMBER_REVIEWS_FAILURE",
)<
  FetchTeamMemberReviewsPayload,
  TeamMemberReviewsResponse,
  { message: string }
>();
