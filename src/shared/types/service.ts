export interface StaffAssignment {
  name: string;
  price?: number;
  duration?: number;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  description: string;
  status: 'enabled' | 'disabled';
  createdAt: string;
  category?: string;
  bookings?: number;
  staff: StaffAssignment[];
}