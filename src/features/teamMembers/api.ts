import { apiClient } from "../../shared/lib/http";
import type { TeamMember, TeamMemberSummary } from "../../shared/types/team-member";
import type { InviteTeamMemberPayload, InviteTeamMemberResponse } from "./types";

export const listTeamMembersApi = async (): Promise<{ summary: TeamMemberSummary; teamMembers: TeamMember[] }> => {
  // TODO: Add filters
  const { data } = await apiClient().post<{ summary: TeamMemberSummary; teamMembers: TeamMember[] }>('/team-members/list', { filters: [] });
  return data;
};

export const inviteTeamMemberApi = async (payload: InviteTeamMemberPayload): Promise<InviteTeamMemberResponse> => {
  const { data } = await apiClient().post<InviteTeamMemberResponse>('/auth/invite-team-member', payload);
  return data;
};

export const cancelInvitationApi = async (id: number): Promise<void> => {
  await apiClient().post(`/team-members/cancel-invitation/${id}`);
};

export const resendInvitationApi = async (id: number): Promise<void> => {
  await apiClient().post(`/team-members/resend-invitation/${id}`);
};

export const deleteTeamMemberApi = async (id: number): Promise<any> => {
  const { data } = await apiClient().delete(`/team-members/${id}`);
  return data;
};

export const fetchTeamMemberByIdApi = async (id: number): Promise<TeamMember> => {
  const { data } = await apiClient().get<{ teamMember: TeamMember }>(`/team-members/${id}`);
  return data.teamMember;
};