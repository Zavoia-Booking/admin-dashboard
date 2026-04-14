import { useSelector } from "react-redux";
import {
  getSelectedDate,
  getLocationWorkingHours,
  getLocationOpen247,
  getBookingSettings,
  getCalendarTimezone,
} from "../selectors";
import {
  getWorkingHoursForDate,
  getDayOpenCloseHours,
  getSlotStartsInRange,
} from "../workingHours";
import { getMinutesInTimezone, formatDateInTimezone } from "../timezone";
import { calendarPreferences } from "../calendarPreferences";
import { useNowTick } from "../components/timeGrid/useNowTick";
import {
  GRID_HEIGHT_PER_HOUR,
  HOUR_HEIGHT,
  formatNowLabel,
  type GridSlot,
} from "../components/timeGrid/constants";

export interface UseDayTimelineDataOptions {
  /** Override the per-hour pixel height. Defaults to desktop's `GRID_HEIGHT_PER_HOUR`. */
  hourHeight?: number;
  /** Header offset in px added before the first slot (desktop grid has an h-8 header). */
  headerOffset?: number;
}

export interface UseDayTimelineDataResult {
  dateKey: string;
  calendarTimezone: string | null;
  /** Resolved working hours for the selected date (respects open247). */
  dayWorkingHours: ReturnType<typeof getWorkingHoursForDate>;
  isOpen: boolean;
  isToday: boolean;
  /** Open/close hours clamped to the working-hours window (with fallback bounds 6-22). */
  openHour: number;
  closeHour: number;
  /** Slot configuration (minutes of day for each slot start). */
  slotIntervalMinutes: number;
  daySlotMinutes: number[];
  dayGridSlotStarts: GridSlot[];
  dayGridStartMinutes: number;
  daySlotHeight: number;
  hourHeight: number;
  /** Now-line positioning relative to the top of the grid. */
  nowMinutes: number;
  nowGutterTop: number;
  nowLabel: string;
  is24h: boolean;
}

/**
 * Shared data layer for a day timeline (slot grid + now line + working hours).
 * Consumed by mobile `MobileDayTimeline` and mirrors the exact derivation
 * desktop `DayGrid` performs inline. Do NOT add behavior here; the desktop
 * derivation is the source of truth and has been tested in production.
 *
 * Desktop continues to compute these values inline inside `DayGrid.tsx` because
 * `DayGrid`'s DnD machinery is tightly coupled to the same scope. If/when
 * `DayGrid` is refactored, it should consume this hook.
 */
export function useDayTimelineData(
  options: UseDayTimelineDataOptions = {},
): UseDayTimelineDataResult {
  const hourHeight = options.hourHeight ?? GRID_HEIGHT_PER_HOUR;
  const headerOffset = options.headerOffset ?? 32; /* desktop h-8 header offset */

  const selectedDate = useSelector(getSelectedDate);
  const workingHours = useSelector(getLocationWorkingHours);
  const open247 = useSelector(getLocationOpen247);
  const bookingSettings = useSelector(getBookingSettings);
  const calendarTimezone = useSelector(getCalendarTimezone);

  const dayWorkingHours = getWorkingHoursForDate(selectedDate, workingHours, open247);
  const isOpen = open247 || (dayWorkingHours?.isOpen ?? false);
  const isToday =
    formatDateInTimezone(selectedDate, calendarTimezone) ===
    formatDateInTimezone(new Date(), calendarTimezone);
  const { openHour, closeHour } = getDayOpenCloseHours(dayWorkingHours, open247, 6, 22);
  const dateKey = formatDateInTimezone(selectedDate, calendarTimezone);

  const slotIntervalMinutes = bookingSettings?.slotIntervalMinutes ?? 15;
  const daySlotMinutes = getSlotStartsInRange(0, 24 * 60, slotIntervalMinutes);
  const dayGridSlotStarts: GridSlot[] = daySlotMinutes.map((m) => ({
    hour: Math.floor(m / 60),
    minute: m % 60,
  }));
  const dayGridStartMinutes = daySlotMinutes[0] ?? 0;
  const daySlotHeight =
    daySlotMinutes.length > 0 ? hourHeight / (60 / slotIntervalMinutes) : HOUR_HEIGHT;

  useNowTick(isToday);

  const nowMinutes = calendarTimezone
    ? getMinutesInTimezone(new Date().toISOString(), calendarTimezone)
    : new Date().getHours() * 60 + new Date().getMinutes();
  const nowGutterTop =
    headerOffset + ((nowMinutes - dayGridStartMinutes) / slotIntervalMinutes) * daySlotHeight;
  const is24h = calendarPreferences.getTimeFormat() === "24h";
  const nowLabel = formatNowLabel(nowMinutes, is24h);

  return {
    dateKey,
    calendarTimezone,
    dayWorkingHours,
    isOpen,
    isToday,
    openHour,
    closeHour,
    slotIntervalMinutes,
    daySlotMinutes,
    dayGridSlotStarts,
    dayGridStartMinutes,
    daySlotHeight,
    hourHeight,
    nowMinutes,
    nowGutterTop,
    nowLabel,
    is24h,
  };
}
