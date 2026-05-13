import type { TFunction } from "i18next";
import type { CalendarBlockDto, CalendarStaffMember } from "../../../shared/types/calendar";
import { formatTimeRange, formatDurationHuman, formatTime } from "./utils.tsx";
import { formatDateInTimezone } from "../timezone";
import {
  getCalendarBlockReasonIcon,
  getCalendarBlockReasonLabel,
} from "./blockReasonMeta.ts";

function isMultiDay(block: CalendarBlockDto, timezone: string | undefined): boolean {
  if (!timezone) return false;
  const startKey = formatDateInTimezone(new Date(block.startsAt), timezone);
  const endKey = formatDateInTimezone(new Date(block.endsAt), timezone);
  return startKey !== endKey;
}

function formatShortDate(iso: string, timezone: string | undefined): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(timezone ? { timeZone: timezone } : {}),
  });
}

/**
 * Full block time range for summary/detail views (no per-day context).
 * - Single-day timed: "09:00 - 17:00"
 * - Single-day all-day: "All day"
 * - Multi-day timed: "Nov 20 09:00 – Nov 23 17:00"
 * - Multi-day all-day: "Nov 20 – Nov 23 · All day"
 */
export function formatBlockTimeRange(
  block: CalendarBlockDto,
  timezone: string | undefined,
  t: TFunction,
): string {
  const multiDay = isMultiDay(block, timezone);
  if (block.isAllDay) {
    if (!multiDay) return t("page.blocks.allDay");
    return t("page.blocks.multiDayAllDayRange", {
      startDate: formatShortDate(block.startsAt, timezone),
      endDate: formatShortDate(block.endsAt, timezone),
    });
  }
  if (!multiDay) return formatTimeRange(block.startsAt, block.endsAt, timezone);
  return t("page.blocks.multiDayRange", {
    startDate: formatShortDate(block.startsAt, timezone),
    startTime: formatTime(block.startsAt, timezone),
    endDate: formatShortDate(block.endsAt, timezone),
    endTime: formatTime(block.endsAt, timezone),
  });
}

/**
 * Block time label clipped to a specific displayed day. Used by in-grid
 * block cards so the label matches the bar the user actually sees on that
 * day — middle days of a multi-day block read "All day", endpoints read
 * "From HH:MM" / "Until HH:MM".
 */
export function formatBlockTimeForDay(
  block: CalendarBlockDto,
  dateKey: string,
  timezone: string | undefined,
  t: TFunction,
): string {
  if (block.isAllDay) return t("page.blocks.allDay");
  if (!timezone) return formatTimeRange(block.startsAt, block.endsAt, timezone);
  const startKey = formatDateInTimezone(new Date(block.startsAt), timezone);
  const endKey = formatDateInTimezone(new Date(block.endsAt), timezone);
  if (startKey === endKey) return formatTimeRange(block.startsAt, block.endsAt, timezone);
  if (dateKey === startKey) {
    return t("page.blocks.fromTime", { time: formatTime(block.startsAt, timezone) });
  }
  if (dateKey === endKey) {
    return t("page.blocks.untilTime", { time: formatTime(block.endsAt, timezone) });
  }
  return t("page.blocks.allDay");
}

export interface BlockDisplayData {
  reasonLabel: string;
  ReasonIcon: ReturnType<typeof getCalendarBlockReasonIcon>;
  customTitle: string;
  notesTrimmed: string;
  hasTitleOrNotes: boolean;
  timeDisplay: string;
  durationText: string | null;
  staffMember: CalendarStaffMember | null;
  staffName: string | null;
  scopeStaffLabel: string;
  scopeTierLabel: string;
}

/**
 * Shared display-data derivation for a calendar block. Consumed by both
 * desktop `BlockCard` and mobile `MobileDayBlockCard` so the two cannot
 * drift. Pure lift-and-shift of the original desktop derivation logic.
 */
export function getBlockDisplayData(
  block: CalendarBlockDto,
  locationStaff: CalendarStaffMember[],
  timezone: string | undefined,
  t: TFunction,
): BlockDisplayData {
  const reasonLabel = getCalendarBlockReasonLabel(block.reason, t);
  const ReasonIcon = getCalendarBlockReasonIcon(block.reason);
  const customTitle = block.title?.trim() ?? "";
  const notesTrimmed = block.notes?.trim() ?? "";
  const hasTitleOrNotes = Boolean(customTitle || notesTrimmed);

  const timeDisplay = formatBlockTimeRange(block, timezone, t);

  const durationMinutes = block.isAllDay
    ? null
    : Math.max(
        0,
        Math.round(
          (new Date(block.endsAt).getTime() - new Date(block.startsAt).getTime()) / 60000,
        ),
      );
  const durationText = durationMinutes != null ? formatDurationHuman(durationMinutes, t) : null;

  const staffMember =
    block.blockScope === "staff" && block.userId
      ? (locationStaff.find((s) => s.id === block.userId) ?? null)
      : null;
  const staffName = staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : null;

  const scopeStaffLabel = (() => {
    if (block.blockScope === "location") return t("page.blocks.scope.entireLocation");
    if (block.blockScope === "business") return t("page.blocks.scope.allLocations");
    if (block.blockScope === "staff") {
      return (
        staffName ??
        (block.userId != null
          ? t("page.common.staffId", { id: block.userId })
          : t("page.common.unassigned"))
      );
    }
    return block.blockScope;
  })();

  const scopeTierLabel = (() => {
    if (block.blockScope === "location") return t("page.blocks.scope.locationWide");
    if (block.blockScope === "staff") return t("page.blocks.scope.staffMember");
    if (block.blockScope === "business") return t("page.blocks.scope.businessWide");
    return block.blockScope;
  })();

  return {
    reasonLabel,
    ReasonIcon,
    customTitle,
    notesTrimmed,
    hasTitleOrNotes,
    timeDisplay,
    durationText,
    staffMember,
    staffName,
    scopeStaffLabel,
    scopeTierLabel,
  };
}
