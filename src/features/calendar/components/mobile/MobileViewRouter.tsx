import { type FC } from "react";
import { useSelector } from "react-redux";
import { getViewModeSelector, getViewTypeSelector } from "../../selectors";
import { AppointmentViewMode, AppointmentViewType } from "../../types";
import { MobileDayListView } from "./MobileDayListView";
import { MobileDayTimeline } from "./MobileDayTimeline";
import { MobileMonthView } from "./MobileMonthView";
import "./mobilePopoverSpring.css";

/**
 * Routes to the correct mobile view based on viewMode + viewType.
 *
 * Mobile exposes only Day and Month. `WEEK` can still land here from a
 * desktop-set preference; we treat it as Day so the user sees a working
 * screen (coercion also happens at hydration in `calendar.tsx`).
 *
 * The rendered view is keyed on mode so React remounts the wrapper on
 * toggle — firing the enter animation via CSS. Month enters from above
 * (the "overview" level); Day enters from below (the "zoomed-in" level).
 * Compositor-only, respects `prefers-reduced-motion`.
 */
export const MobileViewRouter: FC = () => {
  const viewMode = useSelector(getViewModeSelector);
  const viewType = useSelector(getViewTypeSelector);

  const isMonth = viewMode === AppointmentViewMode.MONTH;
  const enterClass = isMonth ? "mobile-view-enter-month" : "mobile-view-enter-day";

  return (
    <div key={isMonth ? "month" : "day"} className={`flex-1 min-h-0 ${enterClass}`}>
      {isMonth ? (
        <MobileMonthView />
      ) : viewType === AppointmentViewType.GRID ? (
        <MobileDayTimeline />
      ) : (
        <MobileDayListView />
      )}
    </div>
  );
};
