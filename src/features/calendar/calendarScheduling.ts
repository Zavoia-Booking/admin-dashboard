import type { SlimAppointment } from "../../shared/types/calendar.ts";

/** The grid locks moving/reassigning once the appointment has started or is closed (the server refuses the same). */
export function isSlimAppointmentSchedulingLocked(
  appointment: SlimAppointment,
  _samePayloadAppointments: SlimAppointment[],
  now: Date = new Date(),
): boolean {
  const start = new Date(appointment.scheduledAt);
  if (!Number.isNaN(start.getTime()) && start.getTime() <= now.getTime()) return true;
  return (
    appointment.status === "cancelled" ||
    appointment.status === "completed" ||
    appointment.status === "no_show"
  );
}
