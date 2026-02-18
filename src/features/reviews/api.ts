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
): Promise<BusinessReviewsResponse> => {
  const { data } = await apiClient().get<BusinessReviewsResponse>(
    "/review/business-reviews",
    { params },
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

export const getReviewStatsApi = async (): Promise<ReviewStatsResponse> => {
  const { data } = await apiClient().get<ReviewStatsResponse>("/review/stats");
  return data;
};
