import { type FC, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { getSelectedLocationId, getViewModeSelector } from "../../selectors";
import { MobileCalendarHeader } from "./MobileCalendarHeader";
import { MobileWeekStrip, type MobileWeekStripHandle } from "./MobileWeekStrip";
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
  const selectedLocationId = useSelector(getSelectedLocationId);
  const viewMode = useSelector(getViewModeSelector);

  const showWeekStrip =
    viewMode === AppointmentViewMode.DAY ||
    viewMode === AppointmentViewMode.WEEK;

  const weekStripRef = useRef<MobileWeekStripHandle>(null);
  const touchRef = useRef({ startX: 0, startY: 0 });

  const handleContentTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current.startX = e.touches[0].clientX;
    touchRef.current.startY = e.touches[0].clientY;
  }, []);

  const handleContentTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    const dy = e.changedTouches[0].clientY - touchRef.current.startY;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
      weekStripRef.current?.navigateWeek(dx < 0 ? 1 : -1);
    }
  }, []);

  return (
    <div
      className="flex flex-col h-[calc(100svh-136px)] bg-white dark:bg-surface"
      style={{ overscrollBehaviorY: "contain" }}
    >
      {/* Compact mobile header */}
      <MobileCalendarHeader onOpenSettings={onOpenSettings} />

      {/* Week day strip — visible in Day and Week modes */}
      {selectedLocationId && showWeekStrip && <MobileWeekStrip ref={weekStripRef} />}

      {/* Content area — horizontal swipe navigates weeks */}
      <div
        className="flex-1 flex flex-col overflow-auto"
        onTouchStart={showWeekStrip ? handleContentTouchStart : undefined}
        onTouchEnd={showWeekStrip ? handleContentTouchEnd : undefined}
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
