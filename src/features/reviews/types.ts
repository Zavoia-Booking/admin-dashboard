export interface ReviewCustomer {
  id: number;
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

export interface ReviewProfessional {
  id: number;
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

export interface BusinessReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: ReviewCustomer;
}

export interface TeamMemberReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: ReviewCustomer;
  professional: ReviewProfessional;
}

export interface ReviewPagination {
  offset: number;
  limit: number;
  total: number;
}

export interface BusinessReviewsResponse {
  data: BusinessReview[];
  pagination: ReviewPagination;
}

export interface TeamMemberReviewsResponse {
  data: TeamMemberReview[];
  pagination: ReviewPagination;
}

export interface RatingDistribution {
  "5": number;
  "4": number;
  "3": number;
  "2": number;
  "1": number;
}

export interface TeamMemberStats {
  teamMemberId: number;
  firstName: string;
  lastName: string;
  profileImage: string | null;
  averageRating: number;
  totalReviews: number;
}

export interface ReviewStatsData {
  overall: {
    averageRating: number | null;
    totalReviews: number;
  };
  business: {
    averageRating: number | null;
    totalReviews: number;
    ratingDistribution: RatingDistribution;
  };
  teamMembers: TeamMemberStats[];
}

export interface ReviewStatsResponse {
  data: ReviewStatsData;
}

export interface FetchBusinessReviewsPayload {
  offset?: number;
  limit?: number;
  rating?: number;
  sortOrder?: "ASC" | "DESC";
}

export interface FetchTeamMemberReviewsPayload {
  offset?: number;
  limit?: number;
  rating?: number;
  teamMemberId?: number;
  sortOrder?: "ASC" | "DESC";
}

export type ReviewSubTab = "business" | "team-members";

export interface ReviewsState {
  stats: ReviewStatsData | null;
  statsLoading: boolean;
  businessReviews: BusinessReview[];
  businessReviewsTotal: number;
  businessReviewsLoading: boolean;
  teamMemberReviews: TeamMemberReview[];
  teamMemberReviewsTotal: number;
  teamMemberReviewsLoading: boolean;
  error: string | null;
}
