import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getSelectedDate,
  getDisplayedWeekStart,
  getCalendarSummary,
  getCalendarTimezone,
} from "../../selectors";
import { setSelectedDateAction, setDisplayedWeekAction } from "../../actions";
import { getWeekStart, getWeekDays } from "../../utils";
import { formatDateInTimezone, getCalendarLocale } from "../../timezone";
import { dayMarkerFromSummary, DayMarkerGlyph } from "../MiniMonthCalendar";
import { cn } from "../../../../shared/lib/utils";

export interface MobileWeekStripHandle {
  navigateWeek: (dir: 1 | -1) => void;
}

export const MobileWeekStrip = forwardRef<MobileWeekStripHandle>((_, ref) => {
  const dispatch = useDispatch();
  const selectedDate = useSelector(getSelectedDate);
  const displayedWeekStart = useSelector(getDisplayedWeekStart);
  const summary = useSelector(getCalendarSummary);
  const timezone = useSelector(getCalendarTimezone);
  const locale = getCalendarLocale();

  const weekStart = useMemo(
    () => displayedWeekStart ?? getWeekStart(selectedDate),
    [displayedWeekStart, selectedDate],
  );

  /* ── 3 weeks: prev / current / next ── */
  const prevDays = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    return getWeekDays(d);
  }, [weekStart]);
  const currentDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const nextDays = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return getWeekDays(d);
  }, [weekStart]);

  const selectedStr = selectedDate.toDateString();
  const todayStr = useMemo(() => new Date().toDateString(), []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isRecentering = useRef(false);

  /* ── Expose navigateWeek so content area swipe can trigger it ── */
  useImperativeHandle(ref, () => ({
    navigateWeek: (dir: 1 | -1) => {
      const el = scrollRef.current;
      if (!el || isRecentering.current) return;
      const target = dir === 1 ? el.offsetWidth * 2 : 0;
      el.scrollTo({ left: target, behavior: "smooth" });
    },
  }));

  /* ── Stable navigate ref for async scroll listeners ── */
  const navRef = useRef<(dir: 1 | -1) => void>(() => {});
  navRef.current = useCallback(
    (dir: 1 | -1) => {
      const nextWeek = new Date(weekStart);
      nextWeek.setDate(weekStart.getDate() + dir * 7);
      dispatch(setDisplayedWeekAction(nextWeek));
    },
    [dispatch, weekStart],
  );

  /* ── Center scroll on current week (before paint) ── */
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    isRecentering.current = true;
    // Disable snap while repositioning — prevents browser snap engine
    // from fighting the programmatic scrollLeft change
    el.style.scrollSnapType = "none";
    el.scrollLeft = el.offsetWidth;
    // Re-enable snap after browser processes the position, then unlock
    requestAnimationFrame(() => {
      el.style.scrollSnapType = "";
      requestAnimationFrame(() => {
        isRecentering.current = false;
      });
    });
  }, [weekStart]);

  /* ── Detect snap to prev/next panel ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleSettled = () => {
      if (isRecentering.current) return;
      const w = el.offsetWidth;
      const pos = el.scrollLeft;
      if (pos < w * 0.5) {
        isRecentering.current = true;
        navRef.current(-1);
      } else if (pos > w * 1.5) {
        isRecentering.current = true;
        navRef.current(1);
      }
    };

    // Use native scrollend where available, debounced scroll as fallback
    const hasScrollEnd = "onscrollend" in window;
    let timer: ReturnType<typeof setTimeout>;

    if (hasScrollEnd) {
      el.addEventListener("scrollend", handleSettled, { passive: true });
      return () => el.removeEventListener("scrollend", handleSettled);
    }

    const debounced = () => {
      clearTimeout(timer);
      timer = setTimeout(handleSettled, 80);
    };
    el.addEventListener("scroll", debounced, { passive: true });
    return () => {
      el.removeEventListener("scroll", debounced);
      clearTimeout(timer);
    };
  }, []);

  /* ── Day tap ── */
  const handleDayTap = useCallback(
    (day: Date) => {
      dispatch(setSelectedDateAction(day));
    },
    [dispatch],
  );

  /* ── Day abbreviations ── */
  const getAbbrevs = useCallback(
    (days: Date[]) => days.map((d) => d.toLocaleDateString(locale, { weekday: "short" }).slice(0, 2)),
    [locale],
  );
  const prevAbbrevs = useMemo(() => getAbbrevs(prevDays), [getAbbrevs, prevDays]);
  const currAbbrevs = useMemo(() => getAbbrevs(currentDays), [getAbbrevs, currentDays]);
  const nextAbbrevs = useMemo(() => getAbbrevs(nextDays), [getAbbrevs, nextDays]);

  /* ── Render helpers ── */
  const renderDay = (day: Date, abbreviation: string) => {
    const isSelected = day.toDateString() === selectedStr;
    const isToday = day.toDateString() === todayStr;
    const dateKey = formatDateInTimezone(day, timezone);
    const marker = dayMarkerFromSummary(summary[dateKey]);

    return (
      <button
        key={day.toDateString()}
        type="button"
        className="flex-1 flex flex-col items-center gap-0.5 py-1 outline-none cursor-pointer active:scale-95 transition-transform duration-100"
        onClick={() => handleDayTap(day)}
      >
        <span
          className={cn(
            "text-[11px] font-medium leading-none",
            isToday && !isSelected ? "text-primary" : isSelected ? "text-primary" : "text-muted-foreground",
          )}
        >
          {abbreviation}
        </span>
        <div
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-150",
            isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-primary/12 text-primary" : "text-foreground",
          )}
        >
          <span className={cn("text-[15px] leading-none", isSelected || isToday ? "font-semibold" : "font-medium")}>
            {day.getDate()}
          </span>
        </div>
        <div className="h-2 flex items-center justify-center">
          <DayMarkerGlyph kind={marker.kind} tone={marker.tone} selected={false} />
        </div>
      </button>
    );
  };

  const panelClass = "min-w-full shrink-0 flex items-end gap-0 px-3 pt-2.5 pb-1.5 snap-start snap-always";

  return (
    <div
      ref={scrollRef}
      className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide bg-white dark:bg-surface border-b border-border select-none"
      style={{ overscrollBehaviorX: "contain", WebkitOverflowScrolling: "touch" }}
    >
      <div className={panelClass}>{prevDays.map((d, i) => renderDay(d, prevAbbrevs[i]))}</div>
      <div className={panelClass}>{currentDays.map((d, i) => renderDay(d, currAbbrevs[i]))}</div>
      <div className={panelClass}>{nextDays.map((d, i) => renderDay(d, nextAbbrevs[i]))}</div>
    </div>
  );
});
