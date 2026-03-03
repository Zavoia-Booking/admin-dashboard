import { createSelector } from "@reduxjs/toolkit";
import { getCalendarViewStateSelector } from "../../app/providers/selectors.ts";
import { AppointmentViewMode, type CalendarViewState } from "./types.ts";
import { getWeekStart, toLocalDateString } from "./utils.ts";
import type { CalendarBlockDto, SlimAppointment, CalendarDisplayBlock } from "../../shared/types/calendar.ts";
import { getCurrentBusinessSelector } from "../business/selectors.ts";

/** True if block's time range overlaps the given date (YYYY-MM-DD). */
export function blockOverlapsDate(block: CalendarBlockDto, dateKey: string): boolean {
    const [y, m, d] = dateKey.split("-").map(Number);
    const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
    const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
    const blockStart = new Date(block.startsAt).getTime();
    const blockEnd = new Date(block.endsAt).getTime();
    return blockStart < dayEnd && blockEnd > dayStart;
}

// ─────────────────────────────────────────────────────────────
// UI state selectors
// ─────────────────────────────────────────────────────────────

export const getAddFormSelector = createSelector(getCalendarViewStateSelector, (state) => {
    return state.addFormOpen
})

export const getAddFormPrefill = createSelector(getCalendarViewStateSelector, (state) => {
    return state.addFormPrefill
})

export const getEditFormSelector = createSelector(getCalendarViewStateSelector, (state) => {
    return state.editForm;
})

export const getViewTypeSelector = createSelector(getCalendarViewStateSelector, (state) => {
    return state.viewType;
})

export const getViewModeSelector = createSelector(getCalendarViewStateSelector, (state) => {
    return state.viewMode;
})

// ─────────────────────────────────────────────────────────────
// Location-first calendar selectors
// ─────────────────────────────────────────────────────────────

/** Currently selected location ID */
export const getSelectedLocationId = createSelector(getCalendarViewStateSelector, (state) => {
    return state.selectedLocationId;
})

/** Location context (working hours, staff, booking settings) */
export const getLocationContext = createSelector(getCalendarViewStateSelector, (state) => {
    return state.locationContext;
})

/** Calendar timezone source of truth: location timezone first, then business timezone. */
export const getCalendarTimezone = createSelector(
    getCurrentBusinessSelector,
    getLocationContext,
    (business, context) => {
        const businessTz = business?.timezone?.trim();
        const locationTz = context?.location?.timezone?.trim();
        return locationTz || businessTz || 'UTC';
    }
);

export const getLocationContextLoading = createSelector(getCalendarViewStateSelector, (state) => {
    return state.locationContextLoading;
})

/** Staff members assigned to the selected location */
export const getLocationStaff = createSelector(getLocationContext, (context) => {
    return context?.staff ?? [];
})

/** True when the selected location has at least one team member (for location-only vs team-based availability). */
export const getHasTeamMembersAtLocation = createSelector(getLocationContext, (context) => {
    return (context?.staff?.length ?? 0) > 0;
})

/** Working hours for the selected location */
export const getLocationWorkingHours = createSelector(getLocationContext, (context) => {
    return context?.location.workingHours ?? null;
})

/** Whether the location is open 24/7 */
export const getLocationOpen247 = createSelector(getLocationContext, (context) => {
    return context?.location.open247 ?? false;
})

/** Booking settings for the business */
export const getBookingSettings = createSelector(getLocationContext, (context) => {
    return context?.bookingSettings ?? null;
})

/** Location assignment (services + team) loading — from GET /assignments/locations/:id/full */
export const getLocationAssignmentLoading = createSelector(getCalendarViewStateSelector, (state) => {
    return state.locationAssignmentLoading ?? false;
})

/** Services enabled at the selected location (from assignments full). */
export const getLocationServices = createSelector(getCalendarViewStateSelector, (state) => {
    return state.locationServices ?? [];
})

/** Team members assigned to the selected location (from assignments full). */
export const getLocationTeamMembers = createSelector(getCalendarViewStateSelector, (state) => {
    return state.locationTeamMembers ?? [];
})

/** Bundles enabled at the selected location (from GET /calendar/location-context). */
export const getLocationBundles = createSelector(getCalendarViewStateSelector, (state) => {
    return state.locationBundles ?? [];
})

/** Calendar summary data (keyed by "YYYY-MM-DD") */
export const getCalendarSummary = createSelector(getCalendarViewStateSelector, (state) => {
    return state.summary;
})

export const getSummaryLoading = createSelector(getCalendarViewStateSelector, (state) => {
    return state.summaryLoading;
})

/** Day data (appointments + blocks for the selected day) */
export const getDayData = createSelector(getCalendarViewStateSelector, (state) => {
    return state.dayData;
})

export const getDayDataLoading = createSelector(getCalendarViewStateSelector, (state) => {
    return state.dayDataLoading;
})

/** The selected date for navigation */
export const getSelectedDate = createSelector(getCalendarViewStateSelector, (state) => {
    return state.selectedDate;
})

/** Day-level appointments from the day data response */
export const getDayAppointments = createSelector(getDayData, (dayData) => {
    return dayData?.appointments ?? [];
})

/**
 * Convert raw appointments to display blocks.
 * Single appointments (or group of size 1): one block type 'single'.
 * Groups (same bookingGroupId, length > 1): one block per segment type 'group_segment', each in correct staff column and time window.
 */
export function appointmentsToDisplayBlocks(appointments: SlimAppointment[]): CalendarDisplayBlock[] {
    if (!appointments?.length) return [];
    const byGroup = new Map<string | null, SlimAppointment[]>();
    for (const a of appointments) {
        const key = a.bookingGroupId ?? null;
        if (!byGroup.has(key)) byGroup.set(key, []);
        byGroup.get(key)!.push(a);
    }
    const blocks: CalendarDisplayBlock[] = [];
    for (const [, group] of byGroup) {
        if (group.length === 0) continue;
        if (group.length === 1) {
            const a = group[0];
            blocks.push({
                type: 'single',
                id: a.id,
                appointmentIds: [a.id],
                start: a.scheduledAt,
                end: a.endsAt,
                status: a.status,
                label: a.bookedItemName,
                duration: a.duration,
                staffUserIds: a.staffUserIds || [],
                customerName: a.customerName,
                bookingSource: a.bookingSource,
                isUnassigned: a.isUnassigned,
                overrideReason: a.overrideReason,
                bookingGroupId: a.bookingGroupId ?? undefined,
            });
        } else {
            const sorted = [...group].sort((a, b) => (a.bookingGroupOrder ?? 0) - (b.bookingGroupOrder ?? 0));
            const groupSize = sorted.length;
            for (let i = 0; i < sorted.length; i++) {
                const a = sorted[i];
                blocks.push({
                    type: 'group_segment',
                    id: a.id,
                    appointmentIds: [a.id],
                    start: a.scheduledAt,
                    end: a.endsAt,
                    status: a.status,
                    label: a.bookedItemName,
                    duration: a.duration,
                    staffUserIds: a.staffUserIds || [],
                    customerName: a.customerName,
                    bookingSource: a.bookingSource,
                    isUnassigned: a.isUnassigned,
                    overrideReason: a.overrideReason,
                    bookingGroupId: a.bookingGroupId ?? undefined,
                    bookingGroupOrder: a.bookingGroupOrder ?? i + 1,
                    groupSize,
                });
            }
        }
    }
    return blocks.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/** Day appointments grouped for display (uses appointmentsToDisplayBlocks). */
export const getDayDisplayBlocks = createSelector(getDayAppointments, (appointments: SlimAppointment[]): CalendarDisplayBlock[] => {
    return appointmentsToDisplayBlocks(appointments ?? []);
})

/** Optimistic blocks (created this session, cleared on next day/week fetch). */
export const getOptimisticBlocks = createSelector(getCalendarViewStateSelector, (state) => {
    return state.optimisticBlocks ?? [];
});

/** Day-level blocks (server data + optimistic blocks overlapping the selected date). */
export const getDayBlocks = createSelector(
    getDayData,
    getSelectedDate,
    getOptimisticBlocks,
    (dayData, selectedDate, optimisticBlocks) => {
        const key = toLocalDateString(selectedDate);
        const server = dayData?.blocks ?? [];
        const forDay = optimisticBlocks.filter((b) => blockOverlapsDate(b, key));
        return [...server, ...forDay];
    }
);

/** Blocks for a specific date key (for week view). Use with useSelector(state => getBlocksForDateKey(state, dateKey)). */
export function getBlocksForDateKey(state: unknown, dateKey: string): CalendarBlockDto[] {
    const cal = getCalendarViewStateSelector(state as any);
    const selectedKey = toLocalDateString(cal.selectedDate);
    const serverBlocks = (dateKey === selectedKey ? cal.dayData?.blocks : cal.weekData?.[dateKey]?.blocks) ?? [];
    const forDay = (cal.optimisticBlocks ?? []).filter((b) => blockOverlapsDate(b, dateKey));
    return [...serverBlocks, ...forDay];
}

/** Active day filters */
export const getDayFilters = createSelector(getCalendarViewStateSelector, (state) => {
    return state.dayFilters;
})

/** First day of the displayed month (month view only). When null, month view uses selectedDate's month. */
export const getDisplayedMonthStart = createSelector(getCalendarViewStateSelector, (state) => {
    return state.displayedMonthStart;
})

/** Monday of the displayed week (week view only). When null, week view uses selectedDate's week. */
export const getDisplayedWeekStart = createSelector(getCalendarViewStateSelector, (state) => {
    return state.displayedWeekStart;
})

/** For month view grid/fetch: first day of the month to display. */
export const getMonthViewDisplayStart = createSelector(
    getCalendarViewStateSelector,
    getViewModeSelector,
    getSelectedDate,
    (state, viewMode, selectedDate) => {
        if (viewMode !== AppointmentViewMode.MONTH) return null;
        const d = state.displayedMonthStart;
        if (d) return d;
        return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    }
)

/** For week view grid/fetch: Monday of the displayed week. */
export const getWeekViewDisplayStart = createSelector(
    getCalendarViewStateSelector,
    getViewModeSelector,
    getSelectedDate,
    (state, viewMode, selectedDate) => {
        if (viewMode !== AppointmentViewMode.WEEK) return null;
        const d = state.displayedWeekStart;
        if (d) return d;
        return getWeekStart(selectedDate);
    }
)

/** The selected appointment (for detail drawer) */
export const getSelectedAppointment = createSelector(getCalendarViewStateSelector, (state) => {
    return state.selectedAppointment;
})

export const getSelectedAppointmentLoading = createSelector(getCalendarViewStateSelector, (state) => {
    return state.selectedAppointmentLoading;
})

/** Block form drawer open state */
export const getBlockFormOpen = createSelector(getCalendarViewStateSelector, (state) => {
    return state.blockFormOpen;
})

// ─────────────────────────────────────────────────────────────
// New selectors: Week data, sidebar, staff filter
// ─────────────────────────────────────────────────────────────

/** Full week data (keyed by "YYYY-MM-DD") */
export const getWeekData = createSelector(getCalendarViewStateSelector, (state) => {
    return state.weekData;
})

export const getWeekDataLoading = createSelector(getCalendarViewStateSelector, (state) => {
    return state.weekDataLoading;
})

/** Calendar sidebar open state (for mobile) */
export const getSidebarOpen = createSelector(getCalendarViewStateSelector, (state) => {
    return state.sidebarOpen;
})

/** Staff filter — array of visible staff IDs (empty = all) */
export const getStaffFilter = createSelector(getCalendarViewStateSelector, (state) => {
    return state.staffFilter;
})

/** Pending 409 conflict offer (retry update with override). */
export const getUpdateConflictOffer = createSelector(
    getCalendarViewStateSelector,
    (state: CalendarViewState): CalendarViewState['updateConflictOffer'] => state.updateConflictOffer,
)

export const getPendingDrop = createSelector(getCalendarViewStateSelector, (state) => {
    return state.pendingDrop;
})
