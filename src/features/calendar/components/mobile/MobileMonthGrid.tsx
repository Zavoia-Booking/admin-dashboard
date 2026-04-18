import { type FC, useCallback, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { cn } from "../../../../shared/lib/utils";
import {
  getCalendarSummary,
  getMonthViewDisplayStart,
  getSelectedDate,
  getCalendarTimezone,
  getSummaryLoading,
} from "../../selectors";
import { buildMonthCalendarGridCells, getTranslatedDayNames } from "../../utils";
import { formatDateInTimezone } from "../../timezone";
import { DayMarkerGlyph } from "../MiniMonthCalendar";
import { dayMarkerFromSummary } from "../dayMarker";
import { Skeleton } from "../../../../shared/components/ui/skeleton";

interface MobileMonthGridProps {
  /** Called on day tap. `hasItems` lets the parent skip the /calendar/day
   *  round-trip when the summary marker says there's nothing to show —
   *  mirrors desktop `AppointmentGrid.handleDayClick` gating. */
  onDayTap: (day: Date, hasItems: boolean) => void;
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
  const isSummaryLoading = useSelector(getSummaryLoading);

  const dayCells = useMemo(
    () => buildMonthCalendarGridCells(monthViewDisplayStart, selectedDate ?? new Date()),
    [monthViewDisplayStart, selectedDate],
  );

  const todayStr = new Date().toDateString();
  const weekCount = Math.ceil(dayCells.length / 7);

  /* Direction of the last month change → drives the slide-in animation.
   * Compare current monthViewDisplayStart to the previous render's value. */
  const prevMonthRef = useRef<number | null>(null);
  const monthKey = monthViewDisplayStart?.getTime() ?? 0;
  const slideFrom: "right" | "left" =
    prevMonthRef.current !== null && monthKey < prevMonthRef.current
      ? "left"
      : "right";
  prevMonthRef.current = monthKey;

  /* ── Pulse the currently-selected cell on selection change or Today tap ── */
  const selectedPillRef = useRef<HTMLSpanElement>(null);
  const pulseSelected = useCallback(() => {
    const el = selectedPillRef.current;
    if (!el) return;
    el.classList.remove("mobile-selected-pulse");
    void el.offsetWidth;
    el.classList.add("mobile-selected-pulse");
  }, []);

  const isFirstSelectedDateRender = useRef(true);
  useEffect(() => {
    if (isFirstSelectedDateRender.current) {
      isFirstSelectedDateRender.current = false;
      return;
    }
    pulseSelected();
  }, [selectedDate, pulseSelected]);

  useEffect(() => {
    window.addEventListener("calendar:today-pulse", pulseSelected);
    return () => window.removeEventListener("calendar:today-pulse", pulseSelected);
  }, [pulseSelected]);

  return (
    <div className="px-3 pt-2 pb-3">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 mb-1">
        {getTranslatedDayNames(t).map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-1.5"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid — borderless, transparent cells. Key remounts on month change
       *  so the slide-in animation re-fires. Apple-style spring easing for
       *  a smoother feel than Tailwind's default ease-out. */}
      <div
        key={monthKey}
        className={cn(
          "grid grid-cols-7",
          "motion-safe:animate-in motion-safe:fade-in-0",
          "motion-safe:[animation-duration:380ms]",
          "motion-safe:[animation-timing-function:cubic-bezier(0.32,0.72,0,1)]",
          slideFrom === "right"
            ? "motion-safe:slide-in-from-right-16"
            : "motion-safe:slide-in-from-left-16",
        )}
        style={{ gridTemplateRows: `repeat(${weekCount}, minmax(0, 1fr))` }}
      >
        {dayCells.map(({ date, isCurrentMonth }) => {
          const dateKey = formatDateInTimezone(date, timezone);
          const daySummary = summary[dateKey];
          const isToday = date.toDateString() === todayStr;
          const isSelected = !!selectedDate && date.toDateString() === selectedDate.toDateString();
          const isClosed = daySummary && !daySummary.isOpen;
          const { kind: marker, tone: markerTone } = dayMarkerFromSummary(daySummary);
          const hasItems =
            (daySummary?.appointmentCount ?? 0) > 0 ||
            (daySummary?.blockedSlots ?? 0) > 0;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onDayTap(date, hasItems)}
              className="relative flex flex-col items-center justify-start min-h-[60px] py-1.5 outline-none active:opacity-60 transition-opacity"
            >
              <span
                ref={isSelected ? selectedPillRef : undefined}
                className={cn(
                  "flex items-center justify-center rounded-lg h-9 w-9 text-sm leading-none tabular-nums transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold"
                    : isToday
                      ? "border-[1.5px] border-primary text-primary font-semibold"
                      : isCurrentMonth
                        ? isClosed
                          ? "text-muted-foreground"
                          : "text-foreground"
                        : "text-muted-foreground/40",
                )}
              >
                {date.getDate()}
              </span>
              {marker !== "none" ? (
                <span className="mt-1.5 flex min-h-[6px] items-center justify-center">
                  <DayMarkerGlyph kind={marker} tone={markerTone} selected={false} />
                </span>
              ) : isSummaryLoading && isCurrentMonth && !daySummary ? (
                <span className="mt-1.5 flex min-h-[6px] items-center justify-center">
                  <Skeleton className="h-1.5 w-5 rounded-full" aria-hidden />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};
