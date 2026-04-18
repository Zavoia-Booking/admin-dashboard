import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  getMonthViewDisplayStart,
  getSelectedDate,
  getSelectedLocationId,
  getViewModeSelector,
} from "../../selectors";
import { setDisplayedMonthAction } from "../../actions";
import { MobileCalendarHeader } from "./MobileCalendarHeader";
import { MobileWeekStrip } from "./MobileWeekStrip";
import { MobileViewRouter } from "./MobileViewRouter";
import { AppointmentViewMode } from "../../types";


const SWIPE_THRESHOLD = 50;

interface MobileCalendarLayoutProps {
  onOpenSettings: () => void;
}

export const MobileCalendarLayout: FC<MobileCalendarLayoutProps> = ({
  onOpenSettings,
}) => {
  const { t } = useTranslation("calendar");
  const dispatch = useDispatch();
  const selectedLocationId = useSelector(getSelectedLocationId);
  const viewMode = useSelector(getViewModeSelector);
  const selectedDate = useSelector(getSelectedDate);
  const displayedMonthStart = useSelector(getMonthViewDisplayStart);

  const showWeekStrip = viewMode === AppointmentViewMode.DAY;
  const isMonthView = viewMode === AppointmentViewMode.MONTH;
  // Day-view week navigation is owned by the week strip's own scroll-snap;
  // only Month-view month navigation uses the content-area swipe.
  const isSwipeEnabled = isMonthView;

  const touchRef = useRef({ startX: 0, startY: 0 });

  /* Scroll-direction collapse: hide the location header when scrolling down,
   * show it when scrolling up. Uses a scroll listener on the content area. */
  const contentRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const cumDelta = useRef(0);
  const ticking = useRef(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  // Reset header to expanded on any view/date/location change
  useEffect(() => {
    setHeaderCollapsed(false);
    lastScrollY.current = 0;
    cumDelta.current = 0;
  }, [viewMode, selectedDate, selectedLocationId, displayedMonthStart]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const THRESHOLD = 15;

    const update = () => {
      const y = Math.max(0, el.scrollTop);
      const delta = y - lastScrollY.current;
      const maxScroll = el.scrollHeight - el.clientHeight;

      // Accumulate delta in current direction; reset on direction change
      if ((delta > 0 && cumDelta.current >= 0) || (delta < 0 && cumDelta.current <= 0)) {
        cumDelta.current += delta;
      } else {
        cumDelta.current = delta;
      }

      // Only act when outside elastic bounce zones
      if (y > 10 && y < maxScroll - 10) {
        if (cumDelta.current > THRESHOLD) {
          setHeaderCollapsed(true);
          cumDelta.current = 0;
        } else if (cumDelta.current < -THRESHOLD) {
          setHeaderCollapsed(false);
          cumDelta.current = 0;
        }
      }

      lastScrollY.current = y;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(update);
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const handleContentTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current.startX = e.touches[0].clientX;
    touchRef.current.startY = e.touches[0].clientY;
  }, []);

  const handleContentTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isMonthView) return;
      const dx = e.changedTouches[0].clientX - touchRef.current.startX;
      const dy = e.changedTouches[0].clientY - touchRef.current.startY;
      if (Math.abs(dx) <= SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy) * 1.5) {
        return;
      }
      const dir: 1 | -1 = dx < 0 ? 1 : -1;
      const base =
        displayedMonthStart ??
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const target = new Date(base.getFullYear(), base.getMonth() + dir, 1);
      dispatch(setDisplayedMonthAction(target));
    },
    [dispatch, isMonthView, displayedMonthStart, selectedDate],
  );

  return (
    <div
      className="flex flex-col h-[calc(100svh-136px)] bg-white dark:bg-surface"
      style={{ overscrollBehaviorY: "contain" }}
    >
      {/* Compact mobile header — collapses on scroll-down, expands on scroll-up.
       *  Uses translateY (not overflow-hidden) so location dropdown / popovers
       *  that extend below the header aren't clipped. Negative margin reclaims
       *  the space when collapsed. */}
      <div
        className="relative z-20 transition-[transform,margin] duration-150 ease-out"
        style={{
          transform: headerCollapsed ? "translateY(-62px)" : "translateY(0)",
          marginBottom: headerCollapsed ? -62 : 0,
        }}
      >
        <MobileCalendarHeader onOpenSettings={onOpenSettings} />
      </div>

      {/* Week day strip — visible in Day mode; owns its own swipe for week nav. */}
      {selectedLocationId && showWeekStrip && <MobileWeekStrip />}

      {/* Content area — horizontal swipe navigates months in Month view only. */}
      <div
        ref={contentRef}
        className="flex-1 flex flex-col overflow-auto"
        onTouchStart={isSwipeEnabled ? handleContentTouchStart : undefined}
        onTouchEnd={isSwipeEnabled ? handleContentTouchEnd : undefined}
      >
        {!selectedLocationId ? (
          <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("page.appointments.selectLocation")}
            </p>
          </div>
        ) : (
          <MobileViewRouter />
        )}
      </div>
    </div>
  );
};
