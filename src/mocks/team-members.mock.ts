import type { TeamMember } from "../shared/types/team-member.ts";
import { UserRole } from "../shared/types/auth.ts";

export const mockTeamMembers: Array<TeamMember> = [
  {
    id: 1,
    firstName: 'Emma',
    lastName: 'Thompson',
    email: 'emma@salon.com',
    phone: '+1 (555) 123-4567',
    role: UserRole.TEAM_MEMBER,
    status: 'active',
    isActive: true,
    createdAt: '2024-01-15T10:30:00Z',
    location: 1,
  },
  {
    id: 2,
    firstName: 'Alex',
    lastName: 'Rodriguez',
    email: 'alex@wellness.com',
    phone: '+1 (555) 234-5678',
    role: UserRole.TEAM_MEMBER,
    isActive: true,
    status: 'active',
    isActive: true,
    createdAt: '2024-02-01T15:45:00Z',
    location: 2,
  },
  {
    id: 3,
    firstName: 'David',
    lastName: 'Kim',
    email: 'david@barbershop.com',
    phone: '+1 (555) 456-7890',
    role: UserRole.TEAM_MEMBER,
    isActive: true,
    status: 'active',
    isActive: true,
    createdAt: '2024-01-20T09:15:00Z',
    location: 3,
  },
];
