import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type {
  DayDataResponse,
  SlimAppointment,
  CalendarBlockDto,
} from "../../../../shared/types/calendar";
import {
  getSelectedLocationId,
  getDayFilters,
  getCalendarTimezone,
  getSelectedDate,
  getMonthViewDisplayStart,
} from "../../selectors";
import {
  setSelectedDateAction,
  setDisplayedMonthAction,
} from "../../actions";
import { formatDateInTimezone } from "../../timezone";
import { isSameDay } from "../../utils";
import { getDayDataRequest } from "../../api";
import { useDayListFromRaw } from "../../hooks/useDayAppointmentList";
import { MobileMonthGrid } from "./MobileMonthGrid";
import { MobileDayListView } from "./MobileDayListView";

const SHEET_MIN_SNAP = 0.4;
const SHEET_MAX_SNAP = 0.85;
const SHEET_SNAP_TRANSITION =
  "height 300ms cubic-bezier(0.32, 0.72, 0, 1)";
const SWIPE_THRESHOLD = 50;

interface MonthEventsSheetProps {
  children: React.ReactNode;
  snap: number;
  onSnapChange: (next: number) => void;
  onSwipeMonth: (dir: 1 | -1) => void;
}

/** Persistent bottom sheet with two snap points. Drag only from the handle
 *  so content inside stays scrollable; absolute-positioned inside the month
 *  view's relative container so it respects the bottom-nav space. */
const MonthEventsSheet: FC<MonthEventsSheetProps> = ({
  children,
  snap,
  onSnapChange,
  onSwipeMonth,
}) => {
  const [dragDelta, setDragDelta] = useState<number>(0);
  const dragRef = useRef<{ y: number; snap: number; height: number } | null>(
    null,
  );
  const sheetRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef({ startX: 0, startY: 0 });
  const isDragging = dragRef.current !== null;

  const effectiveSnap = Math.min(
    SHEET_MAX_SNAP,
    Math.max(SHEET_MIN_SNAP, snap + dragDelta),
  );
  const heightPct = `${effectiveSnap * 100}%`;

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const container = sheetRef.current?.parentElement;
      if (!container) return;
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      dragRef.current = {
        y: e.clientY,
        snap,
        height: container.clientHeight,
      };
    },
    [snap],
  );

  const onHandlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return;
      const deltaY = e.clientY - dragRef.current.y;
      setDragDelta(-deltaY / dragRef.current.height);
    },
    [],
  );

  const onHandlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return;
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      const mid = (SHEET_MIN_SNAP + SHEET_MAX_SNAP) / 2;
      onSnapChange(effectiveSnap >= mid ? SHEET_MAX_SNAP : SHEET_MIN_SNAP);
      setDragDelta(0);
      dragRef.current = null;
    },
    [effectiveSnap, onSnapChange],
  );

  /* Horizontal swipe inside the sheet → change month. Vertical scroll inside
   * the list is unaffected because we only fire on dominant horizontal motion. */
  const onContentTouchStart = useCallback((e: React.TouchEvent) => {
    swipeRef.current.startX = e.touches[0].clientX;
    swipeRef.current.startY = e.touches[0].clientY;
  }, []);

  const onContentTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - swipeRef.current.startX;
      const dy = e.changedTouches[0].clientY - swipeRef.current.startY;
      if (Math.abs(dx) <= SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy) * 1.5) {
        return;
      }
      onSwipeMonth(dx < 0 ? 1 : -1);
    },
    [onSwipeMonth],
  );

  return (
    <div
      ref={sheetRef}
      data-month-events-sheet
      className="absolute inset-x-0 bottom-0 z-30 flex flex-col bg-white dark:bg-surface border-t border-border rounded-t-2xl shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.12)] will-change-[height]"
      style={{
        height: heightPct,
        transition: isDragging ? "none" : SHEET_SNAP_TRANSITION,
      }}
    >
      <div
        role="slider"
        aria-label="Resize events list"
        aria-valuemin={Math.round(SHEET_MIN_SNAP * 100)}
        aria-valuemax={Math.round(SHEET_MAX_SNAP * 100)}
        aria-valuenow={Math.round(effectiveSnap * 100)}
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
        className="pt-2 pb-1.5 shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <div
          className="mx-auto h-1.5 w-[60px] rounded-full bg-border-strong dark:bg-neutral-500"
          aria-hidden
        />
      </div>
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        onTouchStart={onContentTouchStart}
        onTouchEnd={onContentTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Mobile MONTH-mode container. In MONTH mode the saga fetches only the month
 * `summary` (marker dots), not day data — so when a cell is tapped we fire a
 * one-off `/calendar/day` request (same pattern as desktop
 * `AppointmentGrid.handleDayClick`) and pipe the result through the shared
 * {@link useDayListFromRaw} so filter/sort/color logic matches every other
 * list view.
 */
export const MobileMonthView: FC = () => {
  const dispatch = useDispatch();
  const selectedLocationId = useSelector(getSelectedLocationId);
  const dayFilters = useSelector(getDayFilters);
  const timezone = useSelector(getCalendarTimezone);

  const [fetchedAppointments, setFetchedAppointments] = useState<SlimAppointment[]>([]);
  const [fetchedBlocks, setFetchedBlocks] = useState<CalendarBlockDto[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const fetchDay = useCallback(
    async (day: Date, signal?: AbortSignal) => {
      if (!selectedLocationId) {
        setFetchedAppointments([]);
        setFetchedBlocks([]);
        return;
      }
      setIsFetching(true);
      try {
        const dateKey = formatDateInTimezone(day, timezone);
        const data: DayDataResponse = await getDayDataRequest(
          selectedLocationId,
          dateKey,
          dayFilters,
        );
        if (signal?.aborted) return;
        setFetchedAppointments(data.appointments);
        setFetchedBlocks(data.blocks);
      } catch {
        if (signal?.aborted) return;
        setFetchedAppointments([]);
        setFetchedBlocks([]);
      } finally {
        if (!signal?.aborted) setIsFetching(false);
      }
    },
    [selectedLocationId, dayFilters, timezone],
  );

  const selectedDate = useSelector(getSelectedDate);

  const handleDayTap = useCallback(
    (day: Date, hasItems: boolean) => {
      const sameDay = isSameDay(day, selectedDate);
      if (!sameDay) dispatch(setSelectedDateAction(day));

      // Summary says there's nothing to show — skip the /calendar/day round-trip.
      if (!hasItems) {
        if (!sameDay) {
          setFetchedAppointments([]);
          setFetchedBlocks([]);
        }
        return;
      }

      // Re-tapping the same day: we already have (or are fetching) its data.
      if (sameDay) return;

      void fetchDay(day);
    },
    [dispatch, fetchDay, selectedDate],
  );

  // Initial load when the component mounts or location changes — fetch the currently selected day.
  useEffect(() => {
    if (!selectedDate) return;
    const controller = new AbortController();
    void fetchDay(selectedDate, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocationId, dayFilters]);

  const data = useDayListFromRaw(fetchedAppointments, fetchedBlocks, isFetching);

  /* Sheet snap state lifted up so the calendar area can collapse it on tap
   * and so the swipe handler can dispatch month changes from inside the sheet. */
  const [sheetSnap, setSheetSnap] = useState(SHEET_MIN_SNAP);
  const displayedMonthStart = useSelector(getMonthViewDisplayStart);

  const handleSwipeMonth = useCallback(
    (dir: 1 | -1) => {
      const base =
        displayedMonthStart ??
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const target = new Date(base.getFullYear(), base.getMonth() + dir, 1);
      dispatch(setDisplayedMonthAction(target));
    },
    [dispatch, displayedMonthStart, selectedDate],
  );

  /* When the sheet is expanded, ANY click outside it collapses it.
   * - Click inside the calendar grid: also block the day-cell selection
   *   (capture-phase stopPropagation prevents the button's onClick from firing).
   * - Click on header buttons / anywhere else outside the sheet: collapse only,
   *   let the click do its thing. */
  useEffect(() => {
    if (sheetSnap !== SHEET_MAX_SNAP) return;
    const onDocClickCapture = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      // 1. Click inside our sheet → keep open (scrolling the list, tapping a card).
      if (target.closest("[data-month-events-sheet]")) return;
      // 2. Click inside any open Radix drawer / dialog (e.g. the appointment or
      //    block summary drawer stacked on top) → keep sheet open. The user is
      //    still working with the list context; closing the summary shouldn't
      //    yank the sheet down.
      if (
        target.closest(
          "[data-slot=drawer-content], [data-slot=drawer-overlay], [data-slot=dialog-content], [data-slot=dialog-overlay], [role=dialog]",
        )
      ) {
        return;
      }
      // 3. Click on the calendar grid area → block day-cell selection AND collapse.
      if (target.closest("[data-month-calendar-area]")) {
        e.stopPropagation();
        e.preventDefault();
      }
      // 4. Anywhere else (header buttons, etc.) → let the click fire normally AND collapse.
      setSheetSnap(SHEET_MIN_SNAP);
    };
    document.addEventListener("click", onDocClickCapture, true);
    return () =>
      document.removeEventListener("click", onDocClickCapture, true);
  }, [sheetSnap]);

  /* Any month change (sheet swipe, calendar-area swipe, header arrows) collapses
   * the sheet so the new month is visible. Selection-only changes don't trigger
   * this since selectedDate ≠ displayedMonthStart. */
  const isMountRef = useRef(true);
  useEffect(() => {
    if (isMountRef.current) {
      isMountRef.current = false;
      return;
    }
    setSheetSnap(SHEET_MIN_SNAP);
  }, [displayedMonthStart]);

  return (
    <div className="relative h-full overflow-hidden">
      <div
        data-month-calendar-area
        className="h-full overflow-y-auto"
        style={{ paddingBottom: `${SHEET_MIN_SNAP * 100}%` }}
      >
        <MobileMonthGrid onDayTap={handleDayTap} />
      </div>
      <MonthEventsSheet
        snap={sheetSnap}
        onSnapChange={setSheetSnap}
        onSwipeMonth={handleSwipeMonth}
      >
        <MobileDayListView data={data} />
      </MonthEventsSheet>
    </div>
  );
};
