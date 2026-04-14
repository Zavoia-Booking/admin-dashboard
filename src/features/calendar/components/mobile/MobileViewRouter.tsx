import { type FC } from "react";
import { useSelector } from "react-redux";
import { getViewModeSelector, getViewTypeSelector } from "../../selectors";
import { AppointmentViewMode, AppointmentViewType } from "../../types";
import { MobileDayListView } from "./MobileDayListView";
import { MobileDayTimeline } from "./MobileDayTimeline";
import { MobileWeekView } from "./MobileWeekView";
import { MobileMonthView } from "./MobileMonthView";

/**
 * Routes to the correct mobile view based on viewMode + viewType.
 *
 * Phase 3: Day list
 * Phase 4: Day timeline (viewType === GRID)
 * Phase 5: Week view (list + timeline, data picked out of weekData for the selected day)
 * Phase 6: Month view
 */
export const MobileViewRouter: FC = () => {
  const viewMode = useSelector(getViewModeSelector);
  const viewType = useSelector(getViewTypeSelector);

  if (viewMode === AppointmentViewMode.MONTH) {
    return <MobileMonthView />;
  }

  if (viewMode === AppointmentViewMode.WEEK) {
    return <MobileWeekView />;
  }

  // DAY mode
  if (viewType === AppointmentViewType.GRID) {
    return <MobileDayTimeline />;
  }
  return <MobileDayListView />;
};
