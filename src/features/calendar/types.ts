import type {
    Appointment,
    LocationContextData,
    DaySummary,
    DayDataResponse,
    CalendarDayFilters,
} from "../../shared/types/calendar.ts";

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
// Filters
// ─────────────────────────────────────────────────────────────

/**
 * Legacy filter type – kept for backward compatibility with existing
 * components during migration. Will be removed once all views are
 * migrated to the new calendar flow.
 */
export type CalendarFilters = {
    location: string,
    teamMember: string,
    service: string,
    status: string,
    clientName: string,
    email: string,
    phoneNumber: string,
    startDate: Date,
    endDate: Date,
    selectedDate: Date,
}

// ─────────────────────────────────────────────────────────────
// Calendar State
// ─────────────────────────────────────────────────────────────

export type CalendarViewState = {
    // --- Location-first design ---
    selectedLocationId: number | null;
    locationContext: LocationContextData | null;
    locationContextLoading: boolean;

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
    editForm: {
        open: boolean;
        item: Appointment | null;
    };
    blockFormOpen: boolean;

    // --- Calendar sidebar (mobile collapse) ---
    sidebarOpen: boolean;

    // --- View controls ---
    viewType: AppointmentViewType;
    viewMode: AppointmentViewMode;

    // --- Date navigation ---
    selectedDate: Date;

    // --- Legacy (kept during migration, will be removed) ---
    appointments: Array<Appointment>;
    filters: CalendarFilters;
}