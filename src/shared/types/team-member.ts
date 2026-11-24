import type { UserRole } from "./auth";

export interface TeamMemberSummary {
  total: number;
  active: number;
  pending: number;
}

export interface TeamMemberLocation {
  id: number;
  name: string;
  address: string;
}

export interface TeamMemberService {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  usesCustomPricing: boolean;
  customPrice: number | null;
  customDuration: number | null;
}

export interface TeamMemberAppointment {
  id: number;
  timezone?: string;
  scheduledAt: string;
  endsAt: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  bookedItemName?: string;
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  service: {
    id: number;
    name: string;
  } | null;
  location: {
    id: number;
    name: string;
  } | null;
}

export interface TeamMember {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  // status: 'pending' | 'active' | 'inactive';
  roleStatus: 'active' | 'pending_acceptance' | 'disabled';
  createdAt: string;
  profileImage?: string | null;
  invitedBy?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  location?: number;
  locations?: number[] | TeamMemberLocation[];
  services?: number[] | TeamMemberService[];
  workingHours?: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  servicesCount?: number;
  locationsCount?: number;
  totalAppointments?: number;
  upcomingAppointments?: TeamMemberAppointment[];
}