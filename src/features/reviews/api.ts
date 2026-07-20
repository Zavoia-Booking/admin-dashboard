import { apiClient } from "../../shared/lib/http";
import type {
  BusinessReviewsResponse,
  TeamMemberReviewsResponse,
  ReviewStatsResponse,
  FetchBusinessReviewsPayload,
  FetchTeamMemberReviewsPayload,
} from "./types";

export const getBusinessReviewsApi = async (
  params: FetchBusinessReviewsPayload = {},
  options: { signal?: AbortSignal } = {},
): Promise<BusinessReviewsResponse> => {
  const { data } = await apiClient().get<BusinessReviewsResponse>(
    "/review/business-reviews",
    { params, signal: options.signal },
  );
  return data;
};

export const getTeamMemberReviewsApi = async (
  params: FetchTeamMemberReviewsPayload = {},
): Promise<TeamMemberReviewsResponse> => {
  const { data } = await apiClient().get<TeamMemberReviewsResponse>(
    "/review/team-member-reviews",
    { params },
  );
  return data;
};

export const getReviewStatsApi = async (
  options: { signal?: AbortSignal } = {},
): Promise<ReviewStatsResponse> => {
  const { data } = await apiClient().get<ReviewStatsResponse>("/review/stats", {
    signal: options.signal,
  });
  return data;
};
