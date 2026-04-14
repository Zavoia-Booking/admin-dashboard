import { type FC, useMemo } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { cn } from "../../../../shared/lib/utils";
import {
  getCalendarSummary,
  getMonthViewDisplayStart,
  getSelectedDate,
  getCalendarTimezone,
} from "../../selectors";
import { buildMonthCalendarGridCells, getTranslatedDayNames } from "../../utils";
import { formatDateInTimezone } from "../../timezone";
import { DayMarkerGlyph } from "../MiniMonthCalendar";
import { dayMarkerFromSummary } from "../dayMarker";

interface MobileMonthGridProps {
  onDayTap: (day: Date) => void;
}

/**
 * Compact mobile month grid. Shares the exact cell-building logic desktop
 * `AppointmentGrid` uses (via `buildMonthCalendarGridCells` and
 * `dayMarkerFromSummary`) so markers and date math cannot drift.
 */
export const MobileMonthGrid: FC<MobileMonthGridProps> = ({ onDayTap }) => {
  const { t } = useTranslation("calendar");
  const selectedDate = useSelector(getSelectedDate);
  const monthViewDisplayStart = useSelector(getMonthViewDisplayStart);
  const summary = useSelector(getCalendarSummary);
  const timezone = useSelector(getCalendarTimezone);

  const dayCells = useMemo(
    () => buildMonthCalendarGridCells(monthViewDisplayStart, selectedDate ?? new Date()),
    [monthViewDisplayStart, selectedDate],
  );

  const todayStr = new Date().toDateString();
  const weekCount = Math.ceil(dayCells.length / 7);

  return (
    <div className="px-2 pt-2 pb-3">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {getTranslatedDayNames(t).map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-medium text-foreground-2 py-1 uppercase tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border"
        style={{ gridTemplateRows: `repeat(${weekCount}, minmax(0, 1fr))` }}
      >
        {dayCells.map(({ date, isCurrentMonth }) => {
          const dateKey = formatDateInTimezone(date, timezone);
          const daySummary = summary[dateKey];
          const isToday = date.toDateString() === todayStr;
          const isSelected = !!selectedDate && date.toDateString() === selectedDate.toDateString();
          const isClosed = daySummary && !daySummary.isOpen;
          const { kind: marker, tone: markerTone } = dayMarkerFromSummary(daySummary);

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onDayTap(date)}
              className={cn(
                "relative flex flex-col items-center justify-center min-h-[56px] p-1 outline-none",
                isCurrentMonth ? "bg-white dark:bg-surface" : "bg-muted/60 dark:bg-muted/10",
                isCurrentMonth && isClosed && "bg-neutral-50 dark:bg-neutral-900/40",
                isCurrentMonth && isSelected && "bg-primary/10 dark:bg-primary/15",
                "active:bg-primary/15 transition-colors duration-100",
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center rounded-full h-7 w-7 text-xs font-medium tabular-nums",
                  isToday
                    ? "bg-primary text-primary-foreground font-bold"
                    : isSelected
                      ? "bg-primary/20 text-foreground font-semibold"
                      : isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground/50",
                )}
              >
                {date.getDate()}
              </span>
              {marker !== "none" && (
                <span className="mt-0.5 min-h-[8px]">
                  <DayMarkerGlyph kind={marker} tone={markerTone} selected={isSelected} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
