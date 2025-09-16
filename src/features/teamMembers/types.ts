import type { UserRole } from "../../shared/types/auth";

export type InviteTeamMemberResponse = {
    message: string;
}

export type InviteTeamMemberPayload = {
    email: string;
    role: UserRole;
};
