import type { NextApiRequest, NextApiResponse } from 'next';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 234-5678',
    status: 'pending',
    createdAt: '2024-02-01T15:45:00Z'
  }
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<TeamMember | { message: string }>
) {
  const { id } = req.query;
  const teamMemberIndex = mockTeamMembers.findIndex(tm => tm.id === id);

  if (teamMemberIndex === -1) {
    return res.status(404).json({ message: 'Team member not found' });
  }

  if (req.method === 'PUT') {
    // Update team member
    const { firstName, lastName, email, phone } = req.body;
    
    mockTeamMembers[teamMemberIndex] = {
      ...mockTeamMembers[teamMemberIndex],
      firstName,
      lastName,
      email,
      phone
    };
    
    res.status(200).json(mockTeamMembers[teamMemberIndex]);
  } else if (req.method === 'DELETE') {
    // Delete team member
    mockTeamMembers.splice(teamMemberIndex, 1);
    res.status(200).json({ message: 'Team member deleted successfully' });
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
} 