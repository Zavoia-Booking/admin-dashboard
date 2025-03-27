import { NextApiRequest, NextApiResponse } from 'next';

// Reference to the mock database from the parent file
// In a real app, this would be a database connection
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
  // Extract the image ID from the URL
  const { id } = req.query;
  
  // For demonstration, we'll use a mock user ID
  const userId = 'user-1'; // In production, you would get this from the session
  
  // Initialize user portfolio if it doesn't exist
  if (!mockPortfolios[userId]) {
    mockPortfolios[userId] = [];
  }

  // Handle DELETE request - remove a portfolio image
  if (req.method === 'DELETE') {
    try {
      // Check if the image exists
      const imageIndex = mockPortfolios[userId].findIndex(img => img.id === id);
      
      if (imageIndex === -1) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      // Remove the image from the portfolio
      mockPortfolios[userId].splice(imageIndex, 1);
      
      return res.status(200).json({ 
        success: true,
        message: 'Image removed successfully'
      });
    } catch (error) {
      console.error('Error removing portfolio image:', error);
      return res.status(500).json({ error: 'Failed to remove portfolio image' });
    }
  }
  
  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
} 