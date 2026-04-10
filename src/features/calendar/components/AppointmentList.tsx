import { type FC, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "../../../shared/components/ui/card.tsx";
import type { SlimAppointment, CalendarBlockDto, Appointment } from "../../../shared/types/calendar.ts";
import {
  getDayAppointments,
  getDayBlocks,
  getDayDataLoading,
  getLocationStaff,
  getLocationServices,
  getSelectedLocationId,
  getEffectiveStaffFilterIds,
  getHasActiveCalendarFilters,
  getCalendarTimezone,
} from "../selectors.ts";
import { toggleEditFormAction, toggleAddForm } from "../actions.ts";


import { AppointmentListSkeleton } from "./AppointmentListSkeleton.tsx";

import { SlimAppointmentCard } from "./SlimAppointmentCard.tsx";
import { BlockCard } from "./BlockCard.tsx";
import { CalendarListCountPills } from "./CalendarListCountPills.tsx";
import { buildCalendarColorMap } from "../colors.ts";
import { calendarPreferences } from "../calendarPreferences.ts";
import { SlidersHorizontal, Plus } from "lucide-react";
import { EmptyState } from "../../../shared/components/common/EmptyState.tsx";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ListItem =
  | { type: 'appointment'; data: SlimAppointment; groupSize?: number }
  | { type: 'block'; data: CalendarBlockDto };

// ─────────────────────────────────────────────────────────────
// AppointmentList
// ─────────────────────────────────────────────────────────────

export const AppointmentList: FC = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation("calendar");
  const selectedLocationId = useSelector(getSelectedLocationId);
  const dayAppointments = useSelector(getDayAppointments);
  const dayBlocks = useSelector(getDayBlocks);
  const isDayLoading = useSelector(getDayDataLoading);
  const locationStaff = useSelector(getLocationStaff);
  const locationServices = useSelector(getLocationServices);
  const staffFilter = useSelector(getEffectiveStaffFilterIds);
  const hasActiveFilters = useSelector(getHasActiveCalendarFilters);
  const timezone = useSelector(getCalendarTimezone);

  const handleAppointmentClick = useCallback((appt: SlimAppointment) => {
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
  }, [dispatch]);

  /** Fallback when API omits groupSize (legacy). Prefer `SlimAppointment.groupSize` from POST /calendar/day. */
  const groupSizeMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of dayAppointments) {
      if (a.bookingGroupId) {
        map.set(a.bookingGroupId, (map.get(a.bookingGroupId) ?? 0) + 1);
      }
    }
    return map;
  }, [dayAppointments]);

  const visibleDayAppointments = useMemo(
    () =>
      staffFilter.length > 0
        ? dayAppointments.filter((a) => {
          if (a.isUnassigned || a.staffUserIds.length === 0) return false;
          return a.staffUserIds.some((id) => staffFilter.includes(id));
        })
        : dayAppointments,
    [dayAppointments, staffFilter],
  );

  const colorCodingPref = calendarPreferences.getColorCoding();
  const listKnownColorKeys = useMemo(() => {
    if (colorCodingPref === "staff")
      return staffFilter.length > 0 ? staffFilter : locationStaff.map(s => s.id);
    if (colorCodingPref === "service")
      return locationServices.map(s => s.serviceName);
    return undefined;
  }, [colorCodingPref, staffFilter, locationStaff, locationServices]);
  const appointmentColorMap = useMemo(
    () => buildCalendarColorMap(visibleDayAppointments, colorCodingPref, listKnownColorKeys),
    [visibleDayAppointments, colorCodingPref, listKnownColorKeys],
  );

  // Filter appointments by staff, then merge with blocks and sort chronologically
  const sortedItems = useMemo((): ListItem[] => {
    const apptItems: ListItem[] = visibleDayAppointments.map((a) => ({
      type: 'appointment',
      data: a,
      groupSize: a.bookingGroupId
        ? (a.groupSize ?? groupSizeMap.get(a.bookingGroupId))
        : undefined,
    }));

    const blockItems: ListItem[] = dayBlocks.map((b) => ({ type: 'block', data: b }));

    return [...apptItems, ...blockItems].sort((x, y) => {
      const xStart = x.type === 'appointment' ? x.data.scheduledAt : x.data.startsAt;
      const yStart = y.type === 'appointment' ? y.data.scheduledAt : y.data.startsAt;
      return new Date(xStart).getTime() - new Date(yStart).getTime();
    });
  }, [visibleDayAppointments, dayBlocks, groupSizeMap]);

  const apptCount = sortedItems.filter((i) => i.type === 'appointment').length;
  const blockCount = sortedItems.filter((i) => i.type === 'block').length;

  if (!selectedLocationId) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("page.appointments.selectLocationAppointments")}</p>
        </CardContent>
      </Card>
    );
  }

  if (isDayLoading) {
    return <AppointmentListSkeleton />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2 px-1">
        {apptCount > 0 || blockCount > 0 ? (
          <CalendarListCountPills apptCount={apptCount} blockCount={blockCount} />
        ) : (
          <></>
        )}
      </div>

      {/* Empty state — no appointments AND no blocks */}
      {sortedItems.length === 0 && hasActiveFilters && (
        <EmptyState
          icon={SlidersHorizontal}
          title={t("page.appointments.noMatchFilters")}
          description={t("page.appointments.noMatchFiltersDayDesc")}
          className="h-[calc(100dvh-143px)] !py-0 !justify-center cursor-default"
        />
      )}
      {sortedItems.length === 0 && !hasActiveFilters && (
        <EmptyState
          title={t("page.appointments.nothingScheduled")}
          description={t("page.appointments.nothingScheduledDayDesc")}
          className="h-[calc(100dvh-145px)] !py-0 !justify-center cursor-default"
          actionButton={{
            label: t("page.appointments.addEvent"),
            icon: Plus,
            onClick: () => dispatch(toggleAddForm({ open: true })),
          }}
        />
      )}

      {/* Chronological list */}
      {sortedItems.map((item) =>
        item.type === 'appointment' ? (
          <SlimAppointmentCard
            key={`appt-${item.data.id}`}
            appointment={item.data}
            locationStaff={locationStaff}
            groupSize={item.groupSize}
            colorMap={appointmentColorMap}
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

      {/* Filtered-out notice after list: blocks shown but no appointments match */}
      {sortedItems.length > 0 && apptCount === 0 && hasActiveFilters && (
        <p className="text-sm text-muted-foreground pt-3 cursor-default">
          {t("page.appointments.noMatchFiltersInline")}
        </p>
      )}
    </div>
  );
};
