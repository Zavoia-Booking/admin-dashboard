import { createAsyncAction } from "typesafe-actions";
import type { InviteTeamMemberPayload, InviteTeamMemberResponse } from "./types";
import type { TeamMember } from "../../shared/types/team-member";

export const inviteTeamMemberAction = createAsyncAction(
  'teamMembers/INVITE_REQUEST',
  'teamMembers/INVITE_SUCCESS',
  'teamMembers/INVITE_FAILURE',
)<InviteTeamMemberPayload, InviteTeamMemberResponse, { message: string }>();

export const listTeamMembersAction = createAsyncAction(
  'teamMembers/LIST_REQUEST',
  'teamMembers/LIST_SUCCESS',
  'teamMembers/LIST_FAILURE',
)<void, { teamMembers: TeamMember[] }, { message: string }>();



