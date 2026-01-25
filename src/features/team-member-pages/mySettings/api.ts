import { apiClient } from '../../../shared/lib/http';

export interface TeamMemberProfile {
  id: number;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  isGoogleLinked: boolean;
  provider: string | null;
  registeredVia: string | null;
  createdAt: string;
}

export interface GetTeamMemberProfileResponse {
  profile: TeamMemberProfile;
}

export interface UpdateTeamMemberProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface UpdateTeamMemberProfileResponse {
  message: string;
}

export const getTeamMemberProfile = async (): Promise<GetTeamMemberProfileResponse> => {
  const response = await apiClient().get<GetTeamMemberProfileResponse>('/team-member-account/profile');
  return response.data;
};

export const updateTeamMemberProfile = async (payload: UpdateTeamMemberProfilePayload): Promise<UpdateTeamMemberProfileResponse> => {
  const response = await apiClient().post<UpdateTeamMemberProfileResponse>('/team-member-account/profile', payload);
  return response.data;
};

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export const changeTeamMemberPassword = async (payload: ChangePasswordPayload): Promise<ChangePasswordResponse> => {
  const response = await apiClient().post<ChangePasswordResponse>('/team-member-account/change-password', payload);
  return response.data;
};

export interface UploadProfileImageResponse {
  message: string;
  profileImage: string;
}

export const uploadTeamMemberProfileImage = async (file: File): Promise<UploadProfileImageResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient().post<UploadProfileImageResponse>(
    '/team-member-account/upload-profile-image',
    formData
  );
  return response.data;
};
