import { apiClient } from "../../shared/lib/http";
import type { InviteTeamMemberPayload, InviteTeamMemberResponse } from "./types";

export const inviteTeamMember = async (payload: InviteTeamMemberPayload): Promise<InviteTeamMemberResponse> => {
  try {
    const { data } = await apiClient().post<InviteTeamMemberResponse>(
      '/auth/invite-team-member',
      {
        email: payload.email,
        role: payload.role,
        locationId: payload.locationId,
      }
    );
    return data;
  } catch (err: any) {
    throw err;
  }
}

