import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { SlimAppointment, CalendarBlockDto } from "../../../shared/types/calendar";
import {
  getDayAppointments,
  getDayBlocks,
  getDayDataLoading,
  getLocationStaff,
  getLocationServices,
  getEffectiveStaffFilterIds,
  getHasActiveCalendarFilters,
  getCalendarTimezone,
} from "../selectors";
import { buildCalendarColorMap } from "../colors";
import { calendarPreferences } from "../calendarPreferences";

export type DayListItem =
  | { type: "appointment"; data: SlimAppointment; groupSize?: number }
  | { type: "block"; data: CalendarBlockDto };

export interface UseDayAppointmentListResult {
  sortedItems: DayListItem[];
  appointmentColorMap: ReturnType<typeof buildCalendarColorMap>;
  locationStaff: ReturnType<typeof getLocationStaff>;
  timezone: ReturnType<typeof getCalendarTimezone>;
  isDayLoading: boolean;
  hasActiveFilters: boolean;
  apptCount: number;
  blockCount: number;
}

/**
 * Shared derivation used by all day-list consumers (desktop `AppointmentList`,
 * mobile `MobileDayListView`, mobile `MobileWeekView` via `useWeekDayFromWeekData`,
 * mobile `MobileMonthView` via its local fetch). Given raw appointments +
 * blocks, applies the staff filter, builds the color map, and returns the
 * merged sorted list.
 *
 * Pure lift-and-shift of the original desktop logic — do not tweak behavior
 * here; desktop is the source of truth and has been tested in production.
 */
export function useDayListFromRaw(
  rawAppointments: SlimAppointment[],
  rawBlocks: CalendarBlockDto[],
  isDayLoading: boolean,
): UseDayAppointmentListResult {
  const locationStaff = useSelector(getLocationStaff);
  const locationServices = useSelector(getLocationServices);
  const staffFilter = useSelector(getEffectiveStaffFilterIds);
  const hasActiveFilters = useSelector(getHasActiveCalendarFilters);
  const timezone = useSelector(getCalendarTimezone);

  /** Fallback when API omits groupSize (legacy). Prefer `SlimAppointment.groupSize` from POST /calendar/day. */
  const groupSizeMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of rawAppointments) {
      if (a.bookingGroupId) {
        map.set(a.bookingGroupId, (map.get(a.bookingGroupId) ?? 0) + 1);
      }
    }
    return map;
  }, [rawAppointments]);

  const visibleDayAppointments = useMemo(
    () =>
      staffFilter.length > 0
        ? rawAppointments.filter((a) => {
            if (a.isUnassigned || a.staffUserIds.length === 0) return false;
            return a.staffUserIds.some((id) => staffFilter.includes(id));
          })
        : rawAppointments,
    [rawAppointments, staffFilter],
  );

  const colorCodingPref = calendarPreferences.getColorCoding();
  const listKnownColorKeys = useMemo(() => {
    if (colorCodingPref === "staff")
      return staffFilter.length > 0 ? staffFilter : locationStaff.map((s) => s.id);
    if (colorCodingPref === "service") return locationServices.map((s) => s.serviceName);
    return undefined;
  }, [colorCodingPref, staffFilter, locationStaff, locationServices]);
  const appointmentColorMap = useMemo(
    () => buildCalendarColorMap(visibleDayAppointments, colorCodingPref, listKnownColorKeys),
    [visibleDayAppointments, colorCodingPref, listKnownColorKeys],
  );

  const sortedItems = useMemo((): DayListItem[] => {
    const apptItems: DayListItem[] = visibleDayAppointments.map((a) => ({
      type: "appointment",
      data: a,
      groupSize: a.bookingGroupId
        ? (a.groupSize ?? groupSizeMap.get(a.bookingGroupId))
        : undefined,
    }));

    const blockItems: DayListItem[] = rawBlocks.map((b) => ({ type: "block", data: b }));

    return [...apptItems, ...blockItems].sort((x, y) => {
      const xStart = x.type === "appointment" ? x.data.scheduledAt : x.data.startsAt;
      const yStart = y.type === "appointment" ? y.data.scheduledAt : y.data.startsAt;
      return new Date(xStart).getTime() - new Date(yStart).getTime();
    });
  }, [visibleDayAppointments, rawBlocks, groupSizeMap]);

  const apptCount = sortedItems.filter((i) => i.type === "appointment").length;
  const blockCount = sortedItems.filter((i) => i.type === "block").length;

  return {
    sortedItems,
    appointmentColorMap,
    locationStaff,
    timezone,
    isDayLoading,
    hasActiveFilters,
    apptCount,
    blockCount,
  };
}

/**
 * DAY-mode wrapper: reads the current day's appointments + blocks out of
 * Redux and pipes them through {@link useDayListFromRaw}. Used by both
 * desktop `AppointmentList` and mobile `MobileDayListView`.
 */
export function useDayAppointmentList(): UseDayAppointmentListResult {
  const dayAppointments = useSelector(getDayAppointments);
  const dayBlocks = useSelector(getDayBlocks);
  const isDayLoading = useSelector(getDayDataLoading);
  return useDayListFromRaw(dayAppointments, dayBlocks, isDayLoading);
}
