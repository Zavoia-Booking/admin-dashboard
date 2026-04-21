/**
 * Shared utilities for working hours, time slots, and out-of-hours / block-overlap checks.
 * Pure functions only; used by AddAppointmentSlider, CreateBlockDrawer, and CalendarTimeGrid.
 */
import type { WorkingHours, WorkingHoursDay } from "../../shared/types/location";
import type { CalendarBlockDto } from "../../shared/types/calendar";
import { convertTo24Hour } from "./utils";
import { getMinutesInTimezone, formatDateInTimezone, buildZonedDateFromDateKey } from "./timezone";

/** Day-of-week key matching WorkingHours (lowercase). */
function getDayKey(date: Date): keyof WorkingHours {
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  return dayName as keyof WorkingHours;
}

/**
 * Get working hours for a given date.
 * Returns null if open247, no workingHours, or no entry for that day.
 */
export function getWorkingHoursForDate(
  date: Date,
  workingHours: WorkingHours | null,
  open247: boolean
): WorkingHoursDay | null {
  if (open247 || !workingHours) return null;
  const key = getDayKey(date);
  const day = workingHours[key];
  return day ?? null;
}

/**
 * Generate time slots for a day at a given interval.
 * Returns "HH:mm" strings from 00:00 up to (but not including) 24:00.
 */
export function getTimeSlotsForDay(intervalMinutes: number): string[] {
  const slots: string[] = [];
  for (let m = 0; m < 24 * 60; m += intervalMinutes) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

/**
 * Slot start minutes in [startMinutes, endMinutes) at the given interval.
 * Used by the calendar grid to build slot rows (e.g. 15-min slots in working hours range).
 */
export function getSlotStartsInRange(
  startMinutes: number,
  endMinutes: number,
  intervalMinutes: number
): number[] {
  if (startMinutes >= endMinutes || intervalMinutes <= 0) return [];
  const slots: number[] = [];
  const firstSlot = Math.ceil(startMinutes / intervalMinutes) * intervalMinutes;
  for (let m = firstSlot; m < endMinutes; m += intervalMinutes) {
    slots.push(m);
  }
  return slots;
}

const MIN_APPOINTMENT_HEIGHT_PX = 32;

/**
 * Convert appointment time range (ISO start/end) to grid position (top, height in px).
 * Single source of truth for calendar grid and DraggableAppointmentBlock so they stay in sync.
 */
export function getTimePositionForGrid(
  isoStart: string,
  isoEnd: string,
  gridStartMinutes: number,
  intervalMinutes: number,
  slotHeight: number,
  timezone?: string
): { top: number; height: number } {
  const startMinutes = timezone
    ? getMinutesInTimezone(isoStart, timezone)
    : (new Date(isoStart).getHours() * 60 + new Date(isoStart).getMinutes());
  let endMinutes = timezone
    ? getMinutesInTimezone(isoEnd, timezone)
    : (new Date(isoEnd).getHours() * 60 + new Date(isoEnd).getMinutes());
  // When end crosses midnight (00:00 = 0 min), cap at end of day so the block renders correctly
  if (endMinutes <= startMinutes) endMinutes = 24 * 60;
  const top = ((startMinutes - gridStartMinutes) / intervalMinutes) * slotHeight;
  const height = Math.max(
    ((endMinutes - startMinutes) / intervalMinutes) * slotHeight,
    MIN_APPOINTMENT_HEIGHT_PX
  );
  return { top, height };
}

/**
 * Clip a block's [startsAt, endsAt] range to the displayed day's bounds in the
 * given timezone. Multi-day continuous blocks render correctly per-day without
 * the date-stripping surprises of getMinutesInTimezone. No-op for blocks that
 * fit inside the day.
 */
export function clampBlockToViewDay(
  blockStartsAt: string,
  blockEndsAt: string,
  dateKey: string,
  timezone: string,
): { startsAt: string; endsAt: string } {
  const dayStartMs = buildZonedDateFromDateKey(dateKey, '00:00', timezone).getTime();
  const dayEndMs = buildZonedDateFromDateKey(dateKey, '23:59', timezone).getTime() + 59_999;
  const blockStartMs = new Date(blockStartsAt).getTime();
  const blockEndMs = new Date(blockEndsAt).getTime();
  const startMs = Math.max(blockStartMs, dayStartMs);
  const endMs = Math.min(blockEndMs, dayEndMs);
  return {
    startsAt: new Date(startMs).toISOString(),
    endsAt: new Date(endMs).toISOString(),
  };
}

/**
 * Get open/close of a day in minutes (0–1440).
 * Returns null if open247 or day is closed (isOpen false).
 */
export function getDayOpenCloseMinutes(
  dayHours: WorkingHoursDay | null,
  open247: boolean
): { start: number; end: number } | null {
  if (open247 || !dayHours?.isOpen) return null;
  const open24 = convertTo24Hour(dayHours.open);
  const close24 = convertTo24Hour(dayHours.close);
  const [openH, openM] = open24.split(":").map(Number);
  const [closeH, closeM] = close24.split(":").map(Number);
  return {
    start: openH * 60 + openM,
    end: closeH * 60 + closeM,
  };
}

/**
 * Get open/close hours for the time grid (integer hours).
 * When closed or !dayHours?.isOpen, returns gridStartHour for both (no visible range).
 * Close is rounded up if there are minutes.
 */
export function getDayOpenCloseHours(
  dayHours: WorkingHoursDay | null,
  open247: boolean,
  gridStartHour: number,
  gridEndHour: number
): { openHour: number; closeHour: number } {
  if (open247) return { openHour: gridStartHour, closeHour: gridEndHour };
  if (!dayHours?.isOpen) return { openHour: gridStartHour, closeHour: gridStartHour };
  const open24 = convertTo24Hour(dayHours.open);
  const close24 = convertTo24Hour(dayHours.close);
  const openHour = parseInt(open24.split(":")[0], 10);
  const [closeH, closeM] = close24.split(":").map(Number);
  const closeHour = closeM > 0 ? closeH + 1 : closeH;
  return {
    openHour,
    closeHour: Math.min(closeHour, gridEndHour),
  };
}

/**
 * True if the given "HH:mm" slot is outside working hours for the date.
 * Closed day or open247 with no dayHours: treat as "outside" (gray out) → true.
 */
export function isSlotOutsideWorkingHours(
  slot: string,
  date: Date | null,
  workingHours: WorkingHours | null,
  open247: boolean
): boolean {
  if (!date) return false;
  const dayHours = getWorkingHoursForDate(date, workingHours, open247);
  const bounds = getDayOpenCloseMinutes(dayHours, open247);
  if (bounds === null) return true; // closed or open247 → gray out all
  const [h, m] = slot.split(":").map(Number);
  const slotMinute = h * 60 + (m ?? 0);
  return slotMinute < bounds.start || slotMinute >= bounds.end;
}

/**
 * True if the time range (scheduledAt + durationMinutes) falls outside working hours.
 * open247 or no dayWorkingHours → false (no "out of hours").
 * Closed day → true.
 * When `timezone` is set, start time is interpreted in that IANA zone (matches location calendar).
 */
export function isTimeRangeOutsideWorkingHours(
  scheduledAt: Date,
  durationMinutes: number,
  dayWorkingHours: WorkingHoursDay | null,
  open247: boolean,
  timezone?: string,
): boolean {
  if (open247 || !dayWorkingHours) return false;
  if (!dayWorkingHours.isOpen) return true;
  const bounds = getDayOpenCloseMinutes(dayWorkingHours, false);
  if (!bounds) return true;
  const startMinutes = timezone?.trim()
    ? getMinutesInTimezone(scheduledAt.toISOString(), timezone.trim())
    : scheduledAt.getHours() * 60 + scheduledAt.getMinutes();
  const endMinutes = startMinutes + durationMinutes;
  return startMinutes < bounds.start || endMinutes > bounds.end;
}

/**
 * True if the time range (scheduledAt + durationMinutes) crosses midnight in the given timezone
 * (start and end on different calendar days). Used to block multi-day appointments.
 */
export function doesTimeRangeSpanMidnight(
  scheduledAt: Date,
  durationMinutes: number,
  timezone: string
): boolean {
  const end = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);
  return formatDateInTimezone(scheduledAt, timezone) !== formatDateInTimezone(end, timezone);
}

/**
 * True if the appointment time range overlaps any of the given blocks.
 * blocks use ISO strings for startsAt/endsAt.
 */
export function appointmentOverlapsBlocks(
  scheduledAt: Date,
  durationMinutes: number,
  blocks: CalendarBlockDto[]
): boolean {
  const startMs = scheduledAt.getTime();
  const endMs = startMs + durationMinutes * 60 * 1000;
  for (const block of blocks) {
    const blockStart = new Date(block.startsAt).getTime();
    const blockEnd = new Date(block.endsAt).getTime();
    if (startMs < blockEnd && endMs > blockStart) return true;
  }
  return false;
}
