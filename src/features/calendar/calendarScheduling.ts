import type { SlimAppointment } from "../../shared/types/calendar.ts";
import { isAppointmentEndInPast } from "./timezone.ts";

/**
 * True when reschedule/reassign via grid should be blocked (aligned with EditAppointmentSlider:
 * booking end ≤ now).
 */
export function isSlimAppointmentSchedulingLocked(
  appointment: SlimAppointment,
  _samePayloadAppointments: SlimAppointment[],
  now: Date = new Date(),
): boolean {
  return isAppointmentEndInPast(appointment.endsAt, now);
}
