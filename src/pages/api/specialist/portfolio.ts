import { NextApiRequest, NextApiResponse } from 'next';

// Set export config for handling form data
export const config = {
  api: {
    bodyParser: true, // Changed to true for simpler JSON handling
  },
};

// Mock database for demonstration purposes
const mockPortfolios: Record<string, any[]> = {
  'user-1': [
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
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // For demonstration, we'll use a mock user ID
  const userId = 'user-1'; // In production, you would get this from the session
  
  // Initialize user portfolio if it doesn't exist
  if (!mockPortfolios[userId]) {
    mockPortfolios[userId] = [];
  }

  // Handle POST request - add a new portfolio image
  if (req.method === 'POST') {
    try {
      // In a real implementation, you would:
      // 1. Parse the form data
      // 2. Upload the image to a storage service (S3, Cloudinary, etc.)
      // 3. Store the image URL and metadata in your database
      
      // For demonstration, we'll mock this process
      const imageId = `img-${Date.now()}`;
      const mockImageUrl = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070';
      const caption = req.body.caption || 'New portfolio image';
      
      // Create a new image entry
      const newImage = {
        id: imageId,
        url: mockImageUrl,
        caption: caption
      };
      
      // Add to the mock database
      mockPortfolios[userId].push(newImage);
      
      return res.status(200).json({ 
        success: true,
        id: imageId,
        url: mockImageUrl,
        caption: caption
      });
    } catch (error) {
      console.error('Error adding portfolio image:', error);
      return res.status(500).json({ error: 'Failed to add portfolio image' });
    }
  }
  
  // Handle GET request - get all portfolio images
  if (req.method === 'GET') {
    return res.status(200).json(mockPortfolios[userId] || []);
  }
  
  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
} 