import { type FC } from "react";
import { useSelector } from "react-redux";
import { getSelectedDate, getViewTypeSelector } from "../../selectors";
import { AppointmentViewType } from "../../types";
import { useWeekDayFromWeekData } from "../../hooks/useWeekDayFromWeekData";
import { MobileDayListView } from "./MobileDayListView";
import { MobileDayTimeline } from "./MobileDayTimeline";

/**
 * Mobile WEEK-mode container. The week strip (rendered at layout level) owns
 * day navigation; this component just renders the selected day's events out
 * of `weekData`. Same card components as DAY mode — logic lives in the
 * shared `useWeekDayFromWeekData` hook so desktop/mobile cannot drift.
 */
export const MobileWeekView: FC = () => {
  const selectedDate = useSelector(getSelectedDate);
  const viewType = useSelector(getViewTypeSelector);
  const data = useWeekDayFromWeekData(selectedDate ?? new Date());

  if (viewType === AppointmentViewType.GRID) {
    return <MobileDayTimeline data={data} />;
  }
  return <MobileDayListView data={data} />;
};
