import type { CalendarDayFilters } from "../../shared/types/calendar.ts";
import { calendarPreferences } from "./calendarPreferences.ts";

const hasItems = (arr?: readonly unknown[] | null): boolean => (arr?.length ?? 0) > 0;

/**
 * Strips `unassignedOnly` from in-memory filter state. The calendar UI no longer sets it;
 * omitting the key matches the API (optional DTO field; backend applies it only when truthy).
 */
export function dayFiltersWithoutUnassignedOnly(filters: CalendarDayFilters): CalendarDayFilters {
    const { unassignedOnly: _removed, ...rest } = filters;
    return rest;
}

/**
 * True when staff narrowing is "real" (not merely the lone member at a single-staff location).
 * Pass `locationStaffIds` from `getLocationStaff().map((s) => s.id)` when available.
 */
export function isStaffNarrowingActive(
    dayFilters: CalendarDayFilters,
    staffFilter: number[],
    locationStaffIds?: readonly number[],
): boolean {
    if (hasItems(dayFilters.staffUserIds)) {
        if (locationStaffIds?.length === 1) {
            const only = locationStaffIds[0];
            const ids = dayFilters.staffUserIds!;
            if (ids.length === 1 && ids[0] === only) return false;
        }
        return true;
    }
    if (dayFilters.staffUserId != null) {
        if (locationStaffIds?.length === 1 && dayFilters.staffUserId === locationStaffIds[0]) {
            return false;
        }
        return true;
    }
    if (!hasItems(staffFilter)) return false;
    if (
        locationStaffIds?.length === 1 &&
        staffFilter.length === 1 &&
        staffFilter[0] === locationStaffIds[0]
    ) {
        return false;
    }
    return true;
}

/**
 * Whether the user has applied any calendar list filter (sidebar + staff column selection).
 * Keep in sync with {@link serializeCalendarDayFilters} field set.
 */
export function areCalendarFiltersActive(
    dayFilters: CalendarDayFilters,
    staffFilter: number[],
    locationStaffIds?: readonly number[],
): boolean {
    const unassignedCountsAsFilter =
        dayFilters.unassignedOnly === true && (locationStaffIds?.length ?? 0) > 0;
    const hasServiceProductFilter =
        hasItems(dayFilters.serviceIds) || dayFilters.serviceId != null;
    const hasBundleProductFilter =
        hasItems(dayFilters.bundleIds) || dayFilters.bundleId != null;
    return (
        unassignedCountsAsFilter ||
        isStaffNarrowingActive(dayFilters, staffFilter, locationStaffIds) ||
        hasServiceProductFilter ||
        hasBundleProductFilter ||
        hasItems(dayFilters.statuses) ||
        Boolean(dayFilters.status) ||
        hasItems(dayFilters.bookingSources) ||
        dayFilters.customerId != null ||
        Boolean((dayFilters.clientName ?? "").trim()) ||
        hasItems(dayFilters.categoryIds)
    );
}

/**
 * Number of distinct filter dimensions active (for header badge). Matches the OR-clauses in
 * {@link areCalendarFiltersActive} without double-counting staff (sidebar + API ids).
 */
export function countActiveCalendarFilters(
    dayFilters: CalendarDayFilters,
    staffFilter: number[],
    locationStaffIds?: readonly number[],
): number {
    let n = 0;
    if (isStaffNarrowingActive(dayFilters, staffFilter, locationStaffIds)) n += 1;
    if (dayFilters.unassignedOnly === true && (locationStaffIds?.length ?? 0) > 0) n += 1;
    if (hasItems(dayFilters.serviceIds) || dayFilters.serviceId != null) n += 1;
    if (hasItems(dayFilters.bundleIds) || dayFilters.bundleId != null) n += 1;
    if (hasItems(dayFilters.statuses) || Boolean(dayFilters.status)) n += 1;
    if (hasItems(dayFilters.bookingSources)) n += 1;
    // customerId / clientName excluded — customer search is a separate control
    // (sidebar picker on desktop, search overlay on mobile), not part of header filters.
    if (hasItems(dayFilters.categoryIds)) n += 1;
    return n;
}

/** Keys compared for "draft unchanged" in the header filters popover (staff compared via `staffIds` args).
 * Service/bundle dimensions use {@link mergedFilterIdKey} in {@link areCalendarHeaderFilterDraftsEqual} (arrays + legacy scalars).
 */
const HEADER_DRAFT_DAY_KEYS: (keyof CalendarDayFilters)[] = [
    "status",
    "statuses",
    "bookingSources",
    "clientName",
    "customerId",
    "customerEmail",
    "customerPhone",
    "customerFullName",
    "categoryIds",
];

function sortedNumberIds(ids: readonly number[]): string {
    return [...ids].sort((a, b) => a - b).join("\0");
}

/** Effective service/bundle ID sets for draft comparison (legacy scalars + arrays). */
function mergedFilterIdKey(
    ids: readonly number[] | undefined,
    legacy: number | undefined,
): string {
    const set = new Set<number>();
    for (const id of ids ?? []) {
        const n = Number(id);
        if (Number.isFinite(n)) set.add(n);
    }
    if (legacy != null) {
        const n = Number(legacy);
        if (Number.isFinite(n)) set.add(n);
    }
    return sortedNumberIds([...set]);
}

function headerDraftFieldEqual(
    key: keyof CalendarDayFilters,
    a: CalendarDayFilters,
    b: CalendarDayFilters,
): boolean {
    const va = a[key];
    const vb = b[key];
    if (va === vb) return true;
    if (va == null && vb == null) return true;
    if (key === "statuses") {
        const aa = Array.isArray(va) ? [...(va as string[])].sort().join("\0") : "";
        const bb = Array.isArray(vb) ? [...(vb as string[])].sort().join("\0") : "";
        return aa === bb;
    }
    if (key === "bookingSources") {
        const aa = Array.isArray(va) ? [...(va as string[])].sort().join("\0") : "";
        const bb = Array.isArray(vb) ? [...(vb as string[])].sort().join("\0") : "";
        return aa === bb;
    }
    if (key === "clientName") {
        return String(va ?? "").trim() === String(vb ?? "").trim();
    }
    if (key === "categoryIds") {
        const aa = Array.isArray(va) ? sortedNumberIds(va as number[]) : "";
        const bb = Array.isArray(vb) ? sortedNumberIds(vb as number[]) : "";
        return aa === bb;
    }
    return va === vb;
}

/**
 * True when the header filters draft matches the snapshot taken when the menu opened
 * (staff via `staffIds`; day filters compared without `staffUserId` / `staffUserIds`).
 */
export function areCalendarHeaderFilterDraftsEqual(
    dayA: CalendarDayFilters,
    staffIdsA: number[],
    dayB: CalendarDayFilters,
    staffIdsB: number[],
): boolean {
    if (sortedNumberIds(staffIdsA) !== sortedNumberIds(staffIdsB)) return false;
    if (
        mergedFilterIdKey(dayA.serviceIds, dayA.serviceId) !==
        mergedFilterIdKey(dayB.serviceIds, dayB.serviceId)
    ) {
        return false;
    }
    if (
        mergedFilterIdKey(dayA.bundleIds, dayA.bundleId) !==
        mergedFilterIdKey(dayB.bundleIds, dayB.bundleId)
    ) {
        return false;
    }
    for (const key of HEADER_DRAFT_DAY_KEYS) {
        if (!headerDraftFieldEqual(key, dayA, dayB)) return false;
    }
    return true;
}

const SCALAR_FILTER_KEYS: (keyof CalendarDayFilters)[] = [
    "staffUserId",
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
    } else if (calendarPreferences.getShowCancelled()) {
        out.statuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
    }
    if (filters.bookingSources?.length) {
        out.bookingSources = filters.bookingSources;
    }
    if (filters.unassignedOnly === true) {
        out.unassignedOnly = true;
    }
    if (filters.categoryIds?.length) {
        out.categoryIds = filters.categoryIds;
    }
    if (filters.serviceIds?.length) {
        out.serviceIds = filters.serviceIds;
    } else if (filters.serviceId != null) {
        out.serviceId = filters.serviceId;
    }
    if (filters.bundleIds?.length) {
        out.bundleIds = filters.bundleIds;
    } else if (filters.bundleId != null) {
        out.bundleId = filters.bundleId;
    }
    return out;
}
