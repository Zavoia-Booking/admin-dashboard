import { UserRole } from "../../shared/types/auth";

export const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
        case UserRole.TEAM_MEMBER: return 'bg-blue-100 text-blue-800 border-blue-200';
        case UserRole.MANAGER: return 'bg-green-100 text-green-800 border-green-200';
        case UserRole.OWNER: return 'bg-purple-100 text-purple-800 border-purple-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

export const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
        case UserRole.TEAM_MEMBER: return 'Team Member';
        case UserRole.MANAGER: return 'Manager';
        case UserRole.OWNER: return 'Owner';
        default: return 'Unknown';
    }
}; 