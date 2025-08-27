import { createAction } from "@reduxjs/toolkit";
import type { InviteTeamMemberPayload, InviteTeamMemberResponse } from "./types";

export const inviteTeamMemberRequest = createAction<InviteTeamMemberPayload>('TEAM_MEMBERS/INVITE/REQUEST');
export const inviteTeamMemberSuccess = createAction<InviteTeamMemberResponse>('TEAM_MEMBERS/INVITE/SUCCESS');
export const inviteTeamMemberFailure = createAction<string>('TEAM_MEMBERS/INVITE/FAILURE');


