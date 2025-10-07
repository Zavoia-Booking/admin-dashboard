import type { UserRole } from "../../shared/types/auth";

export type InviteTeamMemberResponse = {
    message: string;
    requiresAction?: boolean;
    clientSecret?: string | null;
    seats?: number;
    paymentIntentStatus?: string | null;
    paymentComplete?: boolean;
}

export type InviteTeamMemberPayload = {
    email: string;
    role: UserRole;
};
