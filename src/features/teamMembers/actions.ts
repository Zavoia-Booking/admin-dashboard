import { createAsyncAction, createAction } from "typesafe-actions";
import type { InviteTeamMemberPayload, InviteTeamMemberResponse } from "./types";
import type { TeamMember, TeamMemberSummary } from "../../shared/types/team-member";

export const inviteTeamMemberAction = createAsyncAction(
  'teamMembers/INVITE_REQUEST',
  'teamMembers/INVITE_SUCCESS',
  'teamMembers/INVITE_FAILURE',
)<InviteTeamMemberPayload, InviteTeamMemberResponse, { message: string }>();

export const clearInviteResponseAction = createAction('teamMembers/CLEAR_INVITE_RESPONSE')();

export const listTeamMembersAction = createAsyncAction(
  'teamMembers/LIST_REQUEST',
  'teamMembers/LIST_SUCCESS',
  'teamMembers/LIST_FAILURE',
)<void, { summary: TeamMemberSummary; teamMembers: TeamMember[] }, { message: string }>();

export const cancelInvitationAction = createAsyncAction(
  'teamMembers/CANCEL_INVITATION_REQUEST',
  'teamMembers/CANCEL_INVITATION_SUCCESS',
  'teamMembers/CANCEL_INVITATION_FAILURE',
)<{ id: number }, void, { message: string }>();
