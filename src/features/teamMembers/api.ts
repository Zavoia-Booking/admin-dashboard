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

export interface AppointmentActionItem {
  appointmentId: number;
  newStaffUserId?: number | null;
  cancel?: boolean;
}

export const offboardTeamMemberApi = async (id: number, appointmentActions: AppointmentActionItem[]): Promise<void> => {
  await apiClient().post(`/team-members/${id}/offboard`, { appointmentActions });
};

export interface OffboardPreviewAppointment {
  id: number;
  scheduledAt: string;
  endsAt: string;
  status: string;
  customer: { firstName: string; lastName: string; email: string } | null;
  service: { id: number; name: string } | null;
  location: { id: number; name: string } | null;
  staffUserIds?: number[];
}

export interface EligibleStaffMember {
  userId: number;
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

export interface OffboardPreviewResponse {
  appointments: OffboardPreviewAppointment[];
  // Keyed by appointmentId — eligible staff for each specific appointment (incl. availability check).
  eligibleStaffMap: Record<number, EligibleStaffMember[]>;
  orphanedAppointmentIds: number[];
}

export const getOffboardPreviewApi = async (
  id: number,
  opts?: { locationId?: number; signal?: AbortSignal },
): Promise<OffboardPreviewResponse> => {
  const { data } = await apiClient().get<OffboardPreviewResponse>(
    `/team-members/${id}/offboard-preview`,
    {
      params: opts?.locationId ? { locationId: opts.locationId } : undefined,
      signal: opts?.signal,
    },
  );
  return data;
};

export const getLocationUnassignPreviewApi = async (
  userId: number,
  locationId: number,
  signal?: AbortSignal,
): Promise<OffboardPreviewResponse> => {
  const { data } = await apiClient().get<OffboardPreviewResponse>(
    `/team-members/${userId}/unassign-location/${locationId}/preview`,
    { signal },
  );
  return data;
};

export const unassignFromLocationApi = async (
  userId: number,
  locationId: number,
  appointmentActions: AppointmentActionItem[],
): Promise<{ message: string }> => {
  const { data } = await apiClient().post<{ message: string }>(
    `/team-members/${userId}/unassign-location/${locationId}`,
    { appointmentActions },
  );
  return data;
};

export type BulkOffboardPreviewResponse = OffboardPreviewResponse;

export const getBulkOffboardPreviewApi = async (
  userIds: number[],
  signal?: AbortSignal,
): Promise<BulkOffboardPreviewResponse> => {
  const { data } = await apiClient().post<BulkOffboardPreviewResponse>(
    '/team-members/offboard-preview',
    { userIds },
    { signal },
  );
  return data;
};

export const bulkOffboardApi = async (
  userIds: number[],
  appointmentActions: AppointmentActionItem[],
): Promise<{ message: string; removedUserIds: number[] }> => {
  const { data } = await apiClient().post<{ message: string; removedUserIds: number[] }>(
    '/team-members/offboard',
    { userIds, appointmentActions },
  );
  return data;
};