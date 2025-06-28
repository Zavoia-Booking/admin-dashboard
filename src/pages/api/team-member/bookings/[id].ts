import { NextApiRequest, NextApiResponse } from 'next';

// Reference to the mock database (in a real app, this would be a database connection)
import { mockBookings } from '../bookings';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  // For demonstration, we'll use a mock specialist ID
  const specialistId = 'specialist-1';

  // Find the booking by ID
  const bookingIndex = mockBookings.findIndex(b => b.booking_id === id || b.event_id === Number(id));
  
  if (bookingIndex === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  // Handle PUT request - update booking
  if (req.method === 'PUT') {
    try {
      const updatedBooking = req.body;
      
      // In production, add validation and update in database
      mockBookings[bookingIndex] = {
        ...mockBookings[bookingIndex],
        ...updatedBooking,
        // Ensure these fields aren't overwritten
        event_id: mockBookings[bookingIndex].event_id,
        booking_id: mockBookings[bookingIndex].booking_id,
      };
      
      return res.status(200).json(mockBookings[bookingIndex]);
    } catch (error) {
      console.error('Error updating booking:', error);
      return res.status(500).json({ error: 'Failed to update booking' });
    }
  }
  
  // Handle DELETE request - delete booking
  if (req.method === 'DELETE') {
    try {
      // In production, add validation and delete from database
      const deletedBooking = mockBookings.splice(bookingIndex, 1)[0];
      
      return res.status(200).json({ success: true, deletedBooking });
    } catch (error) {
      console.error('Error deleting booking:', error);
      return res.status(500).json({ error: 'Failed to delete booking' });
    }
  }
  
  // Handle GET request - fetch single booking
  if (req.method === 'GET') {
    return res.status(200).json(mockBookings[bookingIndex]);
  }
  
  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
} 