import { type FC, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "../../../shared/components/ui/card.tsx";
import type { SlimAppointment, CalendarBlockDto } from "../../../shared/types/calendar.ts";
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
import { toggleEditFormAction, setDayFiltersAction, setStaffFilter } from "../actions.ts";
import { getAppointmentDetailRequest, getAppointmentGroupRequest } from "../api.ts";
import { Loader2, CalendarX } from "lucide-react";
import { Button } from "../../../shared/components/ui/button.tsx";
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
// AppointmentList
// ─────────────────────────────────────────────────────────────

export const AppointmentList: FC = () => {
  const dispatch = useDispatch();
  const selectedLocationId = useSelector(getSelectedLocationId);
  const dayAppointments = useSelector(getDayAppointments);
  const dayBlocks = useSelector(getDayBlocks);
  const isDayLoading = useSelector(getDayDataLoading);
  const locationStaff = useSelector(getLocationStaff);
  const locationServices = useSelector(getLocationServices);
  const staffFilter = useSelector(getEffectiveStaffFilterIds);
  const hasActiveFilters = useSelector(getHasActiveCalendarFilters);
  const timezone = useSelector(getCalendarTimezone);

  const handleAppointmentClick = useCallback(async (appointment: SlimAppointment) => {
    try {
      const bookingGroupId = appointment.bookingGroupId;
      if (bookingGroupId) {
        const list = await getAppointmentGroupRequest(bookingGroupId);
        const arr = Array.isArray(list) ? list : [];
        const item = arr.find((a: { id: number }) => a.id === appointment.id) ?? arr[0];
        if (item) {
          dispatch(toggleEditFormAction({ open: true, item, groupAppointments: arr }));
        }
      } else {
        const fullAppointment = await getAppointmentDetailRequest(appointment.id);
        dispatch(toggleEditFormAction({ open: true, item: fullAppointment }));
      }
    } catch {
      // silently fail — appointment may have been deleted
    }
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
          <p className="text-sm text-muted-foreground">Select a location to view appointments.</p>
        </CardContent>
      </Card>
    );
  }

  if (isDayLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </CardContent>
      </Card>
    );
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
      {sortedItems.length === 0 && (
        <Card>
          <CardContent className="p-8 flex flex-col items-center gap-3 text-center">
            <CalendarX className="h-8 w-8 text-muted-foreground/50" />
            {hasActiveFilters ? (
              <>
                <p className="text-sm text-muted-foreground">
                  No appointments match your filters for this day.
                </p>
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
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing scheduled for this day.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filtered-out notice: blocks exist but all appointments are filtered */}
      {sortedItems.length > 0 && apptCount === 0 && blockCount > 0 && hasActiveFilters && (
        <div className="flex items-center justify-between px-1 py-2 rounded-md bg-muted/40 text-xs text-muted-foreground">
          <span>No appointments match your filters.</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              dispatch(setDayFiltersAction({}));
              dispatch(setStaffFilter([]));
            }}
          >
            Clear filters
          </Button>
        </div>
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
    </div>
  );
};
