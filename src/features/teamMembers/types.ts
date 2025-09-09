import type { UserRole } from "../../shared/types/auth";

export type InviteTeamMemberResponse = {
    message: string;
    invitation: {
        email: string;
        role: UserRole;
        locationId: number;
        invitationToken: string;
        magicLink: string;
        expiresAt: string;
    }
}

export type InviteTeamMemberPayload = {
    email: string;
    role: UserRole;
    locationId: number;
};