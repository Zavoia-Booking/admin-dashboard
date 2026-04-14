import { type FC, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../shared/lib/utils.ts";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "../../../shared/components/ui/card.tsx";
import { buildMonthCalendarGridCells, getTranslatedDayNames } from "../utils.ts";
import { formatDateInTimezone, getCalendarLocale } from "../timezone.ts";
import { AppointmentViewMode, AppointmentViewType } from "../types.ts";
import { CalendarTimeGrid } from "./CalendarTimeGrid.tsx";
import { AppointmentList } from "./AppointmentList.tsx";
import { WeekAppointmentList } from "./WeekAppointmentList.tsx";
import type {
  DaySummary,
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
  getCalendarTimezone,
  getLocationStaff,
  getDayFilters,
} from "../selectors.ts";
import { dispatchSelectDateAndDayView } from "../selectDateAndDayViewDispatch.ts";
import { getDayDataRequest } from "../api.ts";
import { AppointmentGroupDialog } from "./timeGrid/AppointmentGroupDialog.tsx";
import type { SlimAppointment, CalendarBlockDto } from "../../../shared/types/calendar.ts";
import { MonthGridSkeleton } from "./MonthGridSkeleton.tsx";
import { SlidersHorizontal } from "lucide-react";
import { EmptyState } from "../../../shared/components/common/EmptyState.tsx";
import { DayMarkerGlyph } from "./MiniMonthCalendar.tsx";
import { dayMarkerFromSummary } from "./dayMarker.ts";

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

interface IProps {
  viewMode: AppointmentViewMode;
}

export const AppointmentGrid: FC<IProps> = ({ viewMode }) => {
  const { t } = useTranslation("calendar");
  const selectedLocationId = useSelector(getSelectedLocationId);
  const viewType = useSelector(getViewTypeSelector);

  if (!selectedLocationId) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("page.appointments.selectLocation")}</p>
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

  // Month view always uses summary grid — wrap in full-height container
  return <SummaryGrid />;
};

// ─────────────────────────────────────────────────────────────
// Summary Grid (Month view)
// ─────────────────────────────────────────────────────────────

const SummaryGrid: FC = () => {
  const { t } = useTranslation("calendar");
  const dispatch = useDispatch();
  const selectedDate = useSelector(getSelectedDate);
  const monthViewDisplayStart = useSelector(getMonthViewDisplayStart);
  const summary = useSelector(getCalendarSummary);
  const isLoading = useSelector(getSummaryLoading);
  const hasActiveFilters = useSelector(getHasActiveCalendarFilters);
  const viewMode = useSelector(getViewModeSelector);
  const calendarTimezone = useSelector(getCalendarTimezone);
  const selectedLocationId = useSelector(getSelectedLocationId);
  const locationStaff = useSelector(getLocationStaff);
  const dayFilters = useSelector(getDayFilters);

  // Day preview dialog state
  const [previewDay, setPreviewDay] = useState<{ day: Date; appointments: SlimAppointment[]; blocks: CalendarBlockDto[] } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleDayClick = useCallback(
    async (day: Date, hasItems: boolean) => {
      if (!hasItems) {
        dispatchSelectDateAndDayView(dispatch, day, viewMode);
        return;
      }
      // Fetch full day data and open dialog
      setPreviewLoading(true);
      setPreviewDay({ day, appointments: [], blocks: [] });
      try {
        const dateKey = formatDateInTimezone(day, calendarTimezone);
        const data = await getDayDataRequest(selectedLocationId!, dateKey, dayFilters);
        setPreviewDay({ day, appointments: data.appointments, blocks: data.blocks });
      } catch {
        dispatchSelectDateAndDayView(dispatch, day, viewMode);
        setPreviewDay(null);
      } finally {
        setPreviewLoading(false);
      }
    },
    [dispatch, viewMode, calendarTimezone, selectedLocationId, dayFilters],
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

  if (isLoading) {
    return <MonthGridSkeleton />;
  }

  const todayStr = new Date().toDateString();

  return (
    <div className="p-4 pb-0">
      {hasActiveFilters && monthHasNoMatchingAppointments ? (
        <EmptyState
          icon={SlidersHorizontal}
          title={t("page.appointments.noMatchFilters")}
          description={t("page.appointments.noMatchFiltersMonthDesc")}
          className="h-[calc(100dvh-115px)] !py-0 !justify-center cursor-default"
        />
      ) : (
        <>
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {getTranslatedDayNames(t).map((day) => (
              <div key={day} className="text-center text-xs font-medium text-foreground-2 py-2 cursor-default">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div
            className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border"
            style={{
              gridTemplateRows: `repeat(${Math.ceil(dayCells.length / 7)}, 1fr)`,
              height: 'calc(100dvh - 168px)',
            }}
          >
            {dayCells.map(({ date, isCurrentMonth }) => {
              const dateKey = formatDateInTimezone(date, calendarTimezone);
              const daySummary: DaySummary | undefined = summary[dateKey];
              const isToday = date.toDateString() === todayStr;
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const isClosed = daySummary && !daySummary.isOpen;

              return (
                <div
                  key={dateKey}
                  className={cn(
                    "relative isolate min-w-0 p-2 overflow-hidden outline-none flex flex-col cursor-pointer",
                    // Base background
                    isCurrentMonth ? "bg-white dark:bg-surface" : "bg-muted/80 dark:bg-muted/10",
                    // Closed overlay
                    isCurrentMonth && isClosed && "bg-neutral-50 dark:bg-neutral-900/40",
                    // Selected overlay
                    isCurrentMonth && isSelected && "bg-primary/5 dark:bg-primary/10",
                    // Hover (only on non-selected current month cells)
                    isCurrentMonth && !isSelected && "hover:bg-primary/5 dark:hover:bg-primary/5",
                  )}
                  onClick={() => handleDayClick(date, (daySummary?.appointmentCount ?? 0) > 0 || (daySummary?.blockedSlots ?? 0) > 0)}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDayClick(date, (daySummary?.appointmentCount ?? 0) > 0 || (daySummary?.blockedSlots ?? 0) > 0); }}
                >
                  {/* Day number — centered */}
                  <div className="flex-1 flex items-center justify-center">
                    <span
                      className={`text-sm font-medium size-8 flex items-center justify-center rounded-full tabular-nums
                                        ${isToday
                          ? 'bg-primary text-primary-foreground font-bold'
                          : isSelected
                            ? 'bg-primary/15 text-foreground font-semibold'
                            : isCurrentMonth
                              ? 'text-foreground'
                              : 'text-muted-foreground/40'
                        }
                                    `}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Closed label — absolute so it doesn't push the date off center */}
                  {isClosed && daySummary && (
                    <div className="absolute bottom-5 left-0 right-0 text-[10px] text-muted-foreground/60 font-medium cursor-default text-center">{t("page.appointments.closed")}</div>
                  )}

                  {/* Density marker — pinned to bottom */}
                  <div className="absolute bottom-2.5 left-0 right-0 flex items-center justify-center min-h-[8px]">
                    {(() => {
                      const { kind, tone } = dayMarkerFromSummary(daySummary);
                      if (kind === "none") return null;
                      return <DayMarkerGlyph kind={kind} tone={tone} selected={isSelected} large />;
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Day preview dialog — opens when clicking a day with appointments */}
      <AppointmentGroupDialog
        appointments={previewDay?.appointments ?? []}
        timeRangeStr={
          previewDay?.day.toLocaleDateString(getCalendarLocale(), { weekday: 'long', month: 'short', day: 'numeric' }) ?? ''
        }
        locationStaff={locationStaff}
        timezone={calendarTimezone}
        day={previewDay?.day ?? new Date()}
        calendarViewMode={AppointmentViewMode.MONTH}
        externalOpen={!!previewDay}
        onExternalClose={() => setPreviewDay(null)}
        loading={previewLoading}
        blocks={previewDay?.blocks}
      />
    </div>
  );
};
