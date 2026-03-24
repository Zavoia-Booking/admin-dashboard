import { type FC, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSelectedDate, getCalendarSummary } from "../selectors.ts";
import { setSelectedDateAction, setViewModeAction } from "../actions.ts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../../shared/lib/utils";
import type { DaySummary } from "../../../shared/types/calendar.ts";
import { AppointmentViewMode } from "../types.ts";

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

/** Appointment density under the day number (matches reference: dot / double / bar). */
type DayMarker = "none" | "dot" | "double" | "triple" | "bar";

function dayMarkerFromSummary(ds: DaySummary | undefined): DayMarker {
  if (!ds) return "none";
  const c = ds.appointmentCount;
  const b = ds.blockedSlots ?? 0;
  if (c === 0 && b === 0) return "none";
  if (c > 3) return "bar";
  if (c === 3) return "triple";
  if (c === 2) return "double";
  if (c === 1) return "dot";
  // Blocks only (no appointments)
  if (b >= 2) return "double";
  return "dot";
}

/** Bottom marker glyph for appointment density. */
function DayMarkerGlyph({
  kind,
  selected,
}: {
  kind: DayMarker;
  selected: boolean;
}) {
  if (kind === "none") return null;

  const dotFill = selected ? "bg-primary-foreground" : "bg-primary";

  if (kind === "dot") {
    return <span className={cn("h-1 w-1 shrink-0 rounded-full", dotFill)} aria-hidden />;
  }
  if (kind === "double") {
    return (
      <span className="flex items-center justify-center gap-0.5" aria-hidden>
        <span className={cn("h-1 w-1 shrink-0 rounded-full", dotFill)} />
        <span className={cn("h-1 w-1 shrink-0 rounded-full", dotFill)} />
      </span>
    );
  }
  if (kind === "triple") {
    return (
      <span className="flex items-center justify-center gap-0.5" aria-hidden>
        <span className={cn("h-1 w-1 shrink-0 rounded-full", dotFill)} />
        <span className={cn("h-1 w-1 shrink-0 rounded-full", dotFill)} />
        <span className={cn("h-1 w-1 shrink-0 rounded-full", dotFill)} />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "h-1 w-5.5 shrink-0 rounded-full",
        selected
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

  // The mini calendar can navigate independently from the main calendar
  const [displayMonth, setDisplayMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const handlePrevMonth = useCallback(() => {
    setDisplayMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setDisplayMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleDayClick = useCallback((day: Date) => {
    dispatch(setSelectedDateAction(day));
    dispatch(setViewModeAction(AppointmentViewMode.DAY));
  }, [dispatch]);

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
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground-1">{monthLabel}</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-1 transition-colors hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-foreground-1 transition-colors hover:bg-muted"
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

      <div className="grid grid-cols-7 gap-x-1.5 gap-y-1">
        {cells.map((cell, i) => {
          if (!cell) {
            return <div key={i} className="flex min-h-[2.25rem] min-w-0 items-center justify-center" />;
          }
          const { date, isCurrentMonth } = cell;
          const isToday = date.toDateString() === todayStr;
          const isSelected = date.toDateString() === selectedStr;

          const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
          const daySummary = summary[dateKey];
          const marker = dayMarkerFromSummary(daySummary);
          const hasMarker = marker !== "none";

          return (
            <div key={i} className="flex min-h-[2.25rem] min-w-0 items-center justify-center">
              <button
                type="button"
                onClick={() => handleDayClick(date)}
                className={cn(
                  "relative flex h-9 w-full max-w-[1.75rem] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md text-xs font-medium leading-none transition-colors tabular-nums",
                  !isCurrentMonth && "text-muted-foreground/45",
                  isCurrentMonth && !isToday && !isSelected && "text-foreground-1 hover:bg-primary/15",
                  isToday && !isSelected && "bg-primary/15 font-semibold text-primary",
                  isSelected && "bg-primary font-semibold text-primary-foreground",
                )}
              >
                <span className="flex items-center justify-center">{date.getDate()}</span>
                {hasMarker ? (
                  <span className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center justify-center">
                    <DayMarkerGlyph kind={marker} selected={isSelected} />
                  </span>
                ) : null}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
