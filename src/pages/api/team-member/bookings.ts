import { NextApiRequest, NextApiResponse } from 'next';

// Mock database for bookings
export const mockBookings = [
  {
    event_id: 1,
    booking_id: "b001",
    title: "Haircut - Alice Johnson",
    start: new Date(new Date().setHours(10, 0, 0, 0)),
    end: new Date(new Date().setHours(10, 45, 0, 0)),
    client_name: "Alice Johnson",
    client_email: "alice@example.com",
    client_phone: "+1 (555) 123-4567",
    service_id: "s001",
    service_name: "Haircut",
    status: "confirmed",
    editable: true,
    draggable: true,
    color: "#4CAF50"
  },
  {
    event_id: 2,
    booking_id: "b002",
    title: "Manicure - Bob Smith",
    start: new Date(new Date().setHours(11, 30, 0, 0)),
    end: new Date(new Date().setHours(12, 30, 0, 0)),
    client_name: "Bob Smith",
    client_email: "bob@example.com",
    client_phone: "+1 (555) 234-5678",
    service_id: "s002",
    service_name: "Manicure",
    status: "confirmed",
    editable: true,
    draggable: true,
    color: "#2196F3"
  },
  {
    event_id: 3,
    booking_id: "b003",
    title: "Hair Coloring - Carol Davis",
    start: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(14, 0, 0, 0),
    end: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(16, 0, 0, 0),
    client_name: "Carol Davis",
    client_email: "carol@example.com",
    client_phone: "+1 (555) 345-6789",
    service_id: "s003",
    service_name: "Hair Coloring",
    status: "pending",
    editable: true,
    draggable: true,
    color: "#FFC107"
  },
  {
    event_id: 4,
    booking_id: "b004",
    title: "Makeup - Diana Evans",
    start: new Date(new Date().setDate(new Date().getDate() + 2)).setHours(9, 15, 0, 0),
    end: new Date(new Date().setDate(new Date().getDate() + 2)).setHours(10, 0, 0, 0),
    client_name: "Diana Evans",
    client_email: "diana@example.com",
    client_phone: "+1 (555) 456-7890",
    service_id: "s004",
    service_name: "Makeup",
    status: "canceled",
    editable: true,
    draggable: true,
    color: "#F44336"
  },
  {
    event_id: 5,
    booking_id: "b005",
    title: "Facial - Eric Miller",
    start: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(13, 0, 0, 0),
    end: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(14, 0, 0, 0),
    client_name: "Eric Miller",
    client_email: "eric@example.com",
    client_phone: "+1 (555) 567-8901",
    service_id: "s005",
    service_name: "Facial",
    status: "confirmed",
    editable: true,
    draggable: true,
    color: "#9C27B0"
  },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // In production, verify user authentication here
  
  // For demonstration, we'll use a mock specialist ID
  const specialistId = 'specialist-1';

  // Handle GET request - fetch bookings
  if (req.method === 'GET') {
    return res.status(200).json(mockBookings);
  }
  
  // Handle POST request - create booking
  if (req.method === 'POST') {
    try {
      const newBooking = req.body;
      // In production, add validation and save to database
      
      // Mock response for development
      const createdBooking = {
        ...newBooking,
        event_id: Date.now(), // Generate a unique ID
        booking_id: `b${Date.now()}`,
      };
      
      return res.status(201).json(createdBooking);
    } catch (error) {
      console.error('Error creating booking:', error);
      return res.status(500).json({ error: 'Failed to create booking' });
    }
  }
  
  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
} 