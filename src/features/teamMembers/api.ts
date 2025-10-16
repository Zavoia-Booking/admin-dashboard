import { apiClient } from "../../shared/lib/http";
import type { TeamMember, TeamMemberSummary } from "../../shared/types/team-member";
import type { InviteTeamMemberPayload, InviteTeamMemberResponse } from "./types";

export const listTeamMembersApi = async (): Promise<{ summary: TeamMemberSummary; teamMembers: TeamMember[] }> => {
  const { data } = await apiClient().get<{ summary: TeamMemberSummary; teamMembers: TeamMember[] }>('/team/members');
  return data;
};

export const inviteTeamMemberApi = async (payload: InviteTeamMemberPayload): Promise<InviteTeamMemberResponse> => {
  const { data } = await apiClient().post<InviteTeamMemberResponse>('/auth/invite-team-member', payload);
  return data;
};

export const cancelInvitationApi = async (id: number): Promise<void> => {
  await apiClient().post(`/auth/cancel-invitation/${id}`);
};
