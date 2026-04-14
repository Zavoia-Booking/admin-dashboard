import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { SlimAppointment, CalendarBlockDto } from "../../../shared/types/calendar";
import {
  getWeekData,
  getWeekDataLoading,
  getCalendarTimezone,
  getOptimisticBlocks,
  blockOverlapsDate,
} from "../selectors";
import { formatDateInTimezone } from "../timezone";
import {
  useDayListFromRaw,
  type UseDayAppointmentListResult,
} from "./useDayAppointmentList";

/**
 * Week-mode equivalent of `useDayAppointmentList`: returns the selected day's
 * appointments + blocks picked out of `weekData[dateKey]`, merged with any
 * optimistic blocks that overlap the date. Mirrors desktop
 * `WeekAppointmentList`'s per-day derivation exactly, then hands the raw data
 * off to the shared {@link useDayListFromRaw} so filter/sort/color logic
 * cannot drift.
 */
export function useWeekDayFromWeekData(date: Date): UseDayAppointmentListResult {
  const weekData = useSelector(getWeekData);
  const isLoading = useSelector(getWeekDataLoading);
  const timezone = useSelector(getCalendarTimezone);
  const optimisticBlocks = useSelector(getOptimisticBlocks);

  const dateKey = formatDateInTimezone(date, timezone);

  const rawAppointments: SlimAppointment[] = useMemo(
    () => weekData?.[dateKey]?.appointments ?? [],
    [weekData, dateKey],
  );

  const dayBlocks: CalendarBlockDto[] = useMemo(() => {
    const serverBlocks = weekData?.[dateKey]?.blocks ?? [];
    const tz = timezone ?? "";
    return [
      ...serverBlocks,
      ...optimisticBlocks.filter((b) => blockOverlapsDate(b, dateKey, tz)),
    ];
  }, [weekData, dateKey, optimisticBlocks, timezone]);

  return useDayListFromRaw(rawAppointments, dayBlocks, isLoading);
}
