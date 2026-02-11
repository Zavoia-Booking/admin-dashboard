import type { Customer } from "./customer.ts";
import type { Service } from "./service.ts";
import type { WorkingHours } from "./location.ts";

// ─────────────────────────────────────────────────────────────
// Legacy types (kept during migration, used by existing components)
// ─────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string;
}

export interface Appointment {
  id: number,
  customer: Customer,
  teamMembers: Array<any>,
  service: Service,
  location: {
    id: number,
    name: string,
    address: string,
    description: string,
    phone: string,
    email: string,
  },
  scheduledAt: Date,
  endsAt: Date,
  status: string,
  notes: string,
  price: number,
  cancellationReason: string,
  createdAt: Date,
  updatedAt: Date,
}

export interface AppointmentSection {
  date: Date,
  appointments: Array<Appointment>
}

// ─────────────────────────────────────────────────────────────
// New types matching backend calendar API responses
// ─────────────────────────────────────────────────────────────

// --- Enums (mirror backend) ---

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

export enum CalendarBlockScope {
  BUSINESS = 'business',
  LOCATION = 'location',
  STAFF = 'staff',
}

export enum CalendarBlockReason {
  HOLIDAY = 'holiday',
  VACATION = 'vacation',
  SICK = 'sick',
  LUNCH_BREAK = 'lunch_break',
  BREAK = 'break',
  MEETING = 'meeting',
  PERSONAL = 'personal',
  MAINTENANCE = 'maintenance',
  OTHER = 'other',
}

export enum AppointmentBookingSource {
  MARKETPLACE = 'marketplace',
  ADMIN = 'admin',
  PHONE = 'phone',
  WALK_IN = 'walk_in',
}

// --- GET /calendar/location-context/:locationId ---

export interface CalendarStaffMember {
  id: number;
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

export interface CalendarBookingSettings {
  slotIntervalMinutes: number;
  bufferTimeMinutes: number;
  autoConfirmBookings: boolean;
  allowStaffSelection: boolean;
  allowStaffCancelWithoutConfirmation: boolean;
  allowStaffRescheduleWithoutConfirmation: boolean;
  allowStaffBlockCalendarWithoutConfirmation: boolean;
  staffBlockCalendarTypes: string[];
}

export interface LocationContextData {
  location: {
    id: number;
    name: string;
    timezone: string | null;
    workingHours: WorkingHours;
    open247: boolean;
  };
  staff: CalendarStaffMember[];
  bookingSettings: CalendarBookingSettings;
}

// --- POST /calendar/summary ---

export interface AppointmentPreview {
  id: number;
  scheduledAt: string;
  endsAt: string;
  status: string;
  bookedItemName: string;
  customerName: string;
  isUnassigned: boolean;
}

export interface DaySummary {
  appointmentCount: number;
  blockedSlots: number;
  isOpen: boolean;
  firstAppointments?: AppointmentPreview[];
}

export interface CalendarSummaryResponse {
  days: Record<string, DaySummary>;
}

// --- POST /calendar/day ---

export interface SlimAppointment {
  id: number;
  scheduledAt: string;
  endsAt: string;
  status: string;
  bookedItemName: string;
  duration: number;
  staffUserIds: number[];
  customerName: string;
  bookingSource: string;
  isUnassigned: boolean;
}

export interface CalendarBlockDto {
  id: number;
  blockScope: CalendarBlockScope;
  userId: number | null;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  reason: CalendarBlockReason;
  title: string | null;
}

export interface DayDataResponse {
  appointments: SlimAppointment[];
  blocks: CalendarBlockDto[];
}

// --- Calendar Block CRUD (POST/PUT /calendar-blocks) ---

export interface CalendarBlockCreatePayload {
  blockScope: CalendarBlockScope;
  locationId: number;
  userId?: number;
  startsAt: string;
  endsAt: string;
  isAllDay?: boolean;
  isRecurring?: boolean;
  repeatFrequency?: 'daily' | 'weekly';
  repeatDaysOfWeek?: number[];
  repeatEndDate?: string;
  reason: CalendarBlockReason;
  title?: string;
  notes?: string;
}

export interface CalendarBlockUpdatePayload {
  startsAt?: string;
  endsAt?: string;
  isAllDay?: boolean;
  reason?: CalendarBlockReason;
  title?: string;
  notes?: string;
}

// --- POST /appointments/admin-create ---

export interface AdminCreateAppointmentPayload {
  serviceId: number;
  locationId: number;
  customerId?: number;
  staffUserIds?: number[];
  scheduledAt: number;
  notes?: string;
  bookingSource?: AppointmentBookingSource;
  overrideConflicts?: boolean;
}

// --- Day Filters (for calendar/day endpoint) ---

export interface CalendarDayFilters {
  staffUserId?: number;
  serviceId?: number;
  status?: string;
  clientName?: string;
}