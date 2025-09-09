export interface StaffAssignment {
  name: string;
  price?: number;
  duration?: number;
}

export interface Service {
  id: number;
  name: string;
  price: number;
  duration: number; // in minutes
  description: string;
  isActive: boolean;
  createdAt: string;
}