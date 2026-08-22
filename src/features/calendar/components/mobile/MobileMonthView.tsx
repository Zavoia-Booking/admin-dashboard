import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
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
/** Slop before a touch inside the list is claimed as a sheet drag rather than
 *  a scroll or a horizontal month swipe. */
const CONTENT_DRAG_THRESHOLD = 4;
/** How far the sheet has to travel — as a fraction of the container — before a
 *  release commits to the detent it was heading for. Distance from where the
 *  drag *started*, not the midpoint between detents: a short push should be
 *  enough to read as intent, the way a native sheet flicks over. */
const SHEET_COMMIT_RATIO = 0.07;

interface MonthEventsSheetProps {
  children: React.ReactNode;
  snap: number;
  onSnapChange: (next: number) => void;
  onSwipeMonth: (dir: 1 | -1) => void;
}

/** Persistent bottom sheet with two snap points, draggable from the handle or
 *  from the list itself: at half, a drag up grows it; at full, a drag down from
 *  the top of the list shrinks it back to half before the list moves.
 *  Absolute-positioned inside the month view's relative container so it
 *  respects the bottom-nav space. */
const MonthEventsSheet: FC<MonthEventsSheetProps> = ({
  children,
  snap,
  onSnapChange,
  onSwipeMonth,
}) => {
  const { t } = useTranslation("calendar");
  const [dragDelta, setDragDelta] = useState<number>(0);
  const dragRef = useRef<{ y: number; snap: number; height: number } | null>(
    null,
  );
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef({ startX: 0, startY: 0 });
  /* A touch that started inside the list. It stays "pending" until the gesture
   * proves itself vertical AND in a direction the list can't consume, at which
   * point it is promoted to a sheet drag; otherwise it is rejected and the
   * browser keeps it (scroll / month swipe). */
  const contentDragRef = useRef<{
    x: number;
    y: number;
    snap: number;
    height: number;
    mode: "pending" | "sheet" | "rejected";
  } | null>(null);
  // State, not the drag refs read during render: the transition has to be off
  // on the same commit the gesture starts, and refs don't re-render.
  const [isDragging, setIsDragging] = useState(false);

  const effectiveSnap = Math.min(
    SHEET_MAX_SNAP,
    Math.max(SHEET_MIN_SNAP, snap + dragDelta),
  );
  const heightPct = `${effectiveSnap * 100}%`;

  /** Detent to land on when a drag that began at `fromSnap` is released. */
  const settleFrom = useCallback(
    (fromSnap: number) => {
      const travelled = effectiveSnap - fromSnap;
      if (travelled > SHEET_COMMIT_RATIO) return SHEET_MAX_SNAP;
      if (travelled < -SHEET_COMMIT_RATIO) return SHEET_MIN_SNAP;
      return fromSnap;
    },
    [effectiveSnap],
  );

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
      setIsDragging(true);
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
      onSnapChange(settleFrom(dragRef.current.snap));
      setDragDelta(0);
      setIsDragging(false);
      dragRef.current = null;
    },
    [settleFrom, onSnapChange],
  );

  /* Native sheets let the *content* drive the detents: at the half detent an
   * upward drag grows the sheet instead of scrolling the list, and at the full
   * detent a downward drag from the top of the list shrinks it back before the
   * list moves. The browser decides who owns a touch from `touch-action`, so it
   * is set per state — the same technique the shared Drawer uses for its own
   * sheets (see `useSheetScrollTouchAction` in components/ui/drawer). */
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const apply = () => {
      if (el.scrollTop > 0) {
        // Mid-list: the scroller owns the gesture outright, in both directions.
        el.style.touchAction = "pan-y";
      } else if (snap <= SHEET_MIN_SNAP) {
        // Half, at the top: nothing to scroll up to, so every vertical drag is
        // the sheet's — up grows it, down is a no-op (there is no lower detent).
        el.style.touchAction = "none";
      } else {
        // Full, at the top: finger-up still scrolls the list natively, while
        // finger-down is left to us so it can shrink the sheet back to half.
        el.style.touchAction = "pan-down";
      }
    };
    apply();
    el.addEventListener("scroll", apply, { passive: true });
    return () => el.removeEventListener("scroll", apply);
  }, [snap]);

  const onContentPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Mouse keeps native wheel scrolling; the handle is the desktop affordance.
      if (e.pointerType === "mouse") return;
      const container = sheetRef.current?.parentElement;
      if (!container) return;
      contentDragRef.current = {
        x: e.clientX,
        y: e.clientY,
        snap,
        height: container.clientHeight,
        mode: "pending",
      };
    },
    [snap],
  );

  const onContentPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = contentDragRef.current;
      if (!drag || drag.mode === "rejected") return;

      if (drag.mode === "pending") {
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (Math.hypot(dx, dy) < CONTENT_DRAG_THRESHOLD) return;
        const atTop = (contentRef.current?.scrollTop ?? 0) <= 0;
        const grows = dy < 0 && drag.snap < SHEET_MAX_SNAP;
        const shrinks = dy > 0 && atTop && drag.snap > SHEET_MIN_SNAP;
        if (Math.abs(dy) <= Math.abs(dx) || (!grows && !shrinks)) {
          drag.mode = "rejected";
          return;
        }
        drag.mode = "sheet";
        // Re-base so the sheet doesn't jump by the slop we just consumed.
        drag.y = e.clientY;
        setIsDragging(true);
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
        return;
      }

      setDragDelta(-(e.clientY - drag.y) / drag.height);
    },
    [],
  );

  const onContentPointerEnd = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = contentDragRef.current;
      contentDragRef.current = null;
      if (drag?.mode !== "sheet") return;
      setIsDragging(false);
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      onSnapChange(settleFrom(drag.snap));
      setDragDelta(0);
    },
    [settleFrom, onSnapChange],
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
        aria-label={t('page.aria.resizeEventsList')}
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
        ref={contentRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        onTouchStart={onContentTouchStart}
        onTouchEnd={onContentTouchEnd}
        onPointerDown={onContentPointerDown}
        onPointerMove={onContentPointerMove}
        onPointerUp={onContentPointerEnd}
        onPointerCancel={onContentPointerEnd}
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
