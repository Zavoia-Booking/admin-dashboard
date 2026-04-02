import { type FC, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "../../../shared/components/ui/card.tsx";
import { buildMonthCalendarGridCells, dayNames } from "../utils.ts";
import { formatDateInTimezone } from "../timezone.ts";
import { AppointmentViewMode, AppointmentViewType } from "../types.ts";
import { CalendarTimeGrid } from "./CalendarTimeGrid.tsx";
import { AppointmentList } from "./AppointmentList.tsx";
import { WeekAppointmentList } from "./WeekAppointmentList.tsx";
import type {
  DaySummary,
  AppointmentPreview,
} from "../../../shared/types/calendar.ts";
import {
  getCalendarSummary,
  getSummaryLoading,
  getSelectedDate,
  getSelectedLocationId,
  getViewTypeSelector,
  getMonthViewDisplayStart,
  getHasActiveCalendarFilters,
  getViewModeSelector,
  getLocationServices,
  getLocationStaff,
  getEffectiveStaffFilterIds,
  getCalendarTimezone,
} from "../selectors.ts";
import { setDayFiltersAction, setStaffFilter } from "../actions.ts";
import { dispatchSelectDateAndDayView } from "../selectDateAndDayViewDispatch.ts";
import { Loader2 } from "lucide-react";
import { Button } from "../../../shared/components/ui/button.tsx";
import { calendarPreferences } from "../calendarPreferences.ts";
import {
  buildCalendarColorMap,
  getAppointmentBlockColors,
  type AppointmentColorInput,
} from "../colors.ts";
import { NO_CUSTOMER_DISPLAY_LABEL } from "./utils.tsx";

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

interface IProps {
  viewMode: AppointmentViewMode;
}

export const AppointmentGrid: FC<IProps> = ({ viewMode }) => {
  const selectedLocationId = useSelector(getSelectedLocationId);
  const viewType = useSelector(getViewTypeSelector);

  if (!selectedLocationId) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Select a location to view the calendar.</p>
        </CardContent>
      </Card>
    );
  }

  // Day & Week views: list view or time grid
  if (viewMode === AppointmentViewMode.DAY || viewMode === AppointmentViewMode.WEEK) {
    if (viewType === AppointmentViewType.LIST) {
      return viewMode === AppointmentViewMode.WEEK ? (
        <WeekAppointmentList />
      ) : (
        <div className="p-4 pt-0 min-h-[86vh]">
          <AppointmentList />
        </div>
      );
    }
    return <CalendarTimeGrid viewMode={viewMode} />;
  }

  // Month view always uses summary grid
  return <SummaryGrid />;
};

// ─────────────────────────────────────────────────────────────
// Summary Grid (Month view)
// ─────────────────────────────────────────────────────────────

const SummaryGrid: FC = () => {
  const dispatch = useDispatch();
  const selectedDate = useSelector(getSelectedDate);
  const monthViewDisplayStart = useSelector(getMonthViewDisplayStart);
  const summary = useSelector(getCalendarSummary);
  const isLoading = useSelector(getSummaryLoading);
  const hasActiveFilters = useSelector(getHasActiveCalendarFilters);
  const viewMode = useSelector(getViewModeSelector);
  const locationServices = useSelector(getLocationServices);
  const locationStaff = useSelector(getLocationStaff);
  const staffFilter = useSelector(getEffectiveStaffFilterIds);
  const calendarTimezone = useSelector(getCalendarTimezone);
  const colorCoding = calendarPreferences.getColorCoding();

  const handleDayClick = useCallback(
    (day: Date) => {
      dispatchSelectDateAndDayView(dispatch, day, viewMode);
    },
    [dispatch, viewMode],
  );

  const dayCells = useMemo(
    () => buildMonthCalendarGridCells(monthViewDisplayStart, selectedDate),
    [monthViewDisplayStart, selectedDate],
  );

  const monthHasNoMatchingAppointments = useMemo(() => {
    for (const { date, isCurrentMonth } of dayCells) {
      if (!isCurrentMonth) continue;
      const ds = summary[formatDateInTimezone(date, calendarTimezone)];
      if (ds && ds.appointmentCount > 0) return false;
    }
    return true;
  }, [summary, dayCells, calendarTimezone]);

  const monthPreviewColorInputs = useMemo((): AppointmentColorInput[] => {
    const inputs: AppointmentColorInput[] = [];
    for (const { date, isCurrentMonth } of dayCells) {
      if (!isCurrentMonth) continue;
      const ds = summary[formatDateInTimezone(date, calendarTimezone)];
      for (const p of ds?.firstAppointments ?? []) {
        inputs.push({
          status: p.status,
          bookedItemName: p.bookedItemName,
          staffUserIds: [],
        });
      }
    }
    return inputs;
  }, [summary, dayCells, calendarTimezone]);

  const monthKnownColorKeys = useMemo(() => {
    if (colorCoding === "service") return locationServices.map(s => s.serviceName);
    if (colorCoding === "staff")
      return staffFilter.length > 0 ? staffFilter : locationStaff.map(s => s.id);
    return undefined;
  }, [colorCoding, locationServices, staffFilter, locationStaff]);
  const monthPreviewColorMap = useMemo(
    () => buildCalendarColorMap(monthPreviewColorInputs, colorCoding, monthKnownColorKeys),
    [monthPreviewColorInputs, colorCoding, monthKnownColorKeys],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading calendar...</span>
      </div>
    );
  }

  const todayStr = new Date().toDateString();

  return (
    <div className="p-4">
      {hasActiveFilters && monthHasNoMatchingAppointments && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 rounded-lg bg-muted/40 border border-border">
          <span className="text-sm text-muted-foreground">
            No appointments match your filters in this month.
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              dispatch(setDayFiltersAction({}));
              dispatch(setStaffFilter([]));
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {dayCells.map(({ date, isCurrentMonth }) => {
          const dateKey = formatDateInTimezone(date, calendarTimezone);
          const daySummary: DaySummary | undefined = summary[dateKey];
          const isToday = date.toDateString() === todayStr;
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const isClosed = daySummary && !daySummary.isOpen;

          return (
            <div
              key={dateKey}
              className={`relative isolate min-h-[100px] min-w-0 bg-background transition-colors cursor-pointer p-1.5 overflow-hidden
                                ${!isCurrentMonth ? 'bg-muted/30 dark:bg-muted/10' : 'hover:bg-muted/20 dark:hover:bg-muted/10'}
                                ${isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''}
                                ${isClosed ? 'bg-muted/20 dark:bg-muted/10' : ''}
                            `}
              onClick={() => handleDayClick(date)}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                                        ${isToday
                      ? 'bg-primary text-primary-foreground font-bold'
                      : isCurrentMonth
                        ? 'text-foreground'
                        : 'text-muted-foreground/50'
                    }
                                        ${isSelected && !isToday ? 'ring-2 ring-primary' : ''}
                                    `}
                >
                  {date.getDate()}
                </span>

                {/* Dot indicators */}
                {daySummary && (
                  <div className="flex items-center gap-0.5">
                    {daySummary.appointmentCount > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title={`${daySummary.appointmentCount} appointment(s)`} />
                    )}
                    {daySummary.blockedSlots > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" title={`${daySummary.blockedSlots} block(s)`} />
                    )}
                  </div>
                )}
              </div>

              {/* Summary content */}
              <div className="space-y-0.5">
                {daySummary && (
                  <>
                    {isClosed && (
                      <div className="text-[10px] text-muted-foreground italic">Closed</div>
                    )}
                    {daySummary.appointmentCount > 0 && !isClosed && (
                      <div className="text-[10px] font-medium text-muted-foreground">
                        {daySummary.appointmentCount} appt{daySummary.appointmentCount !== 1 ? 's' : ''}
                      </div>
                    )}
                    {/* Preview appointments — use same color coding as grid (staff mode: no staff ids in summary, so falls back to 'unassigned' tint) */}
                    {daySummary.firstAppointments?.slice(0, 3).map((preview: AppointmentPreview) => {
                      const { backgroundColor, color } = getAppointmentBlockColors(
                        { status: preview.status, bookedItemName: preview.bookedItemName, staffUserIds: [] },
                        colorCoding,
                        monthPreviewColorMap,
                      );
                      return (
                        <div
                          key={preview.id}
                          className="text-[10px] truncate rounded px-1 py-px font-medium"
                          style={{ backgroundColor, color }}
                        >
                          {preview.bookedItemName || preview.customerName || NO_CUSTOMER_DISPLAY_LABEL}
                        </div>
                      );
                    })}
                    {(daySummary.firstAppointments?.length ?? 0) > 3 && (
                      <div className="text-[10px] text-muted-foreground pl-1">
                        +{(daySummary.firstAppointments?.length ?? 0) - 3} more
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
