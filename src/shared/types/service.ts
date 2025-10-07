export interface StaffAssignment {
  name: string;
  price?: number;
  duration?: number;
}

export interface Service {
  id: number;
  name: string;
  price: number;
  duration: number;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}