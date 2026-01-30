// Dashboard Types

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'no_show' | 'cancelled';
export type BookingSource = 'marketplace' | 'admin' | 'phone' | 'walk_in';
export type CustomerSource = 'manual' | 'marketplace' | 'import';
export type CalendarBlockScope = 'location' | 'staff';
export type BookingType = 'single' | 'bundle';

export interface AppointmentsByStatus {
  pending: number;
  confirmed: number;
  completed: number;
  no_show: number;
  cancelled: number;
}

export interface UpcomingAppointment {
  id: string;
  customerName: string;
  customerAvatar?: string;
  serviceName: string;
  staffName: string;
  staffAvatar?: string;
  time: string;
  duration: number;
  price: number;
}

export interface StaffMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  isOnDuty: boolean;
  appointmentsToday: number;
  bookedMinutes: number;
  availableMinutes: number;
  rating?: number;
  reviewCount?: number;
}

export interface BookingSourceBreakdown {
  source: BookingSource;
  count: number;
  percentage: number;
}

export interface ServiceRevenue {
  id: string;
  name: string;
  revenue: number;
  appointmentCount: number;
  averagePrice: number;
}

export interface StaffRevenue {
  id: string;
  name: string;
  avatar?: string;
  revenue: number;
  appointmentCount: number;
}

export interface Customer {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  appointmentCount: number;
  totalSpend: number;
  source: CustomerSource;
  lastVisit?: string;
  isNew: boolean;
}

export interface Review {
  id: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment?: string;
  staffName?: string;
  serviceName?: string;
  createdAt: string;
  response?: string;
}

export interface ServiceStats {
  id: string;
  name: string;
  categoryName: string;
  appointmentCount: number;
  revenue: number;
  isEnabled: boolean;
  bookingType: BookingType;
}

export interface CalendarBlock {
  id: string;
  title: string;
  scope: CalendarBlockScope;
  staffName?: string;
  startTime: string;
  endTime: string;
  reason: 'vacation' | 'sick' | 'break' | 'meeting' | 'other';
}

export interface WorkingHours {
  day: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface DashboardData {
  // Location Info
  locationId: string;
  locationName: string;
  isOpen247: boolean;
  isCurrentlyOpen: boolean;
  workingHours: WorkingHours[];
  
  // Today's Overview
  todayAppointments: AppointmentsByStatus;
  nextAppointment: UpcomingAppointment | null;
  revenueToday: number;
  staffOnDuty: StaffMember[];
  
  // Appointment Metrics
  weeklyAppointments: AppointmentsByStatus;
  monthlyAppointments: AppointmentsByStatus;
  bookingSources: BookingSourceBreakdown[];
  noShowRate: number;
  cancellationRate: number;
  averageDuration: number;
  
  // Revenue Analytics
  revenueThisWeek: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueByService: ServiceRevenue[];
  revenueByStaff: StaffRevenue[];
  averageTicketValue: number;
  
  // Customer Insights
  newCustomersThisMonth: number;
  returningCustomers: number;
  totalCustomers: number;
  topCustomers: Customer[];
  customersBySource: { source: CustomerSource; count: number }[];
  
  // Staff Performance
  staffPerformance: StaffMember[];
  calendarBlocksByStaff: CalendarBlock[];
  
  // Reviews & Ratings
  averageRating: number;
  totalReviews: number;
  recentReviews: Review[];
  reviewsAwaitingResponse: number;
  ratingThisMonth: number;
  ratingLastMonth: number;
  
  // Services Analytics
  topServices: ServiceStats[];
  servicesByBookingType: { single: number; bundle: number };
  
  // Calendar / Availability
  activeCalendarBlocks: CalendarBlock[];
  staffAvailabilityToday: StaffMember[];
}
