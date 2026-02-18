import { useMemo, useCallback } from "react";
import type { WorkingHours } from "../../../shared/types/location";
import {
  getWorkingHoursForDate,
  getDayOpenCloseMinutes,
  isSlotOutsideWorkingHours,
} from "../workingHours";

/**
 * Returns day working hours, bounds, and a slot checker for the given date.
 * Used by AddAppointmentSlider; CreateBlockDrawer uses the util directly for two dates.
 */
export function useWorkingHoursForDate(
  date: Date | null,
  workingHours: WorkingHours | null,
  open247: boolean
) {
  const dayWorkingHours = useMemo(
    () => (date ? getWorkingHoursForDate(date, workingHours, open247) : null),
    [date, workingHours, open247]
  );

  const workingMinutesBounds = useMemo(
    () => getDayOpenCloseMinutes(dayWorkingHours, open247),
    [dayWorkingHours, open247]
  );

  const isSlotOutsideHours = useCallback(
    (slot: string) =>
      isSlotOutsideWorkingHours(slot, date, workingHours, open247),
    [date, workingHours, open247]
  );

  return {
    dayWorkingHours,
    workingMinutesBounds,
    isSlotOutsideHours,
  };
}
