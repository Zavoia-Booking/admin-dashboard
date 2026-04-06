import type {
  SlimAppointment,
  CalendarBlockDto,
  LocationContextService,
  LocationContextBundle,
} from "../../shared/types/calendar.ts";
import { buildZonedDateFromDateKey, formatDateInTimezone } from "./timezone.ts";

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
    const otherStart = new Date(o.scheduledAt).getTime();
    const otherEnd = new Date(o.endsAt).getTime();
    acc = mergeIntervalConflictKinds(
      acc,
      intervalConflictWithOther(dropStart, dropEnd, otherStart, otherEnd, bufferMs),
    );
  }
  return acc;
}

/** Count appointments sharing this booking group id (same calendar payload / day slice). */
export function countSegmentsSameBookingGroup(
  appointments: SlimAppointment[],
  bookingGroupId: string | null | undefined,
): number {
  const gid = bookingGroupId?.trim();
  if (!gid) return 0;
  return appointments.filter((a) => (a.bookingGroupId?.trim() ?? "") === gid).length;
}

/**
 * True for multi-item booking groups only (matches grid group-dot: groupSize > 1 or multiple segments visible).
 */
export function isMultiSegmentGroupDrag(appointment: SlimAppointment, siblingSegmentCount: number): boolean {
  const gid = appointment.bookingGroupId?.trim();
  if (!gid) return false;
  return Math.max(appointment.groupSize ?? 1, siblingSegmentCount) > 1;
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

export type DayGroupSegmentPreview = {
  id: number;
  startIso: string;
  endIso: string;
  staffUserIds: number[];
};

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
    }
  | {
      ok: true;
      action: "reschedule_group";
      dateKey: string;
      hour: number;
      minute: number;
      columnId: number;
      bookingGroupId: string;
      newGroupStartIso: string;
      segmentsPreview: DayGroupSegmentPreview[];
    };

const MSG_UNASSIGNED = "Appointments must be assigned to a team member.";
const MSG_STAFF_CONFLICT =
  "This team member already has an appointment at this time. Choose another time or team member.";
function msgStaffBufferConflict(bufferMinutes: number): string {
  return `This time is inside the ${bufferMinutes}-minute buffer required between appointments for this team member. Choose another time or team member.`;
}
const MSG_BLOCK = "This time overlaps a calendar block. Choose another time or edit the block.";
const MSG_PAST = "Cannot reschedule to a time in the past.";
const MSG_GROUP_REASSIGN = "Booking groups can only be rescheduled, not reassigned to a different staff member.";

function ineligibleStaffMessage(staffLabel: string): string {
  return `${staffLabel} is not assigned to perform this service. Choose another team member or edit the appointment.`;
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
    dayAppointments,
    appointmentsByColumn,
    blocksByColumn,
    locationServices,
    locationBundles,
    targetColumnLabel,
    bufferTimeMinutes = 0,
  } = ctx;

  if (targetColumnId === 0) {
    return { ok: false, toastMessage: MSG_UNASSIGNED };
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
      return { ok: false, toastMessage: "Appointment would extend past midnight." };
    }
  }

  const groupSegCountOnDay = countSegmentsSameBookingGroup(dayAppointments, appointment.bookingGroupId);
  const isGroupDragRestricted = isMultiSegmentGroupDrag(appointment, groupSegCountOnDay);
  const groupId = appointment.bookingGroupId?.trim();

  if (isGroupDragRestricted && sourceColumnId !== targetColumnId) {
    return { ok: false, toastMessage: MSG_GROUP_REASSIGN };
  }

  if (droppedSlotStartMs < nowMs) {
    return { ok: false, toastMessage: MSG_PAST };
  }

  if (isGroupDragRestricted && groupId) {
    const groupSegments = dayAppointments
      .filter((a) => (a.bookingGroupId?.trim() ?? "") === groupId)
      .sort((a, b) => (a.bookingGroupOrder ?? 0) - (b.bookingGroupOrder ?? 0));
    if (groupSegments.length === 0) {
      return { ok: true, action: "noop" };
    }
    const groupFirstStartMs = new Date(groupSegments[0].scheduledAt).getTime();
    const draggedStartMs = new Date(appointment.scheduledAt).getTime();
    const draggedOffsetMs = draggedStartMs - groupFirstStartMs;
    const newGroupStartMs = droppedSlotStartMs - draggedOffsetMs;

    if (newGroupStartMs < nowMs) {
      return { ok: false, toastMessage: MSG_PAST };
    }

    const segmentsPreview: DayGroupSegmentPreview[] = groupSegments.map((seg) => {
      const segStartMs = new Date(seg.scheduledAt).getTime();
      const segOffsetMs = segStartMs - groupFirstStartMs;
      const previewStartMs = newGroupStartMs + segOffsetMs;
      const durationMs =
        (seg.endsAt ? new Date(seg.endsAt).getTime() : new Date(seg.scheduledAt).getTime() + seg.duration * 60 * 1000) -
        new Date(seg.scheduledAt).getTime();
      return {
        id: seg.id,
        startIso: new Date(previewStartMs).toISOString(),
        endIso: new Date(previewStartMs + durationMs).toISOString(),
        staffUserIds: seg.staffUserIds || [],
      };
    });

    if (newGroupStartMs !== groupFirstStartMs) {
      for (const seg of segmentsPreview) {
        const colId = seg.staffUserIds?.[0] ?? 0;
        const colBlocks = blocksByColumn.get(colId) ?? [];
        const segStart = new Date(seg.startIso).getTime();
        const segEnd = new Date(seg.endIso).getTime();
        for (const b of colBlocks) {
          const bs = new Date(b.startsAt).getTime();
          const be = new Date(b.endsAt).getTime();
          if (timeRangesOverlap(segStart, segEnd, bs, be)) {
            return { ok: false, toastMessage: MSG_BLOCK };
          }
        }
      }
    }

    const groupMemberIds = new Set(groupSegments.map((s) => s.id));
    for (const seg of segmentsPreview) {
      const staffCol = seg.staffUserIds?.[0] ?? 0;
      const peers = (appointmentsByColumn.get(staffCol) ?? []).filter((a) => !groupMemberIds.has(a.id));
      const segStart = new Date(seg.startIso).getTime();
      const segEnd = new Date(seg.endIso).getTime();
      const conflict = aggregateStaffIntervalConflict(segStart, segEnd, peers, bufferTimeMinutes);
      if (conflict === "overlap") return { ok: false, toastMessage: MSG_STAFF_CONFLICT };
      if (conflict === "buffer") return { ok: false, toastMessage: msgStaffBufferConflict(bufferTimeMinutes) };
    }

    return {
      ok: true,
      action: "reschedule_group",
      dateKey: targetDateKey,
      hour: targetHour,
      minute: targetMinute,
      columnId: targetColumnId,
      bookingGroupId: groupId,
      newGroupStartIso: new Date(newGroupStartMs).toISOString(),
      segmentsPreview,
    };
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
    return { ok: false, toastMessage: MSG_STAFF_CONFLICT };
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
      return { ok: false, toastMessage: MSG_BLOCK };
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
  isGroupDragRestricted: boolean;
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
    isGroupDragRestricted,
    appointmentsByColumn,
    locationServices,
    locationBundles,
    bufferTimeMinutes = 0,
  } = ctx;

  if (staffId === 0) {
    return { allowed: false, toastMessage: MSG_UNASSIGNED };
  }
  if (isGroupDragRestricted) {
    return { allowed: false }; // silent ignore (staff-column drop)
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
    return { allowed: false, toastMessage: MSG_STAFF_CONFLICT };
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
    }
  | {
      ok: true;
      action: "reschedule_group";
      dateKey: string;
      hour: number;
      minute: number;
      columnId: number;
      bookingGroupId: string;
      newGroupStartIso: string;
      segmentsPreview: DayGroupSegmentPreview[];
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
  /** Raw per-day data (group listing, blocks); matches week `handleDragEnd`. */
  columnData: readonly WeekColumnDaySlice[];
  /** Raw per-day data keyed by dateKey (YYYY-MM-DD); used for per-segment block validation on group reschedule. */
  columnDataByDateKey: Record<string, WeekColumnDaySlice>;
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
    columnDataByDateKey,
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
    return { ok: false, toastMessage: MSG_PAST };
  }

  // Appointment must not extend past midnight
  {
    const dropEndMs = droppedSlotStartMs + appointment.duration * 60 * 1000;
    const dayStart = new Date(droppedSlotStartMs);
    dayStart.setHours(0, 0, 0, 0);
    if (dropEndMs > dayStart.getTime() + 24 * 60 * 60 * 1000) {
      return { ok: false, toastMessage: "Appointment would extend past midnight." };
    }
  }

  const allWeekAppointments = columnData.flatMap((col) => col.appointments);
  const groupSegCountWeek = countSegmentsSameBookingGroup(allWeekAppointments, appointment.bookingGroupId);
  const isGroupDragRestricted = isMultiSegmentGroupDrag(appointment, groupSegCountWeek);
  const groupId = appointment.bookingGroupId?.trim();

  if (isGroupDragRestricted && groupId) {
    const groupSegments = allWeekAppointments
      .filter((a) => (a.bookingGroupId?.trim() ?? "") === groupId)
      .sort((a, b) => (a.bookingGroupOrder ?? 0) - (b.bookingGroupOrder ?? 0));
    if (groupSegments.length === 0) {
      return { ok: true, action: "noop" };
    }
    const groupFirstStartMs = new Date(groupSegments[0].scheduledAt).getTime();
    const draggedOffsetMs = apptStartMs - groupFirstStartMs;
    const newGroupStartMs = droppedSlotStartMs - draggedOffsetMs;

    if (newGroupStartMs < nowMs) {
      return { ok: false, toastMessage: MSG_PAST };
    }

    const segmentsPreview: DayGroupSegmentPreview[] = groupSegments.map((seg) => {
      const segStartMs = new Date(seg.scheduledAt).getTime();
      const segOffsetMs = segStartMs - groupFirstStartMs;
      const previewStartMs = newGroupStartMs + segOffsetMs;
      const durationMs =
        (seg.endsAt ? new Date(seg.endsAt).getTime() : new Date(seg.scheduledAt).getTime() + seg.duration * 60 * 1000) -
        new Date(seg.scheduledAt).getTime();
      return {
        id: seg.id,
        startIso: new Date(previewStartMs).toISOString(),
        endIso: new Date(previewStartMs + durationMs).toISOString(),
        staffUserIds: seg.staffUserIds || [],
      };
    });

    if (newGroupStartMs !== groupFirstStartMs) {
      for (const seg of segmentsPreview) {
        const segDateKey = formatDateInTimezone(new Date(seg.startIso), calendarTimezone);
        const segBlocks = columnDataByDateKey[segDateKey]?.blocks ?? [];
        const segStart = new Date(seg.startIso).getTime();
        const segEnd = new Date(seg.endIso).getTime();
        for (const b of segBlocks) {
          const bs = new Date(b.startsAt).getTime();
          const be = new Date(b.endsAt).getTime();
          if (timeRangesOverlap(segStart, segEnd, bs, be)) {
            return { ok: false, toastMessage: MSG_BLOCK };
          }
        }
      }
    }

    const groupMemberIds = new Set(groupSegments.map((s) => s.id));
    const dayPeers = (columnDataWithPreview[targetColumnId]?.appointments ?? []).filter((a) => !groupMemberIds.has(a.id));
    for (const seg of segmentsPreview) {
      const segStart = new Date(seg.startIso).getTime();
      const segEnd = new Date(seg.endIso).getTime();
      const conflict = aggregateStaffIntervalConflict(segStart, segEnd, dayPeers, bufferTimeMinutes);
      if (conflict === "overlap") return { ok: false, toastMessage: MSG_STAFF_CONFLICT };
      if (conflict === "buffer") return { ok: false, toastMessage: msgStaffBufferConflict(bufferTimeMinutes) };
    }

    return {
      ok: true,
      action: "reschedule_group",
      dateKey: targetDateKey,
      hour: targetHour,
      minute: targetMinute,
      columnId: targetColumnId,
      bookingGroupId: groupId,
      newGroupStartIso: new Date(newGroupStartMs).toISOString(),
      segmentsPreview,
    };
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
    return { ok: false, toastMessage: MSG_STAFF_CONFLICT };
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
    return { ok: false, toastMessage: MSG_BLOCK };
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

/** Staff column: also disable when drop would be a silent no-op (same staff, group restricted). */
export function isDayStaffColumnDropDisabled(ctx: DayStaffColumnDropContext): boolean {
  if (ctx.staffId === 0) return true;
  if (ctx.isGroupDragRestricted) return true;
  if (ctx.appointment.staffUserIds.length > 0 && ctx.appointment.staffUserIds[0] === ctx.staffId) {
    return true;
  }
  return !evaluateDayStaffColumnDrop(ctx).allowed;
}

export function isWeekTimeSlotForbiddenForPreview(ctx: WeekTimeSlotDropContext): boolean {
  return !evaluateWeekTimeSlotDrop(ctx).ok;
}
