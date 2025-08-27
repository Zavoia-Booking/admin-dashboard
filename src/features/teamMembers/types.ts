export type InviteTeamMemberResponse = {
    message: string;
    invitation: {
        email: string;
        role: string;
        locationId: number;
        invitationToken: string;
        magicLink: string;
        expiresAt: string;
    }
}

export type InviteTeamMemberPayload = {
    email: string;
    role: 'manager' | 'team_member';
    locationId: number;
};