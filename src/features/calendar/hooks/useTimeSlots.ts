import { useMemo } from "react";
import { getTimeSlotsForDay } from "../workingHours";

/**
 * Returns time slots for the day at the given interval.
 * Used by AddAppointmentSlider and CreateBlockDrawer.
 */
export function useTimeSlots(slotIntervalMinutes?: number): string[] {
  return useMemo(
    () => getTimeSlotsForDay(slotIntervalMinutes ?? 15),
    [slotIntervalMinutes]
  );
}
