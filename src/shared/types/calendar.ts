import type { Customer } from "./customer.ts";
import type { Service } from "./service.ts";
import type { WorkingHours } from "./location.ts";

/** Customer fields stored on the appointment at booking time (JSONB snapshot). */
export interface AppointmentCustomerSnapshot {
  userId?: number;
  userUuid?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  profileImage?: string | null;
}

/** One item inside a composite (merged same-staff run) appointment. Mirrors backend. */
export interface BookingItemSnapshot {
  type: "service" | "bundle";
  serviceId?: number;
  serviceUuid?: string;
  bundleId?: number;
  bundleUuid?: string;
  name: string;
  description?: string | null;
  duration: number;
  price: number;
  startOffsetMinutes: number;
  bundleServices?: Array<{
    serviceId: number;
    serviceUuid: string;
    serviceName: string;
    duration: number;
    price: number;
  }>;
}

export interface Appointment {
  id: number,
  /** Linked user when present; null for some walk-ins / manual bookings. */
  customer: Customer | null,
  customerSnapshot?: AppointmentCustomerSnapshot | null,
  teamMembers: Array<any>,
  /** Service when appointment is for a single service; null for bundle/composite. */
  service?: Service | null,
  /** Bundle when appointment is for a bundle (service may be null). */
  bundle?: { id: number; name?: string } | null;
  /** 'service' | 'bundle' | 'composite'. Composite = merged same-staff run of items. */
  bookingType?: string | null;
  /**
   * For composite appointments (a merged same-staff run): the ordered items in the
   * run. Null for single-item service/bundle appointments (use service/bundle).
   */
  bookingItemsSnapshot?: BookingItemSnapshot[] | null;
  /** Display name from booking (e.g. service or bundle name at book time). */
  bookedItemName?: string | null;
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
  /** How the appointment was booked (admin, phone, walk_in, marketplace). */
  bookingSource?: string | null;
}

// ─────────────────────────────────────────────────────────────
// Types matching backend calendar API responses
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
  /** Per-staff price/duration overrides for add-appointment (staff → location → default). */
  staffOverrides?: Array<{ userId: number; customPrice: number | null; customDuration: number | null }>;
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
  priceType: 'sum' | 'fixed' | 'discount';
  fixedPriceAmountMinor: number | null;
  discountPercentage: number | null;
  calculatedPriceAmountMinor: number;
  calculatedDisplayPrice: number;
  serviceCount: number;
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
  /** Null when no customer was linked at booking time. */
  customerName: string | null;
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
  /** Null when no customer was linked at booking time. Use bookingSource + this to derive display label. */
  customerName: string | null;
  bookingSource: string;
  isUnassigned: boolean;
  /** Set when admin overrode working hours or conflict (for grid badge). */
  overrideReason?: string;
  /** From POST /calendar/day and /week when backend includes it. */
  notes?: string | null;
  /** Customer contact info — included when backend sends it. */
  customerPhone?: string | null;
  customerEmail?: string | null;
}

/** One display block for a single standalone appointment. */
export interface CalendarDisplayBlock {
  type: 'single';
  /** This appointment id. */
  id: number;
  /** [id]. */
  appointmentIds: number[];
  start: string;
  end: string;
  status: string;
  label: string;
  duration: number;
  staffUserIds: number[];
  /** Null when no customer was linked at booking time. */
  customerName: string | null;
  bookingSource: string;
  isUnassigned: boolean;
  overrideReason?: string;
  /** Carried from {@link SlimAppointment}. */
  notes?: string | null;
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
  /** Internal notes (from entity); included in day/week calendar payloads. */
  notes?: string | null;
  /** True when this block is a recurring series (one-time rows still false). */
  isRecurring?: boolean;
  /** Recurrence frequency (only present when isRecurring is true). */
  repeatFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  /** Days of week for recurring block (0=Sun … 6=Sat); only when isRecurring is true. */
  repeatDaysOfWeek?: number[];
  /** Inclusive end date for recurrence (YYYY-MM-DD); null means indefinite. */
  repeatEndDate?: string | null;
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
  repeatFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  repeatDaysOfWeek?: number[];
  repeatEndDate?: string;
  reason: CalendarBlockReason;
  title?: string;
  notes?: string;
}

/** Body for PUT /calendar-blocks/:id (matches admin-api UpdateCalendarBlockDto). */
export interface CalendarBlockUpdatePayload {
  startsAt?: string;
  endsAt?: string;
  isAllDay?: boolean;
  reason?: CalendarBlockReason;
  title?: string;
  notes?: string;
  isRecurring?: boolean;
  repeatFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  repeatDaysOfWeek?: number[];
  repeatEndDate?: string;
}

// --- POST /appointments/admin-create-group ---

export interface AdminCreateGroupItemPayload {
  serviceId?: number;
  bundleId?: number;
  staffUserId?: number;
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

// --- POST /calendar/available-slots ---

export interface AvailableSlotsRequest {
  locationId: number;
  date: string; // YYYY-MM-DD
  serviceId?: number;
  durationMinutes?: number;
  staffUserId?: number;
  items?: Array<{
    serviceId?: number;
    bundleId?: number;
    staffUserId?: number;
  }>;
  findNextAvailable?: boolean;
}

export interface AvailableSlotsResponse {
  availableSlots: string[]; // ISO 8601 date-time strings
  outOfHoursSlots?: string[];
  nextAvailableDate?: string | null;
}

// --- Day Filters (for calendar/day endpoint) ---

/**
 * Request body for filtered calendar endpoints. Legacy single-value `staffUserId` and `status`
 * remain accepted by the API for compatibility; the app should prefer `staffUserIds` and `statuses`.
 */
export interface CalendarDayFilters {
  staffUserId?: number;
  /** Appointments involving any of these staff. Omit or empty = all staff at location. */
  staffUserIds?: number[];
  /**
   * Product filters.
   * Prefer `serviceIds` / `bundleIds` (OR within each dimension; AND across dimensions when both non-empty).
   * Legacy `serviceId` / `bundleId` are still accepted by the API and merged server-side.
   */
  serviceIds?: number[];
  bundleIds?: number[];
  /** @deprecated Prefer `serviceIds`; still serialized when arrays are empty. */
  serviceId?: number;
  /** @deprecated Prefer `bundleIds`; still serialized when arrays are empty. */
  bundleId?: number;
  status?: string;
  statuses?: string[];
  bookingSources?: AppointmentBookingSource[];
  clientName?: string;
  customerId?: number;
  customerEmail?: string;
  customerPhone?: string;
  customerFullName?: string;
  /** Only appointments with no assigned staff (exclusive with staffUserIds on API). */
  unassignedOnly?: boolean;
  /** Service category IDs (appointments whose service belongs to any of these categories). Omit or empty = all. */
  categoryIds?: number[];
}