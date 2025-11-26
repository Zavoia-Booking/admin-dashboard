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
  createdAt: string;
  updatedAt: string;
  locations?: Array<{ id: number; name: string }>;
  teamMembers?: Array<{ id: number; firstName: string; lastName: string }>;
  category?: { id: number; name: string; color?: string } | null;
  locationsCount?: number;
  teamMembersCount?: number;
}