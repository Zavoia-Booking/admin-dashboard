import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { getSelectedLocationId, getDayDataLoading, getWeekDataLoading } from "../selectors.ts";
import { AppointmentViewMode } from "../types.ts";
import { DayGrid } from "./timeGrid/DayGrid.tsx";
import { WeekGrid } from "./timeGrid/WeekGrid.tsx";
import { DayGridSkeleton } from "./timeGrid/DayGridSkeleton.tsx";
import { WeekGridSkeleton } from "./timeGrid/WeekGridSkeleton.tsx";

// Re-export types that were previously exported from this file
export type { OverlapGroup } from "./timeGrid/overlapUtils.ts";
export type { GridSlot } from "./timeGrid/constants.ts";

interface CalendarTimeGridProps {
  viewMode: AppointmentViewMode;
}

export const CalendarTimeGrid: FC<CalendarTimeGridProps> = ({ viewMode }) => {
  const { t } = useTranslation("calendar");
  const selectedLocationId = useSelector(getSelectedLocationId);
  const isDayLoading = useSelector(getDayDataLoading);
  const isWeekLoading = useSelector(getWeekDataLoading);

  if (!selectedLocationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">{t("page.appointments.selectLocation")}</p>
      </div>
    );
  }

  if (viewMode === AppointmentViewMode.DAY) {
    return (
      <div className="relative">
        {isDayLoading && (
          <div className="absolute inset-0 z-50 bg-white dark:bg-surface">
            <DayGridSkeleton />
          </div>
        )}
        <DayGrid />
      </div>
    );
  }

  return (
    <div className="relative">
      {isWeekLoading && (
        <div className="absolute inset-0 z-50 bg-white dark:bg-surface">
          <WeekGridSkeleton />
        </div>
      )}
      <WeekGrid />
    </div>
  );
};
