import type { UserRole } from "./auth";

export interface TeamMemberSummary {
  total: number;
  active: number;
  pending: number;
}

export interface TeamMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'pending' | 'active' | 'inactive';
  isActive: boolean;
  createdAt: string;
  invitedBy?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  location?: number;
  locations?: number[];
  services?: number[];
  workingHours?: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
}