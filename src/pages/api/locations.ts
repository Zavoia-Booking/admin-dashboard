import { NextApiRequest, NextApiResponse } from 'next';

// Mock database for demonstration purposes
const mockLocations: Record<string, any> = {
  '1': {
    id: '1',
    name: 'Downtown Salon',
    address: '123 Main Street, Downtown, City, State 12345',
    email: 'downtown@salon.com',
    phoneNumber: '(555) 123-4567',
    description: 'Our flagship location in the heart of downtown',
    workingHours: {
      monday: { open: '09:00', close: '17:00', isOpen: true },
      tuesday: { open: '09:00', close: '17:00', isOpen: true },
      wednesday: { open: '09:00', close: '17:00', isOpen: true },
      thursday: { open: '09:00', close: '17:00', isOpen: true },
      friday: { open: '09:00', close: '17:00', isOpen: true },
      saturday: { open: '10:00', close: '15:00', isOpen: true },
      sunday: { open: '10:00', close: '15:00', isOpen: false },
    },
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z'
  },
  '2': {
    id: '2',
    name: 'Westside Branch',
    address: '456 West Avenue, Westside, City, State 12345',
    email: 'westside@salon.com',
    phoneNumber: '(555) 987-6543',
    description: 'Convenient location for westside residents',
    workingHours: {
      monday: { open: '09:00', close: '17:00', isOpen: true },
      tuesday: { open: '09:00', close: '17:00', isOpen: true },
      wednesday: { open: '09:00', close: '17:00', isOpen: true },
      thursday: { open: '09:00', close: '17:00', isOpen: true },
      friday: { open: '09:00', close: '17:00', isOpen: true },
      saturday: { open: '10:00', close: '15:00', isOpen: true },
      sunday: { open: '10:00', close: '15:00', isOpen: true },
    },
    status: 'active',
    createdAt: '2024-02-01T15:45:00Z'
  },
  '3': {
    id: '3',
    name: 'Mall Location',
    address: '789 Shopping Center, Mall District, City, State 12345',
    email: 'mall@salon.com',
    phoneNumber: '(555) 456-7890',
    description: 'Located inside the shopping mall for convenience',
    workingHours: {
      monday: { open: '09:00', close: '17:00', isOpen: true },
      tuesday: { open: '09:00', close: '17:00', isOpen: true },
      wednesday: { open: '09:00', close: '17:00', isOpen: true },
      thursday: { open: '09:00', close: '17:00', isOpen: true },
      friday: { open: '09:00', close: '17:00', isOpen: true },
      saturday: { open: '09:00', close: '18:00', isOpen: true },
      sunday: { open: '11:00', close: '17:00', isOpen: true },
    },
    status: 'inactive',
    createdAt: '2024-01-20T09:15:00Z'
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // In production, you would verify user authentication here
  // const session = await getServerSession(req, res, authOptions);
  // if (!session) return res.status(401).json({ error: 'Unauthorized' });

  // Handle GET request - fetch all locations
  if (req.method === 'GET') {
    try {
      const locations = Object.values(mockLocations);
      return res.status(200).json(locations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      return res.status(500).json({ error: 'Failed to fetch locations' });
    }
  }
  
  // Handle POST request - create new location
  if (req.method === 'POST') {
    try {
      const newLocation = req.body;
      
      // Validate input data
      if (!newLocation.name || !newLocation.address || !newLocation.email || !newLocation.phoneNumber) {
        return res.status(400).json({ error: 'Name, address, email, and phone number are required' });
      }
      
      // Generate new ID
      const newId = (Object.keys(mockLocations).length + 1).toString();
      
      // Create new location
      const location = {
        ...newLocation,
        id: newId,
        createdAt: new Date().toISOString(),
      };
      
      // In production, you would save to your database
      mockLocations[newId] = location;
      
      return res.status(201).json(location);
    } catch (error) {
      console.error('Error creating location:', error);
      return res.status(500).json({ error: 'Failed to create location' });
    }
  }
  
  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
} 