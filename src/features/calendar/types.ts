import type {
    Appointment,
    LocationContextData,
    LocationContextBundle,
    DaySummary,
    DayDataResponse,
    CalendarDayFilters,
    SlimAppointment,
    CalendarBlockDto,
    BlockConflictOffer,
    AdminCreateGroupAppointmentPayload,
} from "../../shared/types/calendar.ts";
import type { LocationService, LocationTeamMember } from "../assignments/types.ts";
import type { EditableBooking, FixedBooking } from "./bookedItems.ts";

/** Pending drag-drop: show appointment at drop position until user confirms or update succeeds. */
export interface AppointmentBlockOverrideOffer {
    appointmentId: number;
    data: Record<string, unknown>;
    source?: 'editor';
    kind?: 'working-hours';
}

export type CustomerOverlapOffer =
    | { kind: 'create'; payload: AdminCreateGroupAppointmentPayload }
    | { kind: 'update'; appointmentId: number; data: Record<string, unknown>; source?: 'editor' };

export type PendingDrop =
    | {
        type: "reschedule";
        appointment: SlimAppointment;
        dateKey: string;
        hour: number;
        minute?: number;
        columnId: number;
    }
    | { type: "reassign"; appointment: SlimAppointment; staffId: number; staffLabel: string }
    | null;

/** Staff reassignment the editor can retry after a working-hours confirmation. */
export type ReassignmentHoursOverrideOffer = {
    appointmentId: number;
    staffUserIds: number[];
    notes?: string;
};

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
    date?: Date;
    time?: string; // "HH:mm"
    staffUserId?: number;
    serviceId?: number;
    bundleId?: number;
    customerId?: number;
    customerDisplay?: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    } | null;
    notes?: string;
    bookingSource?: string;
    appointmentCurrency?: string;
    /** The original booked items and totals used by the existing scheduling controls. */
    fixedBooking?: FixedBooking;
    editableBooking?: EditableBooking;
    /** The appointment has started: only the notes can be changed. */
    startedLock?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Calendar State
// ─────────────────────────────────────────────────────────────

export type CalendarViewState = {
    // --- Location-first design ---
    selectedLocationId: number | null;
    locationContext: LocationContextData | null;
    locationContextLoading: boolean;
    locationContextError: string | null;

    /** Per-location services, team, and bundles from GET /calendar/location-context (same request as locationContext). */
    locationServices: LocationService[];
    locationTeamMembers: LocationTeamMember[];
    /** Bundles at location (from GET /calendar/location-context when backend includes bundles). */
    locationBundles: LocationContextBundle[];

    // --- Summary data (month/week overview, keyed by "YYYY-MM-DD") ---
    summary: Record<string, DaySummary>;
    summaryLoading: boolean;
    summaryError: string | null;

    // --- Day data (full day view) ---
    dayData: DayDataResponse | null;
    dayDataLoading: boolean;
    dayDataError: string | null;

    // --- Week data (full week view, keyed by "YYYY-MM-DD") ---
    weekData: Record<string, DayDataResponse> | null;
    weekDataLoading: boolean;
    weekDataError: string | null;

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
    };
    blockFormOpen: boolean;
    /** When set, block drawer opens in edit mode for this block (create flow clears this). */
    blockFormEditingBlock: CalendarBlockDto | null;

    // --- Calendar sidebar (mobile collapse) ---
    sidebarOpen: boolean;

    // --- View controls ---
    viewType: AppointmentViewType;
    viewMode: AppointmentViewMode;

    // --- Date navigation ---
    selectedDate: Date;
    /** True until a day is picked; the first location context then swaps in the venue's today. */
    selectedDateIsStartup: boolean;

    /** When in month view, the first day of the displayed month (prev/next don't change selectedDate). */
    displayedMonthStart: Date | null;

    /** When in week view, the Monday of the displayed week (prev/next don't change selectedDate). */
    displayedWeekStart: Date | null;

    /**
     * Sidebar mini calendar month (first of month). Null until the mini calendar mounts or user navigates.
     * Used to refetch summary for the visible mini month after mutations (day/week fetch may only merge another month).
     */
    sidebarMiniCalendarMonthStart: Date | null;

    /** When an update returns 409 Conflict, offer the user to retry with override (overrideConflicts + reason). Only for non–staff conflicts; staff_appointment must not show override. */
    updateConflictOffer: AppointmentBlockOverrideOffer | null;

    customerOverlapOffer: CustomerOverlapOffer | null;

    reassignmentHoursOverrideOffer: ReassignmentHoursOverrideOffer | null;

    /** When a block create/update returns 409 because upcoming appointments fall inside it, offer "Block anyway". */
    blockConflictOffer: BlockConflictOffer | null;

    /** Pending drag-drop: card stays at drop position until confirm/cancel or update success. */
    pendingDrop: PendingDrop;

    /** Blocks created in this session, shown until next day/week fetch (optimistic UI). */
    optimisticBlocks: CalendarBlockDto[];

    /**
     * Add appointment slider: decremented on each successful update/reschedule mutation; when it hits 0, add form closes.
     * Used to avoid closing the slider before API completes.
     */
    addFormCloseAfterMutationsRemaining: number;

    /** When true, the grid should scroll to the "now" line after the next load completes. Set by "Today" button and initial load; cleared after scrolling. */
    scrollToNow: boolean;
}
