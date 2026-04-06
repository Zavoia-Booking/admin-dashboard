import type { SlimAppointment } from "../../shared/types/calendar.ts";
import { isAppointmentEndInPast } from "./timezone.ts";

/**
 * True when reschedule/reassign via grid should be blocked (aligned with EditAppointmentSlider:
 * booking last end ≤ now). Uses max(endsAt) over segments sharing bookingGroupId in the same
 * payload when multiple segments exist; otherwise this segment's endsAt.
 */
export function isSlimAppointmentSchedulingLocked(
  appointment: SlimAppointment,
  samePayloadAppointments: SlimAppointment[],
  now: Date = new Date(),
): boolean {
  const gid = appointment.bookingGroupId?.trim();
  if (!gid) {
    return isAppointmentEndInPast(appointment.endsAt, now);
  }
  const groupOnPayload = samePayloadAppointments.filter((a) => (a.bookingGroupId?.trim() ?? "") === gid);
  if (groupOnPayload.length <= 1) {
    return isAppointmentEndInPast(appointment.endsAt, now);
  }
  const maxEndMs = Math.max(...groupOnPayload.map((a) => new Date(a.endsAt).getTime()));
  return isAppointmentEndInPast(new Date(maxEndMs), now);
}
