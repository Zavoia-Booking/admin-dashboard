import { type FC, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal, Plus } from "lucide-react";
import { EmptyState } from "../../../shared/components/common/EmptyState.tsx";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "../../../shared/components/ui/card.tsx";
import { formatDateInTimezone, getCalendarLocale } from "../timezone.ts";
import type { SlimAppointment, CalendarBlockDto, Appointment } from "../../../shared/types/calendar.ts";
import {
  getWeekData,
  getWeekDataLoading,
  getLocationStaff,
  getLocationServices,
  getSelectedLocationId,
  getEffectiveStaffFilterIds,
  getHasActiveCalendarFilters,
  getWeekViewDisplayStart,
  getSelectedDate,
  getCalendarTimezone,
  getOptimisticBlocks,
  blockOverlapsDate,
} from "../selectors.ts";
import { toggleEditFormAction, toggleAddForm } from "../actions.ts";


import { WeekAppointmentListSkeleton } from "./WeekAppointmentListSkeleton.tsx";

import { getWeekStart } from "../utils.ts";
import { SlimAppointmentCard } from "./SlimAppointmentCard.tsx";
import { BlockCard } from "./BlockCard.tsx";
import { CalendarListCountPills } from "./CalendarListCountPills.tsx";
import { buildCalendarColorMap } from "../colors.ts";
import { calendarPreferences } from "../calendarPreferences.ts";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ListItem =
  | { type: 'appointment'; data: SlimAppointment; groupSize?: number }
  | { type: 'block'; data: CalendarBlockDto };

// ─────────────────────────────────────────────────────────────
// WeekAppointmentList
// ─────────────────────────────────────────────────────────────

export const WeekAppointmentList: FC = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation("calendar");
  const selectedLocationId = useSelector(getSelectedLocationId);
  const weekData = useSelector(getWeekData);
  const isLoading = useSelector(getWeekDataLoading);
  const locationStaff = useSelector(getLocationStaff);
  const locationServicesWeekList = useSelector(getLocationServices);
  const staffFilter = useSelector(getEffectiveStaffFilterIds);
  const hasActiveFilters = useSelector(getHasActiveCalendarFilters);
  const weekDisplayStart = useSelector(getWeekViewDisplayStart);
  const selectedDate = useSelector(getSelectedDate);
  const timezone = useSelector(getCalendarTimezone);
  const optimisticBlocks = useSelector(getOptimisticBlocks);

  const weekDays = useMemo(() => {
    const ws = weekDisplayStart ?? getWeekStart(selectedDate ?? new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws);
      d.setDate(ws.getDate() + i);
      return d;
    });
  }, [weekDisplayStart, selectedDate]);

  const weekVisibleAppointments = useMemo(() => {
    if (!weekData) return [];
    const out: SlimAppointment[] = [];
    for (const day of weekDays) {
      const dateKey = formatDateInTimezone(day, timezone);
      const raw = weekData[dateKey]?.appointments ?? [];
      const visible =
        staffFilter.length > 0
          ? raw.filter((a) => {
            if (a.isUnassigned || a.staffUserIds.length === 0) return false;
            return a.staffUserIds.some((id) => staffFilter.includes(id));
          })
          : raw;
      out.push(...visible);
    }
    return out;
  }, [weekData, weekDays, staffFilter, timezone]);

  const weekColorCodingPref = calendarPreferences.getColorCoding();
  const weekListKnownColorKeys = useMemo(() => {
    if (weekColorCodingPref === "staff")
      return staffFilter.length > 0 ? staffFilter : locationStaff.map(s => s.id);
    if (weekColorCodingPref === "service")
      return locationServicesWeekList.map(s => s.serviceName);
    return undefined;
  }, [weekColorCodingPref, staffFilter, locationStaff, locationServicesWeekList]);
  const weekAppointmentColorMap = useMemo(
    () => buildCalendarColorMap(weekVisibleAppointments, weekColorCodingPref, weekListKnownColorKeys),
    [weekVisibleAppointments, weekColorCodingPref, weekListKnownColorKeys],
  );

  const handleAppointmentClick = useCallback(
    (appt: SlimAppointment) => {
      const placeholder: Appointment = {
        id: appt.id, customer: null, teamMembers: [],
        location: { id: 0, name: '', address: '', description: '', phone: '', email: '' },
        scheduledAt: new Date(appt.scheduledAt), endsAt: new Date(appt.endsAt),
        status: appt.status, notes: '', price: 0, cancellationReason: '',
        createdAt: new Date(), updatedAt: new Date(),
        bookedItemName: appt.bookedItemName, bookingGroupId: appt.bookingGroupId,
        bookingGroupOrder: appt.bookingGroupOrder, bookingSource: appt.bookingSource,
        overrideReason: appt.overrideReason,
      };
      dispatch(toggleEditFormAction({ open: true, item: placeholder }));
    },
    [dispatch]
  );

  if (!selectedLocationId) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("page.appointments.selectLocationAppointments")}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <WeekAppointmentListSkeleton />;
  }

  // Check if entire week is empty
  const weekHasNoItems = weekDays.every((day) => {
    const dateKey = formatDateInTimezone(day, timezone);
    const dayData = weekData?.[dateKey];
    const rawAppts = dayData?.appointments ?? [];
    const visAppts = staffFilter.length > 0
      ? rawAppts.filter((a) => !a.isUnassigned && a.staffUserIds.length > 0 && a.staffUserIds.some((id) => staffFilter.includes(id)))
      : rawAppts;
    const blocks = dayData?.blocks ?? [];
    return visAppts.length === 0 && blocks.length === 0;
  });

  if (weekHasNoItems) {
    return hasActiveFilters ? (
      <EmptyState
        icon={SlidersHorizontal}
        title={t("page.appointments.noMatchFilters")}
        description={t("page.appointments.noMatchFiltersWeekDesc")}
        className="h-[calc(100dvh-115px)] !py-0 !justify-center cursor-default"
      />
    ) : (
      <EmptyState
        title={t("page.appointments.nothingScheduled")}
        description={t("page.appointments.nothingScheduledWeekDesc")}
        className="h-[calc(100dvh-115px)] !py-0 !justify-center cursor-default"
        actionButton={{
          label: t("page.appointments.addEvent"),
          icon: Plus,
          onClick: () => dispatch(toggleAddForm({ open: true })),
          gated: true,
        }}
      />
    );
  }

  return (
    <div className="p-4 pt-0 space-y-6">
      {weekDays.map((day) => {
        const dateKey = formatDateInTimezone(day, timezone);
        const dayData = weekData?.[dateKey];
        const rawAppointments: SlimAppointment[] = dayData?.appointments ?? [];
        const serverBlocks: CalendarBlockDto[] = dayData?.blocks ?? [];
        const dayBlocks: CalendarBlockDto[] = [
          ...serverBlocks,
          ...optimisticBlocks.filter((b) => blockOverlapsDate(b, dateKey, timezone)),
        ];

        const groupSizeMap = new Map<string, number>();
        for (const a of rawAppointments) {
          if (a.bookingGroupId) {
            groupSizeMap.set(a.bookingGroupId, (groupSizeMap.get(a.bookingGroupId) ?? 0) + 1);
          }
        }

        // Filter by staff
        const visibleAppointments = staffFilter.length > 0
          ? rawAppointments.filter((a) => {
            if (a.isUnassigned || a.staffUserIds.length === 0) return false;
            return a.staffUserIds.some((id) => staffFilter.includes(id));
          })
          : rawAppointments;

        // Merge and sort
        const apptItems: ListItem[] = visibleAppointments.map((a) => ({
          type: 'appointment',
          data: a,
          groupSize: a.bookingGroupId
            ? (a.groupSize ?? groupSizeMap.get(a.bookingGroupId))
            : undefined,
        }));
        const blockItems: ListItem[] = dayBlocks.map((b) => ({ type: 'block', data: b }));
        const sortedItems: ListItem[] = [...apptItems, ...blockItems].sort((x, y) => {
          const xStart = x.type === 'appointment' ? x.data.scheduledAt : x.data.startsAt;
          const yStart = y.type === 'appointment' ? y.data.scheduledAt : y.data.startsAt;
          return new Date(xStart).getTime() - new Date(yStart).getTime();
        });

        const apptCount = apptItems.length;
        const blockCount = blockItems.length;
        const dateLabel = day.toLocaleDateString(getCalendarLocale(), {
          weekday: "long",
          month: "short",
          day: "numeric",
        });

        return (
          <section key={dateKey} className="space-y-2 min-h-22">
            {/* Day header */}
            <div className="flex items-center justify-between cursor-default gap-2 px-1 sticky top-0 bg-background/95 py-1.5 z-10">
              <h3 className="text-sm font-semibold text-foreground">{dateLabel}</h3>
              {apptCount > 0 || blockCount > 0 ? (
                <CalendarListCountPills apptCount={apptCount} blockCount={blockCount} />
              ) : (
                <>
                </>
              )}
            </div>

            {/* Empty state — nothing at all */}
            {sortedItems.length === 0 && (
              <p className="text-sm text-muted-foreground py-2 px-1 cursor-default">
                {hasActiveFilters
                  ? t("page.appointments.noMatchFiltersForDay")
                  : t("page.appointments.nothingScheduled")}
              </p>
            )}

            {/* Filtered-out notice: blocks exist but appointments are filtered */}
            {sortedItems.length > 0 && apptCount === 0 && blockCount > 0 && hasActiveFilters && (
              <div className="flex items-center px-1 py-1.5 rounded-md bg-muted/40 text-xs text-muted-foreground cursor-default">
                <span>{t("page.appointments.noMatchFiltersInline")}</span>
              </div>
            )}

            {/* Chronological list */}
            {sortedItems.length > 0 && (
              <div className="space-y-2">
                {sortedItems.map((item) =>
                  item.type === 'appointment' ? (
                    <SlimAppointmentCard
                      key={`appt-${item.data.id}`}
                      appointment={item.data}
                      locationStaff={locationStaff}
                      groupSize={item.groupSize}
                      colorMap={weekAppointmentColorMap}
                      onClick={() => handleAppointmentClick(item.data)}
                    />
                  ) : (
                    <BlockCard
                      key={`block-${item.data.id}`}
                      block={item.data}
                      locationStaff={locationStaff}
                      timezone={timezone ?? undefined}
                    />
                  )
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};
