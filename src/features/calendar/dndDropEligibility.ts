import type {
  SlimAppointment,
  CalendarBlockDto,
  LocationContextService,
  LocationContextBundle,
} from "../../shared/types/calendar.ts";
import { buildZonedDateFromDateKey } from "./timezone.ts";
import i18n from "../../shared/lib/i18n";

/** True if two time ranges overlap (startA < endB && endA > startB). */
export function timeRangesOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && endA > startB;
}

type IntervalConflictKind = "none" | "overlap" | "buffer";

function mergeIntervalConflictKinds(a: IntervalConflictKind, b: IntervalConflictKind): IntervalConflictKind {
  if (a === "overlap" || b === "overlap") return "overlap";
  if (a === "buffer" || b === "buffer") return "buffer";
  return "none";
}

/**
 * Whether a proposed appointment [dropStart, dropEnd] conflicts with an existing one, including
 * required gap (`bufferMinutes`) after/before other bookings (same staff). Buffer 0 = overlap only.
 */
function intervalConflictWithOther(
  dropStart: number,
  dropEnd: number,
  otherStart: number,
  otherEnd: number,
  bufferMs: number,
): IntervalConflictKind {
  if (timeRangesOverlap(dropStart, dropEnd, otherStart, otherEnd)) return "overlap";
  if (bufferMs > 0) {
    if (dropEnd <= otherStart && otherStart - dropEnd < bufferMs) return "buffer";
    if (otherEnd <= dropStart && dropStart - otherEnd < bufferMs) return "buffer";
  }
  return "none";
}

function aggregateStaffIntervalConflict(
  dropStart: number,
  dropEnd: number,
  others: readonly SlimAppointment[],
  bufferMinutes: number,
): IntervalConflictKind {
  const bufferMs = Math.max(0, bufferMinutes) * 60 * 1000;
  let acc: IntervalConflictKind = "none";
  for (const o of others) {
    // Cancelled appointments free their slots — skip them for conflict detection.
    if (o.status === "cancelled") continue;
    const otherStart = new Date(o.scheduledAt).getTime();
    const otherEnd = new Date(o.endsAt).getTime();
    acc = mergeIntervalConflictKinds(
      acc,
      intervalConflictWithOther(dropStart, dropEnd, otherStart, otherEnd, bufferMs),
    );
  }
  return acc;
}

/**
 * Whether target staff may perform this appointment's booked item at the location.
 */
export function canStaffPerformBookedItem(
  appointment: SlimAppointment,
  targetStaffUserId: number,
  services: LocationContextService[],
  bundles: LocationContextBundle[],
): boolean {
  const name = appointment.bookedItemName?.trim();
  if (!name) return true;

  const serviceMatch = services.find((s) => s.serviceName === name);
  if (serviceMatch != null) {
    const ids = serviceMatch.staffIds;
    if (ids != null && ids.length > 0) {
      return ids.includes(targetStaffUserId);
    }
    return true;
  }

  const bundleMatch = bundles.find((b) => b.bundleName === name);
  if (bundleMatch != null) {
    const ids = bundleMatch.staffIds;
    if (ids != null && ids.length > 0) {
      return ids.includes(targetStaffUserId);
    }
    return true;
  }

  return true;
}

/** `toastMessage` omitted = silent reject (same as current handleDragEnd early return). */
export type DropEligibilityResult = { allowed: true } | { allowed: false; toastMessage?: string };

export type DayTimeSlotDropResult =
  | { ok: false; toastMessage?: string }
  | { ok: true; action: "noop" }
  | {
      ok: true;
      action: "reschedule_single";
      dateKey: string;
      hour: number;
      minute: number;
      columnId: number;
    };

const MSG_UNASSIGNED = () => i18n.t("calendar:page.dnd.unassigned");
const MSG_STAFF_CONFLICT = () => i18n.t("calendar:page.dnd.staffConflict");
function msgStaffBufferConflict(bufferMinutes: number): string {
  return i18n.t("calendar:page.dnd.staffBufferConflict", { minutes: bufferMinutes });
}
const MSG_BLOCK = () => i18n.t("calendar:page.dnd.blockOverlap");
const MSG_PAST = () => i18n.t("calendar:page.dnd.pastTime");

function ineligibleStaffMessage(staffLabel: string): string {
  return i18n.t("calendar:page.dnd.ineligibleStaff", { staffLabel });
}

export type DayTimeSlotDropContext = {
  appointment: SlimAppointment;
  sourceColumnId: number;
  sourceDateKey: string;
  targetColumnId: number;
  targetDateKey: string;
  targetHour: number;
  targetMinute: number;
  /** "Now" for past-slot checks (drop instant or frozen drag-start for preview). */
  nowMs: number;
  calendarTimezone: string;
  dayAppointments: SlimAppointment[];
  appointmentsByColumn: ReadonlyMap<number, SlimAppointment[]>;
  blocksByColumn: ReadonlyMap<number, CalendarBlockDto[]>;
  locationServices: LocationContextService[];
  locationBundles: LocationContextBundle[];
  /** Column label for ineligible-staff toasts */
  targetColumnLabel: string;
  /** From location booking settings; gaps shorter than this (after/before other bookings) are invalid. */
  bufferTimeMinutes?: number;
};

/**
 * Mirrors DayGrid `handleDragEnd` time-slot rules (single source of truth with that handler).
 */
export function evaluateDayTimeSlotDrop(ctx: DayTimeSlotDropContext): DayTimeSlotDropResult {
  const {
    appointment,
    sourceColumnId,
    sourceDateKey,
    targetColumnId,
    targetDateKey,
    targetHour,
    targetMinute,
    nowMs,
    calendarTimezone,
    appointmentsByColumn,
    blocksByColumn,
    locationServices,
    locationBundles,
    targetColumnLabel,
    bufferTimeMinutes = 0,
  } = ctx;

  if (targetColumnId === 0) {
    return { ok: false, toastMessage: MSG_UNASSIGNED() };
  }

  const droppedSlotStartMs = buildZonedDateFromDateKey(
    targetDateKey,
    `${String(targetHour).padStart(2, "0")}:${String(targetMinute).padStart(2, "0")}`,
    calendarTimezone,
  ).getTime();

  const apptStartMs = new Date(appointment.scheduledAt).getTime();

  if (sourceColumnId === targetColumnId && sourceDateKey === targetDateKey && droppedSlotStartMs === apptStartMs) {
    return { ok: true, action: "noop" };
  }

  // Appointment must not extend past midnight (end of calendar day)
  {
    const dropEndMs = droppedSlotStartMs + appointment.duration * 60 * 1000;
    const dayStart = new Date(droppedSlotStartMs);
    dayStart.setHours(0, 0, 0, 0);
    if (dropEndMs > dayStart.getTime() + 24 * 60 * 60 * 1000) {
      return { ok: false, toastMessage: i18n.t("calendar:page.dnd.pastMidnight") };
    }
  }

  if (droppedSlotStartMs < nowMs) {
    return { ok: false, toastMessage: MSG_PAST() };
  }

  const columnApps = (appointmentsByColumn.get(targetColumnId) ?? []).filter((a) => a.id !== appointment.id);
  const slotEnd = droppedSlotStartMs + appointment.duration * 60 * 1000;
  const staffConflict = aggregateStaffIntervalConflict(
    droppedSlotStartMs,
    slotEnd,
    columnApps,
    bufferTimeMinutes,
  );
  if (staffConflict === "overlap") {
    return { ok: false, toastMessage: MSG_STAFF_CONFLICT() };
  }
  if (staffConflict === "buffer") {
    return { ok: false, toastMessage: msgStaffBufferConflict(bufferTimeMinutes) };
  }

  if (
    sourceColumnId !== targetColumnId &&
    !canStaffPerformBookedItem(appointment, targetColumnId, locationServices, locationBundles)
  ) {
    return { ok: false, toastMessage: ineligibleStaffMessage(targetColumnLabel) };
  }

  const sameWallTimeSameDay = droppedSlotStartMs === apptStartMs && targetDateKey === sourceDateKey;
  if (!sameWallTimeSameDay) {
    const blocksForTargetCol = blocksByColumn.get(targetColumnId) ?? [];
    if (
      blocksForTargetCol.some((b) => {
        const bs = new Date(b.startsAt).getTime();
        const be = new Date(b.endsAt).getTime();
        return timeRangesOverlap(droppedSlotStartMs, slotEnd, bs, be);
      })
    ) {
      return { ok: false, toastMessage: MSG_BLOCK() };
    }
  }

  return {
    ok: true,
    action: "reschedule_single",
    dateKey: targetDateKey,
    hour: targetHour,
    minute: targetMinute,
    columnId: targetColumnId,
  };
}

export type DayStaffColumnDropContext = {
  appointment: SlimAppointment;
  staffId: number;
  staffLabel: string;
  appointmentsByColumn: ReadonlyMap<number, SlimAppointment[]>;
  locationServices: LocationContextService[];
  locationBundles: LocationContextBundle[];
  bufferTimeMinutes?: number;
};

export function evaluateDayStaffColumnDrop(ctx: DayStaffColumnDropContext): DropEligibilityResult {
  const {
    appointment,
    staffId,
    staffLabel,
    appointmentsByColumn,
    locationServices,
    locationBundles,
    bufferTimeMinutes = 0,
  } = ctx;

  if (staffId === 0) {
    return { allowed: false, toastMessage: MSG_UNASSIGNED() };
  }
  if (appointment.staffUserIds.length > 0 && appointment.staffUserIds[0] === staffId) {
    return { allowed: true };
  }
  if (!canStaffPerformBookedItem(appointment, staffId, locationServices, locationBundles)) {
    return { allowed: false, toastMessage: ineligibleStaffMessage(staffLabel) };
  }
  const columnApps = (appointmentsByColumn.get(staffId) ?? []).filter((a) => a.id !== appointment.id);
  const apptStart = new Date(appointment.scheduledAt).getTime();
  const apptEnd = new Date(appointment.endsAt).getTime();
  const staffConflict = aggregateStaffIntervalConflict(apptStart, apptEnd, columnApps, bufferTimeMinutes);
  if (staffConflict === "overlap") {
    return { allowed: false, toastMessage: MSG_STAFF_CONFLICT() };
  }
  if (staffConflict === "buffer") {
    return { allowed: false, toastMessage: msgStaffBufferConflict(bufferTimeMinutes) };
  }
  return { allowed: true };
}

export type WeekColumnDaySlice = {
  appointments: SlimAppointment[];
  blocks: CalendarBlockDto[];
};

export type WeekTimeSlotDropResult =
  | { ok: false; toastMessage?: string }
  | { ok: true; action: "noop" }
  | {
      ok: true;
      action: "reschedule_single";
      dateKey: string;
      hour: number;
      minute: number;
      columnId: number;
    };

export type WeekTimeSlotDropContext = {
  appointment: SlimAppointment;
  sourceColumnId: number;
  sourceDateKey: string;
  targetColumnId: number;
  targetDateKey: string;
  targetHour: number;
  targetMinute: number;
  nowMs: number;
  calendarTimezone: string;
  /** Raw per-day data (blocks); matches week `handleDragEnd`. */
  columnData: readonly WeekColumnDaySlice[];
  /** Preview-merged appointments per day for conflict detection. */
  columnDataWithPreview: readonly WeekColumnDaySlice[];
  bufferTimeMinutes?: number;
};

/**
 * Mirrors WeekGrid `handleDragEnd` time-slot rules (single-staff week DnD).
 */
export function evaluateWeekTimeSlotDrop(ctx: WeekTimeSlotDropContext): WeekTimeSlotDropResult {
  const {
    appointment,
    sourceColumnId,
    sourceDateKey,
    targetColumnId,
    targetDateKey,
    targetHour,
    targetMinute,
    nowMs,
    calendarTimezone,
    columnData,
    columnDataWithPreview,
    bufferTimeMinutes = 0,
  } = ctx;

  const droppedSlotStartMs = buildZonedDateFromDateKey(
    targetDateKey,
    `${String(targetHour).padStart(2, "0")}:${String(targetMinute).padStart(2, "0")}`,
    calendarTimezone,
  ).getTime();
  const apptStartMs = new Date(appointment.scheduledAt).getTime();

  if (sourceColumnId === targetColumnId && sourceDateKey === targetDateKey && droppedSlotStartMs === apptStartMs) {
    return { ok: true, action: "noop" };
  }

  if (droppedSlotStartMs < nowMs) {
    return { ok: false, toastMessage: MSG_PAST() };
  }

  // Appointment must not extend past midnight
  {
    const dropEndMs = droppedSlotStartMs + appointment.duration * 60 * 1000;
    const dayStart = new Date(droppedSlotStartMs);
    dayStart.setHours(0, 0, 0, 0);
    if (dropEndMs > dayStart.getTime() + 24 * 60 * 60 * 1000) {
      return { ok: false, toastMessage: i18n.t("calendar:page.dnd.pastMidnight") };
    }
  }

  const columnApps = (columnDataWithPreview[targetColumnId]?.appointments ?? []).filter((a) => a.id !== appointment.id);
  const slotEnd = droppedSlotStartMs + appointment.duration * 60 * 1000;
  const staffConflict = aggregateStaffIntervalConflict(
    droppedSlotStartMs,
    slotEnd,
    columnApps,
    bufferTimeMinutes,
  );
  if (staffConflict === "overlap") {
    return { ok: false, toastMessage: MSG_STAFF_CONFLICT() };
  }
  if (staffConflict === "buffer") {
    return { ok: false, toastMessage: msgStaffBufferConflict(bufferTimeMinutes) };
  }

  const weekBlocksForDay = columnData[targetColumnId]?.blocks ?? [];
  if (
    weekBlocksForDay.some((b) => {
      const bs = new Date(b.startsAt).getTime();
      const be = new Date(b.endsAt).getTime();
      return timeRangesOverlap(droppedSlotStartMs, slotEnd, bs, be);
    })
  ) {
    return { ok: false, toastMessage: MSG_BLOCK() };
  }

  return {
    ok: true,
    action: "reschedule_single",
    dateKey: targetDateKey,
    hour: targetHour,
    minute: targetMinute,
    columnId: targetColumnId,
  };
}

export function isDayTimeSlotForbiddenForPreview(ctx: DayTimeSlotDropContext): boolean {
  return !evaluateDayTimeSlotDrop(ctx).ok;
}

/** Staff column: also disable when drop would be a silent no-op (same staff). */
export function isDayStaffColumnDropDisabled(ctx: DayStaffColumnDropContext): boolean {
  if (ctx.staffId === 0) return true;
  if (ctx.appointment.staffUserIds.length > 0 && ctx.appointment.staffUserIds[0] === ctx.staffId) {
    return true;
  }
  return !evaluateDayStaffColumnDrop(ctx).allowed;
}

export function isWeekTimeSlotForbiddenForPreview(ctx: WeekTimeSlotDropContext): boolean {
  return !evaluateWeekTimeSlotDrop(ctx).ok;
}
