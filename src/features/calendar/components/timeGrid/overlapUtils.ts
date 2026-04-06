import type {
  SlimAppointment,
  CalendarDisplayBlock,
  CalendarBlockDto,
} from "../../../../shared/types/calendar.ts";
import { timeRangesOverlap } from "../../dndDropEligibility.ts";
import { getMinutesInTimezone } from "../../timezone.ts";
import { HOUR_HEIGHT, GRID_START_HOUR } from "./constants.ts";

// ─────────────────────────────────────────────────────────────
// Parse appointment id from dnd-kit active id
// ─────────────────────────────────────────────────────────────

/** Parse appointment id from dnd-kit active id (`appointment-{columnId}-{id}` or legacy `appointment-{id}`). */
export function parseDraggableActiveAppointmentId(activeId: string): number | null {
  if (!activeId.startsWith("appointment-")) return null;
  const rest = activeId.slice("appointment-".length);
  const lastDash = rest.lastIndexOf("-");
  const idPart = lastDash === -1 ? rest : rest.slice(lastDash + 1);
  const n = parseInt(idPart, 10);
  return Number.isNaN(n) ? null : n;
}

// ─────────────────────────────────────────────────────────────
// Time position calculation (legacy hour-based grid)
// ─────────────────────────────────────────────────────────────

/** Calculate top offset and height (px) for a time range on the grid */
export const getTimePosition = (isoStart: string, isoEnd: string, timezone?: string) => {
  const startMinutes = timezone
    ? getMinutesInTimezone(isoStart, timezone)
    : (new Date(isoStart).getHours() * 60 + new Date(isoStart).getMinutes());
  const endMinutes = timezone
    ? getMinutesInTimezone(isoEnd, timezone)
    : (new Date(isoEnd).getHours() * 60 + new Date(isoEnd).getMinutes());
  const gridStartMinutes = GRID_START_HOUR * 60;

  const top = ((startMinutes - gridStartMinutes) / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 24);
  return { top, height };
};

// ─────────────────────────────────────────────────────────────
// Overlap lane assignment
// ─────────────────────────────────────────────────────────────

/**
 * Assign lane index and total lanes for overlapping appointments so they can be shown side-by-side.
 * Returns for each appointment { laneIndex, totalLanes } (0-based lane, 1-based total).
 * totalLanes is the count of appointments that overlap this one's time range (so a standalone block gets full width).
 *
 * Uses real start/end instants — not {@link getTimePosition} pixels — because the grid applies a minimum
 * block height (px) that can extend past the true end time and would falsely treat back-to-back bookings as overlapping.
 */
export function getOverlapLanes(appointments: SlimAppointment[]): Map<number, { laneIndex: number; totalLanes: number }> {
  const result = new Map<number, { laneIndex: number; totalLanes: number }>();
  if (appointments.length === 0) return result;

  const indexed = appointments
    .map((appt) => ({
      id: appt.id,
      startMs: new Date(appt.scheduledAt).getTime(),
      endMs: new Date(appt.endsAt).getTime(),
    }))
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);

  const laneEndsMs: number[] = [];

  for (const { id, startMs, endMs } of indexed) {
    let lane = 0;
    while (lane < laneEndsMs.length && laneEndsMs[lane] > startMs) lane++;
    if (lane === laneEndsMs.length) laneEndsMs.push(endMs);
    else laneEndsMs[lane] = endMs;
    result.set(id, { laneIndex: lane, totalLanes: 0 });
  }

  for (let i = 0; i < indexed.length; i++) {
    const { id, startMs, endMs } = indexed[i];
    let count = 0;
    for (let j = 0; j < indexed.length; j++) {
      const o = indexed[j];
      if (timeRangesOverlap(startMs, endMs, o.startMs, o.endMs)) count++;
    }
    const entry = result.get(id);
    if (entry) entry.totalLanes = count;
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
// Overlap grouping (appointments)
// ─────────────────────────────────────────────────────────────

/** Group appointments by overlapping time (transitive). Each group has minStart/maxEnd for the span. */
export interface OverlapGroup {
  appointments: SlimAppointment[];
  minStartIso: string;
  maxEndIso: string;
}

export function getOverlapGroups(appointments: SlimAppointment[]): OverlapGroup[] {
  if (appointments.length === 0) return [];
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );
  const groups: OverlapGroup[] = [];
  let current: { appointments: SlimAppointment[]; minStart: number; maxEnd: number } = {
    appointments: [sorted[0]],
    minStart: new Date(sorted[0].scheduledAt).getTime(),
    maxEnd: new Date(sorted[0].endsAt).getTime(),
  };
  for (let i = 1; i < sorted.length; i++) {
    const appt = sorted[i];
    const start = new Date(appt.scheduledAt).getTime();
    const end = new Date(appt.endsAt).getTime();
    if (timeRangesOverlap(current.minStart, current.maxEnd, start, end)) {
      current.appointments.push(appt);
      current.minStart = Math.min(current.minStart, start);
      current.maxEnd = Math.max(current.maxEnd, end);
    } else {
      groups.push({
        appointments: current.appointments,
        minStartIso: new Date(current.minStart).toISOString(),
        maxEndIso: new Date(current.maxEnd).toISOString(),
      });
      current = { appointments: [appt], minStart: start, maxEnd: end };
    }
  }
  groups.push({
    appointments: current.appointments,
    minStartIso: new Date(current.minStart).toISOString(),
    maxEndIso: new Date(current.maxEnd).toISOString(),
  });
  return groups;
}

// ─────────────────────────────────────────────────────────────
// Overlap grouping (calendar blocks)
// ─────────────────────────────────────────────────────────────

export interface BlockOverlapGroup {
  blocks: CalendarBlockDto[];
  minStartIso: string;
  maxEndIso: string;
}

export function getBlockOverlapGroups(blocks: CalendarBlockDto[]): BlockOverlapGroup[] {
  if (blocks.length === 0) return [];
  const sorted = [...blocks].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const groups: BlockOverlapGroup[] = [];
  let current: { blocks: CalendarBlockDto[]; minStart: number; maxEnd: number } = {
    blocks: [sorted[0]],
    minStart: new Date(sorted[0].startsAt).getTime(),
    maxEnd: new Date(sorted[0].endsAt).getTime(),
  };
  for (let i = 1; i < sorted.length; i++) {
    const block = sorted[i];
    const start = new Date(block.startsAt).getTime();
    const end = new Date(block.endsAt).getTime();
    if (timeRangesOverlap(current.minStart, current.maxEnd, start, end)) {
      current.blocks.push(block);
      current.minStart = Math.min(current.minStart, start);
      current.maxEnd = Math.max(current.maxEnd, end);
    } else {
      groups.push({
        blocks: current.blocks,
        minStartIso: new Date(current.minStart).toISOString(),
        maxEndIso: new Date(current.maxEnd).toISOString(),
      });
      current = { blocks: [block], minStart: start, maxEnd: end };
    }
  }
  groups.push({
    blocks: current.blocks,
    minStartIso: new Date(current.minStart).toISOString(),
    maxEndIso: new Date(current.maxEnd).toISOString(),
  });
  return groups;
}

// ─────────────────────────────────────────────────────────────
// Display block → SlimAppointment conversion
// ─────────────────────────────────────────────────────────────

/** Convert a display block to SlimAppointment-like shape for grid layout and drag (uses first appointment id). */
export function displayBlockToSlim(block: CalendarDisplayBlock): SlimAppointment {
  return {
    id: block.id,
    scheduledAt: block.start,
    endsAt: block.end,
    status: block.status,
    bookedItemName: block.label,
    duration: block.duration,
    staffUserIds: block.staffUserIds,
    customerName: block.customerName,
    bookingSource: block.bookingSource,
    isUnassigned: block.isUnassigned,
    overrideReason: block.overrideReason,
    bookingGroupId: block.bookingGroupId ?? undefined,
    bookingGroupOrder: block.bookingGroupOrder ?? undefined,
    groupSize: block.groupSize,
    notes: block.notes ?? undefined,
  };
}
