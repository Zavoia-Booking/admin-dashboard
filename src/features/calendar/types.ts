import type {
    Appointment,
    LocationContextData,
    LocationContextBundle,
    DaySummary,
    DayDataResponse,
    CalendarDayFilters,
    SlimAppointment,
    CalendarBlockDto,
} from "../../shared/types/calendar.ts";
import type { LocationService, LocationTeamMember } from "../assignments/types.ts";

/** One segment in a group drop preview (ghost position per segment). */
export type PendingDropSegmentPreview = {
    id: number;
    startIso: string;
    endIso: string;
    staffUserIds: number[];
};

/** Pending drag-drop: show appointment at drop position until user confirms or update succeeds. */
export type PendingDrop =
    | {
        type: "reschedule";
        appointment: SlimAppointment;
        dateKey: string;
        hour: number;
        minute?: number;
        columnId: number;
        /** When true: moving a group; scheduledAt for API = newGroupStartIso (first segment start). */
        isGroupDrop?: boolean;
        bookingGroupId?: string;
        newGroupStartIso?: string;
        segmentsPreview?: PendingDropSegmentPreview[];
    }
    | { type: "reassign"; appointment: SlimAppointment; staffId: number; staffLabel: string }
    | null;

// ─────────────────────────────────────────────────────────────
// View Enums
// ─────────────────────────────────────────────────────────────

export enum AppointmentViewMode {
    WEEK = 'WEEK',
    MONTH = 'MONTH',
    DAY = 'DAY',
}

export enum AppointmentViewType {
    LIST = 'LIST',
    GRID = 'GRID',
}

// ─────────────────────────────────────────────────────────────
// Add Form Prefill (click-to-create)
// ─────────────────────────────────────────────────────────────

export type AddFormPrefill = {
    appointmentId?: number;
    bookingGroupId?: string;
    date?: Date;
    time?: string; // "HH:mm"
    staffUserId?: number;
    serviceId?: number;
    bundleId?: number;
    /** Full group items when rescheduling a multi-segment booking group; order preserved. */
    groupItems?: Array<{ serviceId?: number; bundleId?: number; staffUserId?: number; itemName?: string }>;
    customerId?: number;
    customerDisplay?: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    } | null;
    notes?: string;
    bookingSource?: string;
}

// ─────────────────────────────────────────────────────────────
// Calendar State
// ─────────────────────────────────────────────────────────────

export type CalendarViewState = {
    // --- Location-first design ---
    selectedLocationId: number | null;
    locationContext: LocationContextData | null;
    locationContextLoading: boolean;

    /** Per-location services and team from GET /assignments/locations/:id/full (fetched once when location is selected). */
    locationAssignmentLoading: boolean;
    locationServices: LocationService[];
    locationTeamMembers: LocationTeamMember[];
    /** Bundles at location (from GET /calendar/location-context when backend includes bundles). */
    locationBundles: LocationContextBundle[];

    // --- Summary data (month/week overview, keyed by "YYYY-MM-DD") ---
    summary: Record<string, DaySummary>;
    summaryLoading: boolean;

    // --- Day data (full day view) ---
    dayData: DayDataResponse | null;
    dayDataLoading: boolean;

    // --- Week data (full week view, keyed by "YYYY-MM-DD") ---
    weekData: Record<string, DayDataResponse> | null;
    weekDataLoading: boolean;

    // --- Day filters (for the calendar/day endpoint) ---
    dayFilters: CalendarDayFilters;

    // --- Staff filter (for sidebar toggle list — array of visible staff IDs, empty = all) ---
    staffFilter: number[];

    // --- Selected appointment detail ---
    selectedAppointment: Appointment | null;
    selectedAppointmentLoading: boolean;

    // --- UI drawers / forms ---
    addFormOpen: boolean;
    addFormPrefill: AddFormPrefill | null;
    editForm: {
        open: boolean;
        item: Appointment | null;
        groupAppointments?: Appointment[] | null;
    };
    blockFormOpen: boolean;

    // --- Calendar sidebar (mobile collapse) ---
    sidebarOpen: boolean;

    // --- View controls ---
    viewType: AppointmentViewType;
    viewMode: AppointmentViewMode;

    // --- Date navigation ---
    selectedDate: Date;

    /** When in month view, the first day of the displayed month (prev/next don't change selectedDate). */
    displayedMonthStart: Date | null;

    /** When in week view, the Monday of the displayed week (prev/next don't change selectedDate). */
    displayedWeekStart: Date | null;

    /** When an update returns 409 Conflict, offer the user to retry with override (overrideConflicts + reason). Only for non–staff conflicts; staff_appointment must not show override. */
    updateConflictOffer: { appointmentId: number; data: Record<string, unknown>; message: string; conflictType?: 'staff_appointment' | 'block'; bookingGroupId?: string } | null;

    /** Pending drag-drop: card stays at drop position until confirm/cancel or update success. */
    pendingDrop: PendingDrop;

    /** Blocks created in this session, shown until next day/week fetch (optimistic UI). */
    optimisticBlocks: CalendarBlockDto[];
}