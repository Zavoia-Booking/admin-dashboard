import { type FC, useCallback, useEffect, useState } from "react";
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
} from "../../selectors";
import { setSelectedDateAction } from "../../actions";
import { formatDateInTimezone } from "../../timezone";
import { getDayDataRequest } from "../../api";
import { useDayListFromRaw } from "../../hooks/useDayAppointmentList";
import { MobileMonthGrid } from "./MobileMonthGrid";
import { MobileDayListView } from "./MobileDayListView";

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

  const handleDayTap = useCallback(
    (day: Date) => {
      dispatch(setSelectedDateAction(day));
      void fetchDay(day);
    },
    [dispatch, fetchDay],
  );

  // Initial load when the component mounts or location changes — fetch the currently selected day.
  const selectedDate = useSelector(getSelectedDate);
  useEffect(() => {
    if (!selectedDate) return;
    const controller = new AbortController();
    void fetchDay(selectedDate, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocationId, dayFilters]);

  const data = useDayListFromRaw(fetchedAppointments, fetchedBlocks, isFetching);

  return (
    <div className="flex flex-col h-full">
      <MobileMonthGrid onDayTap={handleDayTap} />
      <div className="flex-1 overflow-auto border-t border-border">
        <MobileDayListView data={data} />
      </div>
    </div>
  );
};
