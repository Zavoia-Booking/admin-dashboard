import { apiClient } from '../../../shared/lib/http';

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  website?: string;
}

export interface MarketplaceProfile {
  id: number;
  displayName: string | null;
  professionalTitle: string | null;
  aboutMe: string | null;
  yearsOfExperience: number | null;
  interests: string[] | null;
  languages: string[] | null;
  socialLinks: SocialLinks | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetMarketplaceProfileResponse {
  marketplaceProfile: MarketplaceProfile | null;
  /** Marketplace opt-out; only togglable by dashboard users (no active business membership). */
  hiddenFromMarketplace: boolean;
}

// null clears a field (blanking persists); omitting it leaves the value unchanged.
export interface UpdateMarketplaceProfilePayload {
  displayName?: string;
  professionalTitle?: string | null;
  aboutMe?: string | null;
  yearsOfExperience?: number | null;
  interests?: string[];
  languages?: string[];
  socialLinks?: SocialLinksInput | null;
}

export interface SocialLinksInput {
  instagram?: string | null;
  tiktok?: string | null;
  facebook?: string | null;
  website?: string | null;
}

export interface UpdateMarketplaceProfileResponse {
  message: string;
  marketplaceProfile: MarketplaceProfile;
}

export const getMarketplaceProfile = async (): Promise<GetMarketplaceProfileResponse> => {
  const response = await apiClient().get<GetMarketplaceProfileResponse>('/team-member-account/marketplace-profile');
  return response.data;
};

export const updateMarketplaceProfile = async (payload: UpdateMarketplaceProfilePayload): Promise<UpdateMarketplaceProfileResponse> => {
  const response = await apiClient().post<UpdateMarketplaceProfileResponse>('/team-member-account/marketplace-profile', payload);
  return response.data;
};

export interface UpdateMarketplaceVisibilityResponse {
  message: string;
  hiddenFromMarketplace: boolean;
}

export const updateMarketplaceVisibility = async (hidden: boolean): Promise<UpdateMarketplaceVisibilityResponse> => {
  const response = await apiClient().post<UpdateMarketplaceVisibilityResponse>('/team-member-account/marketplace-visibility', { hidden });
  return response.data;
};

// Portfolio Image types
export interface PortfolioImageData {
  url: string;
  key: string;
  originalName?: string;
  size?: number;
}

// Get portfolio images
export const getPortfolioImages = async (): Promise<PortfolioImageData[]> => {
  const response = await apiClient().get<{ portfolioImages: PortfolioImageData[] }>('/team-member-account/portfolio-images');
  return response.data.portfolioImages || [];
};

// Upload portfolio image
export const uploadPortfolioImage = async (file: File): Promise<{
  url: string;
  key: string;
  alreadyExisted?: boolean;
}> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient().post('/team-member-account/upload-portfolio-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// Delete portfolio image
export const deletePortfolioImage = async (key: string): Promise<void> => {
  await apiClient().delete(`/team-member-account/portfolio-image/${encodeURIComponent(key)}`);
};

// My Reviews types & API
export interface MyReviewsPayload {
  offset?: number;
  limit?: number;
  rating?: number;
  sortOrder?: 'ASC' | 'DESC';
}

export interface MyReviewCustomer {
  id: number;
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

export interface MyReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: MyReviewCustomer;
}

export interface MyReviewsPagination {
  offset: number;
  limit: number;
  total: number;
}

export interface MyReviewsResponse {
  data: MyReview[];
  pagination: MyReviewsPagination;
}

export interface RatingDistribution {
  '5': number;
  '4': number;
  '3': number;
  '2': number;
  '1': number;
}

export interface MyStatsData {
  averageRating: number | null;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
}

export interface MyStatsResponse {
  data: MyStatsData;
}

export const getMyReviews = async (params: MyReviewsPayload = {}): Promise<MyReviewsResponse> => {
  const { data } = await apiClient().get<MyReviewsResponse>('/review/my-reviews', { params });
  return data;
};

export const getMyStats = async (): Promise<MyStatsResponse> => {
  const { data } = await apiClient().get<MyStatsResponse>('/review/my-stats');
  return data;
};

// Predefined languages list
export const AVAILABLE_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Dutch',
  'Russian',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
  'Romanian',
  'Polish',
  'Turkish',
  'Greek',
  'Swedish',
  'Norwegian',
  'Danish',
  'Finnish',
  'Czech',
  'Hungarian',
  'Ukrainian',
  'Bulgarian',
  'Croatian',
  'Serbian',
  'Slovak',
  'Slovenian',
];

// Predefined personal interests list (hobbies, lifestyle, etc.)
export const AVAILABLE_INTERESTS = [
  'Travel',
  'Photography',
  'Music',
  'Reading',
  'Cooking',
  'Fitness',
  'Yoga',
  'Hiking',
  'Sports',
  'Gaming',
  'Art',
  'Movies',
  'Fashion',
  'Dancing',
  'Gardening',
  'Pets',
  'Family Time',
  'Coffee Lover',
  'Foodie',
  'Beach Life',
  'Nature',
  'Wellness',
  'Meditation',
  'Crafts',
  'DIY Projects',
  'Volunteering',
  'Learning Languages',
  'Podcasts',
  'Wine & Dining',
  'Outdoor Activities',
];
