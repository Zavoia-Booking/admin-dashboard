import { NextApiRequest, NextApiResponse } from 'next';

// Mock database for demonstration purposes
const mockProfiles: Record<string, any> = {
  'user-1': {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    about: 'I am a professional with over 10 years of experience in my field.',
    workingHours: [
      { day: 'Monday', isWorking: true, startTime: '09:00', endTime: '17:00' },
      { day: 'Tuesday', isWorking: true, startTime: '09:00', endTime: '17:00' },
      { day: 'Wednesday', isWorking: true, startTime: '09:00', endTime: '17:00' },
      { day: 'Thursday', isWorking: true, startTime: '09:00', endTime: '17:00' },
      { day: 'Friday', isWorking: true, startTime: '09:00', endTime: '17:00' },
      { day: 'Saturday', isWorking: false, startTime: '09:00', endTime: '17:00' },
      { day: 'Sunday', isWorking: false, startTime: '09:00', endTime: '17:00' },
    ],
    portfolioImages: [
      {
        id: 'img-1',
        url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070',
        caption: 'Sample work 1'
      },
      {
        id: 'img-2',
        url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=2070',
        caption: 'Sample work 2'
      }
    ]
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // In production, you would verify user authentication here
  // const session = await getServerSession(req, res, authOptions);
  // if (!session) return res.status(401).json({ error: 'Unauthorized' });
  
  // For demonstration, we'll use a mock user ID
  const userId = 'user-1'; // In production, you would get this from the session

  // Handle GET request - fetch profile
  if (req.method === 'GET') {
    // In production, you would fetch from database
    const profile = mockProfiles[userId] || {
      id: userId,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      about: '',
      workingHours: [
        { day: 'Monday', isWorking: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Tuesday', isWorking: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Wednesday', isWorking: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Thursday', isWorking: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Friday', isWorking: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Saturday', isWorking: false, startTime: '09:00', endTime: '17:00' },
        { day: 'Sunday', isWorking: false, startTime: '09:00', endTime: '17:00' },
      ],
      portfolioImages: []
    };
    
    return res.status(200).json(profile);
  }
  
  // Handle PUT request - update profile
  if (req.method === 'PUT') {
    try {
      const updatedProfile = req.body;
      
      // Validate input data
      if (!updatedProfile.firstName || !updatedProfile.lastName || !updatedProfile.email) {
        return res.status(400).json({ error: 'First name, last name, and email are required' });
      }
      
      // In production, you would update in your database
      mockProfiles[userId] = {
        ...updatedProfile,
        id: userId, // ensure ID doesn't change
      };
      
      return res.status(200).json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }
  
  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
} 