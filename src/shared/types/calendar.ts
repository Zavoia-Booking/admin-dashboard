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
  /** Set when admin overrode working hours or conflict. */
  overrideReason?: string;
  overrideUsedAt?: Date | string;
  /** When set, this appointment is part of a multi-item booking group. */
  bookingGroupId?: string | null;
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
  cancellationPolicyMessage: string | null;
  bookingReminderMessage: string | null;
  reminderHoursBefore: number;
  enforceMinAdvanceForAdmin: boolean;
  minAdvanceBookingMinutes: number;
}

/** Service at location (from GET /calendar/location-context when extended with assignments). */
export interface LocationContextService {
  serviceId: number;
  serviceName: string;
  category?: { id: number; name: string; color?: string } | null;
  defaultPrice: number;
  defaultDisplayPrice: number;
  defaultDuration: number;
  customPrice: number | null;
  customDuration: number | null;
  staffCount: number;
  staffWithOverrides: number;
  /** User IDs who can perform this service at this location (for filtering staff dropdown). */
  staffIds?: number[];
}

/** Team member at location (from GET /calendar/location-context when extended with assignments). */
export interface LocationContextTeamMember {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string | null;
  role: string;
  servicesEnabled: number;
  overridesCount: number;
}

/** Bundle at location for calendar context (add form: service or bundle per row). */
export interface LocationContextBundle {
  bundleId: number;
  bundleName: string;
  serviceIds: number[];
  durationMinutes: number;
  staffIds: number[];
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
  /** Set when backend extends location-context with assignment data (services + team per location). */
  services?: LocationContextService[];
  teamMembers?: LocationContextTeamMember[];
  /** Enabled bundles at location (for multi-item add form). */
  bundles?: LocationContextBundle[];
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
  /** Set when admin overrode working hours or conflict (for grid badge). */
  overrideReason?: string;
  /** When set, this appointment is part of a multi-item booking group; UI may show as one combined block. */
  bookingGroupId?: string | null;
  bookingGroupOrder?: number | null;
}

/** One display block: either a single appointment or a grouped booking (same bookingGroupId). */
export interface CalendarDisplayBlock {
  type: 'single' | 'group';
  /** For single: one id; for group: first appointment id (for edit/detail). */
  id: number;
  /** All appointment ids in this block (for group: all rows; for single: [id]). */
  appointmentIds: number[];
  start: string;
  end: string;
  status: string;
  label: string;
  duration: number;
  staffUserIds: number[];
  customerName: string;
  bookingSource: string;
  isUnassigned: boolean;
  overrideReason?: string;
  bookingGroupId?: string | null;
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
  /** Month summary for sidebar mini calendar (when returned by /calendar/day). */
  miniSummary?: Record<string, DaySummary>;
}

/** Response from POST /calendar/week: days keyed by date + optional month summary for mini calendar. */
export interface CalendarWeekResponse {
  days: Record<string, DayDataResponse>;
  miniSummary?: Record<string, DaySummary>;
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

// --- POST /appointments/admin-create-group ---

export interface AdminCreateGroupItemPayload {
  serviceId?: number;
  bundleId?: number;
  staffUserId: number;
}

export interface AdminCreateGroupAppointmentPayload {
  locationId: number;
  customerId?: number;
  items: AdminCreateGroupItemPayload[];
  scheduledAt: string;
  notes?: string;
  bookingSource?: AppointmentBookingSource;
  overrideConflicts?: boolean;
  allowOutOfHours?: boolean;
  overrideReason?: string;
}

// --- PUT /appointments/group/:bookingGroupId/reschedule ---

export interface RescheduleGroupPayload {
  scheduledAt: string;
  overrideConflicts?: boolean;
  allowOutOfHours?: boolean;
  overrideReason?: string;
}

// --- POST /appointments/admin-create ---

export interface AdminCreateAppointmentPayload {
  serviceId: number;
  locationId: number;
  customerId?: number;
  /** Staff to assign. When location has 0 team members use [] (location-only booking). When location has team members, must be non-empty. */
  staffUserIds?: number[];
  scheduledAt: string; // ISO 8601 date string
  notes?: string;
  bookingSource?: AppointmentBookingSource;
  overrideConflicts?: boolean;
  /** When true, backend skips working-hours validation (admin confirmed out-of-hours). */
  allowOutOfHours?: boolean;
  /** Optional reason when using override or out-of-hours (stored for audit). */
  overrideReason?: string;
}

// --- POST /calendar/available-slots ---

export interface AvailableSlotsRequest {
  locationId: number;
  date: string; // YYYY-MM-DD
  serviceId?: number;
  durationMinutes?: number;
  staffUserId?: number;
}

export interface AvailableSlotsResponse {
  availableSlots: string[]; // ISO 8601 date-time strings
}

// --- Day Filters (for calendar/day endpoint) ---

export interface CalendarDayFilters {
  staffUserId?: number;
  serviceId?: number;
  status?: string;
  clientName?: string;
}