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

export interface ReviewLocation {
  id: number;
  name: string;
}

export interface BusinessReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: ReviewCustomer;
  location: ReviewLocation | null;
}

export interface TeamMemberReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: ReviewCustomer;
  professional: ReviewProfessional;
  location: ReviewLocation | null;
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

export interface LocationStats {
  locationId: number;
  name: string;
  averageRating: number | null;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
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
  locations: LocationStats[];
  teamMembers: TeamMemberStats[];
}

export interface ReviewStatsResponse {
  data: ReviewStatsData;
}

export type ReviewSortBy = "createdAt" | "rating";
export type ReviewSortOrder = "ASC" | "DESC";

export interface FetchBusinessReviewsPayload {
  offset?: number;
  limit?: number;
  rating?: number;
  sortBy?: ReviewSortBy;
  sortOrder?: ReviewSortOrder;
  locationId?: number;
  startDate?: string;
  endDate?: string;
  withCommentsOnly?: boolean;
}

export interface FetchTeamMemberReviewsPayload {
  offset?: number;
  limit?: number;
  rating?: number;
  teamMemberId?: number;
  sortBy?: ReviewSortBy;
  sortOrder?: ReviewSortOrder;
  locationId?: number;
  startDate?: string;
  endDate?: string;
  withCommentsOnly?: boolean;
}

export type ReviewSubTab = "business" | "team-members";

export interface ReviewsState {
  /** Account/business scope that owns every value in this slice. */
  scopeBusinessId: string | null;
  stats: ReviewStatsData | null;
  statsLoading: boolean;
  businessReviews: BusinessReview[];
  businessReviewsTotal: number;
  /** True only during the *replace* fetch (initial load, filter/sort apply).
   *  Drives the full list skeleton. Separate from `*MoreLoading` so the
   *  "Load more" pagination doesn't flash the skeleton over existing rows. */
  businessReviewsLoading: boolean;
  /** True only during the *append* fetch ("Load more"). Drives the spinner
   *  inside the Load more button without touching the rest of the list. */
  businessReviewsMoreLoading: boolean;
  teamMemberReviews: TeamMemberReview[];
  teamMemberReviewsTotal: number;
  teamMemberReviewsLoading: boolean;
  teamMemberReviewsMoreLoading: boolean;
  /** Curated 5★ reviews-with-comments for the business-page preview. Separate from `businessReviews`
   *  so the Reviews tab's own filtered fetch never clobbers the preview's highlight quotes. */
  highlightReviews: BusinessReview[];
  highlightReviewsLoading: boolean;
  /** True only after the current business's highlight request succeeds, including a valid empty result. */
  highlightReviewsLoaded: boolean;
  error: string | null;
}
