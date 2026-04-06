import { type FC, useMemo, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSelectedDate, getCalendarSummary, getViewModeSelector, getSidebarMiniCalendarMonthStart, getCalendarTimezone, getSummaryLoading } from "../selectors.ts";
import { Skeleton } from "../../../shared/components/ui/skeleton.tsx";
import { formatDateInTimezone } from "../timezone.ts";
import { dispatchSelectDateAndDayView } from "../selectDateAndDayViewDispatch.ts";
import { setSidebarMiniCalendarMonthAction, setDisplayedMonthAction } from "../actions.ts";
import { AppointmentViewMode } from "../types.ts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../../shared/lib/utils";
import type { DaySummary } from "../../../shared/types/calendar.ts";

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

/** Appointment density under the day number (matches reference: dot / double / bar). */
type DayMarker = "none" | "dot" | "double" | "triple" | "bar";

/** Appointments use primary; block-only days use warning (amber) — gray reads as “disabled” on date cells; grid blocks use large gray panels, not 4px dots. */
type MarkerTone = "primary" | "blocked";

export function dayMarkerFromSummary(ds: DaySummary | undefined): { kind: DayMarker; tone: MarkerTone } {
  if (!ds) return { kind: "none", tone: "primary" };
  const c = ds.appointmentCount;
  const b = ds.blockedSlots ?? 0;
  if (c === 0 && b === 0) return { kind: "none", tone: "primary" };
  const blockOnly = c === 0 && b > 0;
  const tone: MarkerTone = blockOnly ? "blocked" : "primary";
  if (c > 3) return { kind: "bar", tone };
  if (c === 3) return { kind: "triple", tone };
  if (c === 2) return { kind: "double", tone };
  if (c === 1) return { kind: "dot", tone };
  // Blocks only (no appointments): same density scale as appointments (was capped at double for any b≥2).
  if (b > 3) return { kind: "bar", tone };
  if (b === 3) return { kind: "triple", tone };
  if (b === 2) return { kind: "double", tone };
  return { kind: "dot", tone };
}

/** Bottom marker glyph for appointment density. */
export function DayMarkerGlyph({
  kind,
  tone,
  selected,
  large = false,
}: {
  kind: DayMarker;
  tone: MarkerTone;
  selected: boolean;
  large?: boolean;
}) {
  if (kind === "none") return null;

  const dotFill =
    tone === "blocked"
      ? selected && !large
        ? "bg-primary-foreground"
        : "bg-warning"
      : selected && !large
        ? "bg-primary-foreground"
        : "bg-primary";

  const dotSize = large ? "h-2 w-2" : "h-1 w-1";
  const gap = large ? "gap-1.5" : "gap-0.5";
  const barSize = large ? "h-2 w-10" : "h-1 w-5.5";

  if (kind === "dot") {
    return <span className={cn(dotSize, "shrink-0 rounded-full", dotFill)} aria-hidden />;
  }
  if (kind === "double") {
    return (
      <span className={cn("flex items-center justify-center", gap)} aria-hidden>
        <span className={cn(dotSize, "shrink-0 rounded-full", dotFill)} />
        <span className={cn(dotSize, "shrink-0 rounded-full", dotFill)} />
      </span>
    );
  }
  if (kind === "triple") {
    return (
      <span className={cn("flex items-center justify-center", gap)} aria-hidden>
        <span className={cn(dotSize, "shrink-0 rounded-full", dotFill)} />
        <span className={cn(dotSize, "shrink-0 rounded-full", dotFill)} />
        <span className={cn(dotSize, "shrink-0 rounded-full", dotFill)} />
      </span>
    );
  }
  return (
    <span
      className={cn(
        barSize, "shrink-0 rounded-full",
        tone === "blocked"
          ? selected && !large
            ? "bg-primary-foreground"
            : "bg-gradient-to-r from-warning via-warning/70 to-warning/40"
          : selected && !large
            ? "bg-primary-foreground"
            : "bg-gradient-to-r from-primary via-primary/70 to-primary/35",
      )}
      aria-hidden
    />
  );
}

/**
 * MiniMonthCalendar — compact calendar grid for the sidebar.
 * Shows the month around `displayMonth`, highlights today and selected date,
 * and shows dots for days with appointments.
 */
export const MiniMonthCalendar: FC = () => {
  const dispatch = useDispatch();
  const selectedDate = useSelector(getSelectedDate);
  const summary = useSelector(getCalendarSummary);
  const viewMode = useSelector(getViewModeSelector);
  const storedMiniMonth = useSelector(getSidebarMiniCalendarMonthStart);
  const calendarTimezone = useSelector(getCalendarTimezone);
  const isLoading = useSelector(getSummaryLoading);
  const anchorYear = selectedDate.getFullYear();
  const anchorMonth = selectedDate.getMonth();

  const displayMonth = useMemo(
    () => storedMiniMonth ?? new Date(anchorYear, anchorMonth, 1),
    [storedMiniMonth, anchorYear, anchorMonth],
  );

  useEffect(() => {
    if (!storedMiniMonth) {
      dispatch(setSidebarMiniCalendarMonthAction(new Date(anchorYear, anchorMonth, 1)));
    }
  }, [dispatch, storedMiniMonth, anchorYear, anchorMonth]);

  const handlePrevMonth = useCallback(() => {
    const prev = new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1);
    dispatch(setSidebarMiniCalendarMonthAction(prev));
    if (viewMode === AppointmentViewMode.MONTH) {
      dispatch(setDisplayedMonthAction(prev));
    }
  }, [dispatch, displayMonth, viewMode]);

  const handleNextMonth = useCallback(() => {
    const next = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1);
    dispatch(setSidebarMiniCalendarMonthAction(next));
    if (viewMode === AppointmentViewMode.MONTH) {
      dispatch(setDisplayedMonthAction(next));
    }
  }, [dispatch, displayMonth, viewMode]);

  const handleDayClick = useCallback(
    (day: Date) => {
      dispatchSelectDateAndDayView(dispatch, day, viewMode);
    },
    [dispatch, viewMode],
  );

  // Build calendar cells
  const cells = useMemo(() => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Fill leading empty cells for days before the first of the month (Monday-first)
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
    const result: Array<{ date: Date; isCurrentMonth: boolean } | null> = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      const prevDate = new Date(year, month, 0 - (startDayOfWeek - 1 - i));
      result.push({ date: prevDate, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      result.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }

    // Fill trailing cells to complete the last row
    const remaining = 7 - (result.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        result.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
      }
    }

    return result;
  }, [displayMonth]);

  const todayStr = new Date().toDateString();
  const selectedStr = selectedDate.toDateString();

  const monthLabel = displayMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Month header with nav */}
      <div className="flex items-center justify-between mb-2 pl-2">
        <span className="text-sm font-medium text-foreground-1">{monthLabel}</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-1 transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-1 transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* gap-x creates real column gutters; pills cannot bleed into neighbors */}
      <div className="grid grid-cols-7 gap-x-1.5 gap-y-0.5">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="flex min-h-5 min-w-0 items-center justify-center"
          >
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-x-3 gap-y-3">
        {isLoading
          ? Array.from({ length: cells.length }, (_, i) => (
              <div key={i} className="flex min-h-[2.25rem] min-w-0 items-center justify-center">
                <Skeleton className="size-10.5 rounded-md" />
              </div>
            ))
          : cells.map((cell, i) => {
              if (!cell) {
                return <div key={i} className="flex min-h-[2.25rem] min-w-0 items-center justify-center" />;
              }
              const { date, isCurrentMonth } = cell;
              const isToday = date.toDateString() === todayStr;
              const isSelected = date.toDateString() === selectedStr;

              const dateKey = formatDateInTimezone(date, calendarTimezone);
              const daySummary = summary[dateKey];
              const { kind: marker, tone: markerTone } = dayMarkerFromSummary(daySummary);
              const hasMarker = marker !== "none";

              return (
                <div key={i} className="flex min-h-[2.25rem] min-w-0 items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleDayClick(date)}
                    className={cn(
                      "relative flex !h-10.5 !min-h-0 w-full !w-10.5 !min-w-0 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md text-xs font-medium leading-none transition-colors tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0",
                      !isCurrentMonth && "text-muted-foreground/45",
                      isCurrentMonth && !isToday && !isSelected && "text-foreground-1 hover:bg-primary/15",
                      isToday && !isSelected && "bg-primary/15 font-semibold text-primary",
                      isSelected && "bg-primary font-semibold text-primary-foreground",
                    )}
                  >
                    <span className="flex items-center justify-center">{date.getDate()}</span>
                    {hasMarker ? (
                      <span className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center justify-center">
                        <DayMarkerGlyph kind={marker} tone={markerTone} selected={isSelected} />
                      </span>
                    ) : null}
                  </button>
                </div>
              );
            })
        }
      </div>
    </div>
  );
};
