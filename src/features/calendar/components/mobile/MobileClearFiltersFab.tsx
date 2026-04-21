import { type FC, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";
import {
  getDayFilters,
  getHasActiveCalendarFilters,
  getLocationStaff,
} from "../../selectors";
import { setDayFiltersAction, setStaffFilter } from "../../actions";
import { hasAnyDayFilter } from "../../calendarFilters";

/**
 * Floating pill that appears at the bottom of the mobile day view when any
 * calendar filter (staff, service, status, customer search, etc.) is active.
 * Tapping it clears every filter dimension — mirroring the desktop "Clear all"
 * button inside CalendarHeaderFilters.
 *
 * When the current location has exactly one staff member, resetting staff
 * filter to `[]` wouldn't make sense (that staff is the only possible value),
 * so we reset to `[staffId]` to keep the list selector consistent.
 */
export const MobileClearFiltersFab: FC = () => {
  const { t } = useTranslation("calendar");
  const dispatch = useDispatch();
  const hasActiveFilters = useSelector(getHasActiveCalendarFilters);
  const locationStaff = useSelector(getLocationStaff);
  const dayFilters = useSelector(getDayFilters);

  const handleClear = useCallback(() => {
    // Only refetch when there were server-side (day) filters to clear;
    // staff filter is client-side and doesn't require a network round-trip.
    if (hasAnyDayFilter(dayFilters)) {
      dispatch(setDayFiltersAction({}));
    }
    if (locationStaff.length === 1) {
      dispatch(setStaffFilter([locationStaff[0].id]));
    } else {
      dispatch(setStaffFilter([]));
    }
  }, [dispatch, locationStaff, dayFilters]);

  if (!hasActiveFilters) return null;

  return (
    <button
      type="button"
      onClick={handleClear}
      aria-label={t("page.common.clearFilters")}
      className="fixed right-4 z-40 flex items-center gap-2 h-11 px-5 rounded-full bg-white dark:bg-surface text-foreground-1 text-sm font-semibold border border-border active:scale-[0.96] transition-transform duration-100 mobile-clear-filters-enter"
      style={{
        /* Clear the mobile bottom nav (pb-19 = 76 px reserved in AppLayout)
         * plus the device safe-area and a 16 px breathing gap. */
        bottom: "calc(76px + env(safe-area-inset-bottom, 0px) + 16px)",
        /* Promote to its own compositor layer so the calendar's scroll
         * container never has to re-paint because of this overlay. */
        transform: "translateZ(0)",
        willChange: "transform",
      }}
    >
      <RotateCcw className="h-4 w-4 text-primary" aria-hidden />
      <span>{t("page.common.clearFilters")}</span>
    </button>
  );
};
