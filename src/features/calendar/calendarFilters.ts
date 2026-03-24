import type { CalendarDayFilters } from "../../shared/types/calendar.ts";

const hasItems = (arr?: readonly unknown[] | null): boolean => (arr?.length ?? 0) > 0;

/**
 * Whether the user has applied any calendar list filter (sidebar + staff column selection).
 * Keep in sync with {@link serializeCalendarDayFilters} field set.
 */
export function areCalendarFiltersActive(
    dayFilters: CalendarDayFilters,
    staffFilter: number[],
): boolean {
    return (
        hasItems(dayFilters.staffUserIds) ||
        hasItems(staffFilter) ||
        dayFilters.serviceId != null ||
        dayFilters.bundleId != null ||
        hasItems(dayFilters.statuses) ||
        Boolean(dayFilters.status) ||
        hasItems(dayFilters.bookingSources) ||
        dayFilters.unassignedOnly === true ||
        dayFilters.customerId != null ||
        Boolean((dayFilters.clientName ?? "").trim())
    );
}

const SCALAR_FILTER_KEYS: (keyof CalendarDayFilters)[] = [
    "staffUserId",
    "serviceId",
    "bundleId",
    "status",
    "clientName",
    "customerId",
    "customerEmail",
    "customerPhone",
    "customerFullName",
];

/** Body fragment for POST /calendar/summary | /day | /week — omit undefined, empty arrays, and false unassigned. */
export function serializeCalendarDayFilters(filters?: CalendarDayFilters): Record<string, unknown> {
    if (!filters) return {};
    const out: Record<string, unknown> = {};

    for (const key of SCALAR_FILTER_KEYS) {
        const v = filters[key];
        if (v === undefined || v === null) continue;
        if (key === "clientName" && typeof v === "string" && !v.trim()) continue;
        out[key] = v;
    }

    if (filters.staffUserIds?.length) {
        out.staffUserIds = filters.staffUserIds;
    }
    if (filters.statuses?.length) {
        out.statuses = filters.statuses;
    }
    if (filters.bookingSources?.length) {
        out.bookingSources = filters.bookingSources;
    }
    if (filters.unassignedOnly === true) {
        out.unassignedOnly = true;
    }
    return out;
}
