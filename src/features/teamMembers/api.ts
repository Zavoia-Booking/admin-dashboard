import { apiClient } from "../../shared/lib/http";
import type { TeamMember } from "../../shared/types/team-member";

export const listTeamMembersApi = async (): Promise<{ teamMembers: TeamMember[] }> => {
  const { data } = await apiClient().get<{ teamMembers: TeamMember[] }>('/auth/team-members');
  return data;
};

