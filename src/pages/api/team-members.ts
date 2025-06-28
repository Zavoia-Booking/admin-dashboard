import type { NextApiRequest, NextApiResponse } from 'next';
import { UserRole } from '@/types/auth';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: 'pending' | 'active' | 'inactive';
  createdAt: string;
}

// Mock data for development
const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    role: 'Manager',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 234-5678',
    role: 'Team Member',
    status: 'active',
    createdAt: '2024-02-01T15:45:00Z'
  },
  {
    id: '3',
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.j@example.com',
    phone: '+1 (555) 345-6789',
    role: 'Manager',
    status: 'active',
    createdAt: '2024-01-20T09:15:00Z'
  },
  {
    id: '4',
    firstName: 'Sarah',
    lastName: 'Williams',
    email: 'sarah.w@example.com',
    phone: '+1 (555) 456-7890',
    role: 'Team Member',
    status: 'inactive',
    createdAt: '2024-01-10T14:20:00Z'
  },
  {
    id: '5',
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.b@example.com',
    phone: '+1 (555) 567-8901',
    role: 'Team Member',
    status: 'active',
    createdAt: '2024-02-05T11:30:00Z'
  },
  {
    id: '6',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.d@example.com',
    phone: '+1 (555) 678-9012',
    role: 'Team Member',
    status: 'pending',
    createdAt: '2024-02-10T16:45:00Z'
  },
  {
    id: '7',
    firstName: 'Robert',
    lastName: 'Miller',
    email: 'robert.m@example.com',
    phone: '+1 (555) 789-0123',
    role: 'Manager',
    status: 'active',
    createdAt: '2024-01-25T13:15:00Z'
  },
  {
    id: '8',
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'lisa.a@example.com',
    phone: '+1 (555) 890-1234',
    role: 'Team Member',
    status: 'inactive',
    createdAt: '2024-01-05T10:20:00Z'
  },
  {
    id: '9',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james.w@example.com',
    phone: '+1 (555) 901-2345',
    role: 'Team Member',
    status: 'active',
    createdAt: '2024-02-15T09:30:00Z'
  },
  {
    id: '10',
    firstName: 'Maria',
    lastName: 'Taylor',
    email: 'maria.t@example.com',
    phone: '+1 (555) 012-3456',
    role: 'Team Member',
    status: 'pending',
    createdAt: '2024-02-20T15:45:00Z'
  }
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<TeamMember[] | TeamMember | { message: string }>
) {
  if (req.method === 'GET') {
    // Return all team members
    res.status(200).json(mockTeamMembers);
  } else if (req.method === 'POST') {
    // Create new team member
    const { firstName, lastName, email, phone, role } = req.body;
    
    const newTeamMember: TeamMember = {
      id: Date.now().toString(),
      firstName,
      lastName,
      email,
      phone,
      role: role || UserRole.TEAM_MEMBER,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    mockTeamMembers.push(newTeamMember);
    res.status(201).json(newTeamMember);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
} 