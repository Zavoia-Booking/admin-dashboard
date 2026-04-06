import { type FC, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useNowTick } from "./useNowTick.ts";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import {
  getDayAppointments,
  getDayDisplayBlocks,
  getDayBlocks,
  getDayDataLoading,
  getLocationStaff,
  getLocationContext,
  getLocationWorkingHours,
  getLocationOpen247,
  getSelectedDate,
  getEffectiveStaffFilterIds,
  getHasActiveCalendarFilters,
  getBookingSettings,
  getCalendarTimezone,
  getLocationServices,
  getLocationBundles,
  getScrollToNow,
} from "../../selectors.ts";
import {
  updateAppointment,
  rescheduleAppointmentGroup,
  setCalendarPendingDrop,
  setDayFiltersAction,
  setStaffFilter,
  toggleAddForm,
  setScrollToNow,
} from "../../actions.ts";
import type {
  SlimAppointment,
  CalendarDisplayBlock,
  CalendarBlockDto,
} from "../../../../shared/types/calendar.ts";
import {
  getWorkingHoursForDate,
  getDayOpenCloseHours,
  getDayOpenCloseMinutes,
  getSlotStartsInRange,
  getTimePositionForGrid,
  isTimeRangeOutsideWorkingHours,
} from "../../workingHours.ts";
import { getMinutesInTimezone, formatDateInTimezone, buildZonedDateFromDateKey } from "../../timezone.ts";
import { isSlimAppointmentSchedulingLocked } from "../../calendarScheduling.ts";
import {
  countSegmentsSameBookingGroup,
  isMultiSegmentGroupDrag,
  evaluateDayTimeSlotDrop,
  evaluateDayStaffColumnDrop,
  isDayTimeSlotForbiddenForPreview,
  isDayStaffColumnDropDisabled,
} from "../../dndDropEligibility.ts";
import { buildCalendarColorMap } from "../../colors.ts";
import { calendarPreferences } from "../../calendarPreferences.ts";
import { AppointmentBlock } from "../AppointmentBlock.tsx";
import { DndContext, DragOverlay, MeasuringStrategy, pointerWithin } from "@dnd-kit/core";
import type { CollisionDetection, DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis, snapCenterToCursor } from "@dnd-kit/modifiers";
import type { AppointmentDragData, TimeSlotDropData, StaffColumnDropData } from "../CalendarDnD.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../shared/components/ui/avatar.tsx";
import { getStaffAvatarColor } from "../../colors.ts";
import { Button } from "../../../../shared/components/ui/button.tsx";
import { ShieldAlert, SlidersHorizontal } from "lucide-react";
import { EmptyState } from "../../../../shared/components/common/EmptyState.tsx";
import { toast } from "sonner";

import { TimeColumn } from "./TimeColumn.tsx";
import { DroppableColumn } from "./DroppableColumn.tsx";
import { ConfirmDropDialog } from "./ConfirmDropDialog.tsx";
import { OverrideDialog } from "./OverrideDialog.tsx";
import { useGridDndState } from "./useGridDndState.ts";
import { displayBlockToSlim, parseDraggableActiveAppointmentId, getBlockOverlapGroups, getTimePosition } from "./overlapUtils.ts";
import { BlockDetailPopover } from "./BlockDetailPopover.tsx";
import { getCalendarBlockReasonIcon } from "../blockReasonMeta.ts";
import { formatTimeRange } from "../utils.tsx";
import { BlockGroupDialog } from "./BlockGroupDialog.tsx";
import {
  GRID_HEIGHT_PER_HOUR,
  GRID_HOURS,
  GUTTER_WIDTH,
  HOUR_HEIGHT,
  EMPTY_FORBIDDEN_SLOT_SET,
  COLUMN_SCROLL_THRESHOLD,
  formatHourLabel,
  formatNowLabel,
  type GridSlot,
} from "./constants.ts";

export const DayGrid: FC = () => {
  const {
    dispatch,
    pendingDrop,
    updateConflictOffer,
    activeId,
    setActiveId,
    overId,
    setOverId,
    dropConfirmInProgress,
    setDropConfirmInProgress,
    confirmModalDelayedOpen,
    overrideReasonText,
    setOverrideReasonText,
    overrideDialogOpen,
    setOverrideDialogOpen,
    pendingReschedulePayload,
    setPendingReschedulePayload,
    dndSessionRef,
    dndSensors,
    handleDragStart,
    handleDragOver,
    handleConfirmOverride,
    handleCancelDrop,
    handleConfirmConflictOverride,
    handleCancelConflictOverride,
  } = useGridDndState();

  const collisionDetection: CollisionDetection = useCallback((args) => pointerWithin(args), []);

  const selectedDate = useSelector(getSelectedDate);
  const dayAppointments = useSelector(getDayAppointments);
  const dayDisplayBlocks = useSelector(getDayDisplayBlocks);
  const dayBlocks = useSelector(getDayBlocks);
  const hasActiveFilters = useSelector(getHasActiveCalendarFilters);
  const isLoading = useSelector(getDayDataLoading);
  const scrollToNow = useSelector(getScrollToNow);
  const locationStaff = useSelector(getLocationStaff);
  const locationServices = useSelector(getLocationServices);
  const locationBundles = useSelector(getLocationBundles);
  const locationContext = useSelector(getLocationContext);
  const workingHours = useSelector(getLocationWorkingHours);
  const open247 = useSelector(getLocationOpen247);
  const staffFilter = useSelector(getEffectiveStaffFilterIds);
  const bookingSettings = useSelector(getBookingSettings);
  const calendarTimezone = useSelector(getCalendarTimezone);
  const bufferTimeMinutes = bookingSettings?.bufferTimeMinutes ?? 0;

  const dayWorkingHours = getWorkingHoursForDate(selectedDate, workingHours, open247);
  const isOpen = open247 || (dayWorkingHours?.isOpen ?? false);
  const isToday = formatDateInTimezone(selectedDate, calendarTimezone) === formatDateInTimezone(new Date(), calendarTimezone);
  const { openHour, closeHour } = getDayOpenCloseHours(dayWorkingHours, open247, 6, 22);
  const dateKey = formatDateInTimezone(selectedDate, calendarTimezone);

  const slotIntervalMinutes = bookingSettings?.slotIntervalMinutes ?? 15;
  const dayBounds = getDayOpenCloseMinutes(dayWorkingHours, open247);
  const daySlotMinutes = getSlotStartsInRange(0, 24 * 60, slotIntervalMinutes);
  const dayGridSlotStarts: GridSlot[] = daySlotMinutes.map((m) => ({
    hour: Math.floor(m / 60),
    minute: m % 60,
  }));
  const dayGridStartMinutes = daySlotMinutes[0] ?? 0;
  const daySlotHeight = daySlotMinutes.length > 0
    ? (GRID_HEIGHT_PER_HOUR / (60 / slotIntervalMinutes))
    : HOUR_HEIGHT;

  useNowTick(isToday);

  const nowMinutes = calendarTimezone
    ? getMinutesInTimezone(new Date().toISOString(), calendarTimezone)
    : new Date().getHours() * 60 + new Date().getMinutes();
  const nowGutterTop = 32 /* h-8 header offset */ + ((nowMinutes - dayGridStartMinutes) / slotIntervalMinutes) * daySlotHeight;
  const is24h = calendarPreferences.getTimeFormat() === '24h';
  const nowLabel = formatNowLabel(nowMinutes, is24h);

  // Scroll to "now" line only when the scrollToNow flag is set (Today button / initial load).
  // Prev/next navigation preserves scroll position.
  useLayoutEffect(() => {
    if (!scrollToNow || !isToday || isLoading) return;
    const sc = document.querySelector<HTMLElement>("[data-calendar-scroll]");
    if (!sc) return;
    sc.scrollTop = Math.max(0, nowGutterTop - sc.clientHeight / 2);
    dispatch(setScrollToNow(false));
  }, [isLoading, isToday, scrollToNow, dateKey, nowGutterTop, dispatch]);

  const showFilterEmptyBanner =
    !isLoading &&
    isOpen &&
    hasActiveFilters &&
    dayAppointments.length === 0 &&
    dayBlocks.length === 0;

  // Build visible columns (respect staff filter)
  const columns = useMemo(() => {
    if (locationStaff.length === 0) {
      return [{
        id: 0,
        label: locationContext?.location.name ?? 'Location',
        isUnassigned: true,
      }];
    }

    const staffCols = locationStaff.map(s => ({
      id: s.id,
      label: `${s.firstName} ${s.lastName}`,
      isUnassigned: false,
    }));

    const visibleStaffCols = staffFilter.length > 0
      ? staffCols.filter(col => staffFilter.includes(col.id))
      : staffCols;

    return visibleStaffCols;
  }, [locationStaff, staffFilter, locationContext]);

  const isScrollableGrid = columns.length > COLUMN_SCROLL_THRESHOLD;

  // Group display blocks by column
  const displayBlocksByColumn = useMemo(() => {
    const map = new Map<number, CalendarDisplayBlock[]>();
    columns.forEach(col => map.set(col.id, []));

    for (const block of dayDisplayBlocks) {
      if (block.isUnassigned || block.staffUserIds.length === 0) {
        if (map.has(0)) {
          map.get(0)?.push(block);
        }
      } else {
        for (const staffId of block.staffUserIds) {
          if (map.has(staffId)) {
            map.get(staffId)!.push(block);
          }
        }
      }
    }
    return map;
  }, [dayDisplayBlocks, columns]);

  // Slim-like list per column for rendering
  const appointmentsByColumn = useMemo(() => {
    const map = new Map<number, SlimAppointment[]>();
    columns.forEach(col => {
      const blocks = displayBlocksByColumn.get(col.id) ?? [];
      map.set(col.id, blocks.map(displayBlockToSlim));
    });
    return map;
  }, [displayBlocksByColumn, columns]);

  const activeAppointment = useMemo(() => {
    if (!activeId) return null;
    const id = parseDraggableActiveAppointmentId(String(activeId));
    if (id == null) return null;
    return dayAppointments.find((a) => a.id === id) ?? null;
  }, [activeId, dayAppointments]);

  const activeDragIsGroupRestricted = useMemo(() => {
    if (!activeAppointment) return false;
    const n = countSegmentsSameBookingGroup(dayAppointments, activeAppointment.bookingGroupId);
    return isMultiSegmentGroupDrag(activeAppointment, n);
  }, [activeAppointment, dayAppointments]);

  // When a drop is pending (or group drag in progress), show the appointment(s) at the drop/hover position
  const appointmentsByColumnWithPreview = useMemo(() => {

    // Live group drag preview
    if (overId && activeAppointment && activeDragIsGroupRestricted) {
      const map = new Map<number, SlimAppointment[]>();
      columns.forEach(col => {
        const list = appointmentsByColumn.get(col.id) ?? [];
        map.set(col.id, [...list]);
      });
      const overStr = String(overId);
      const match = overStr.match(/^slot-(\d+)-(.+)-(\d+)-(\d+)$/);
      if (match) {
        const [, , , hourStr, minStr] = match;
        const dropSlotMin = parseInt(hourStr, 10) * 60 + parseInt(minStr, 10);
        const groupId = activeAppointment.bookingGroupId?.trim();
        if (groupId) {
          const groupSegments = dayAppointments
            .filter((a) => (a.bookingGroupId?.trim() ?? "") === groupId)
            .sort((a, b) => (a.bookingGroupOrder ?? 0) - (b.bookingGroupOrder ?? 0));
          if (groupSegments.length > 1) {
            const groupFirstStartMs = new Date(groupSegments[0].scheduledAt).getTime();
            const draggedStartMs = new Date(activeAppointment.scheduledAt).getTime();
            const draggedOffsetMin = (draggedStartMs - groupFirstStartMs) / 60000;
            const newGroupStartMin = dropSlotMin - draggedOffsetMin;

            // Remove sibling segments from their columns so they can be re-added at preview positions.
            // Keep the actively dragged segment in place — its DraggableAppointmentBlock must stay
            // mounted so dnd-kit preserves event.active.data through onDragEnd.
            const siblingIds = new Set(groupSegments.filter((s) => s.id !== activeAppointment.id).map((s) => s.id));
            columns.forEach((col) => {
              const list = map.get(col.id) ?? [];
              map.set(col.id, list.filter((a) => !siblingIds.has(a.id)));
            });
            for (const seg of groupSegments) {
              if (seg.id === activeAppointment.id) continue;
              const segStartMs = new Date(seg.scheduledAt).getTime();
              const segOffsetMin = (segStartMs - groupFirstStartMs) / 60000;
              const previewStartMin = Math.round(newGroupStartMin + segOffsetMin);
              const durationMin = (new Date(seg.endsAt).getTime() - segStartMs) / 60000;
              const hh = String(Math.floor(previewStartMin / 60)).padStart(2, '0');
              const mm = String(previewStartMin % 60).padStart(2, '0');
              const previewStart = buildZonedDateFromDateKey(dateKey, `${hh}:${mm}`, calendarTimezone);
              const previewEnd = new Date(previewStart.getTime() + durationMin * 60000);
              const colId = seg.staffUserIds?.[0] ?? 0;
              if (!map.has(colId)) continue;
              map.get(colId)!.push({
                ...seg,
                scheduledAt: previewStart.toISOString(),
                endsAt: previewEnd.toISOString(),
              });
            }
            return map;
          }
        }
      }
    }

    const pd = pendingDrop;
    if (!pd) return appointmentsByColumn;

    // Clone only when we need to modify for preview
    const map = new Map<number, SlimAppointment[]>();
    columns.forEach(col => {
      const list = appointmentsByColumn.get(col.id) ?? [];
      map.set(col.id, [...list]);
    });

    // Group drop preview
    if (pd.type === "reschedule" && pd.isGroupDrop && pd.segmentsPreview?.length) {
      const segmentIds = new Set(pd.segmentsPreview.map((s) => s.id));
      columns.forEach((col) => {
        const list = map.get(col.id) ?? [];
        map.set(col.id, list.filter((a) => !segmentIds.has(a.id)));
      });
      for (const seg of pd.segmentsPreview) {
        const colId = seg.staffUserIds?.[0] ?? 0;
        if (!map.has(colId)) continue;
        const full = dayAppointments.find((a) => a.id === seg.id);
        const previewAppt: SlimAppointment = full
          ? { ...full, scheduledAt: seg.startIso, endsAt: seg.endIso }
          : {
            id: seg.id,
            scheduledAt: seg.startIso,
            endsAt: seg.endIso,
            status: pd.appointment.status,
            bookedItemName: pd.appointment.bookedItemName,
            duration: Math.round((new Date(seg.endIso).getTime() - new Date(seg.startIso).getTime()) / 60000),
            staffUserIds: seg.staffUserIds,
            customerName: pd.appointment.customerName,
            bookingSource: pd.appointment.bookingSource,
            isUnassigned: false,
            bookingGroupId: pd.bookingGroupId ?? undefined,
            notes: pd.appointment.notes ?? undefined,
          };
        const list = map.get(colId)!;
        map.set(colId, [...list, previewAppt]);
      }
      return map;
    }

    const appointment = pd.appointment;
    const appointmentId = appointment.id;
    const targetCol = pd.type === "reassign" ? pd.staffId : pd.columnId;

    const removeFrom = (colId: number) => {
      const list = map.get(colId);
      if (list) map.set(colId, list.filter((a) => a.id !== appointmentId));
    };
    const addTo = (colId: number, appt: SlimAppointment) => {
      const list = map.get(colId) ?? [];
      map.set(colId, [...list, appt]);
    };

    columns.forEach((col) => removeFrom(col.id));
    if (pd.type === "reschedule") {
      const minute = pd.minute ?? 0;
      const previewStartsAt = buildZonedDateFromDateKey(
        pd.dateKey,
        `${String(pd.hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        calendarTimezone,
      );
      const previewEndsAt = new Date(previewStartsAt.getTime() + appointment.duration * 60 * 1000);
      addTo(targetCol, {
        ...appointment,
        scheduledAt: previewStartsAt.toISOString(),
        endsAt: previewEndsAt.toISOString(),
      });
    } else {
      addTo(targetCol, appointment);
    }
    return map;
  }, [appointmentsByColumn, columns, pendingDrop, dayAppointments, calendarTimezone, activeDragIsGroupRestricted ? overId : null, activeAppointment, activeDragIsGroupRestricted, dateKey]);

  // Group blocks by column — staff-scoped only; location/business blocks rendered as spanning overlays
  const blocksByColumn = useMemo(() => {
    const map = new Map<number, CalendarBlockDto[]>();
    columns.forEach(col => map.set(col.id, []));
    for (const block of dayBlocks) {
      if (block.blockScope === 'staff' && block.userId && map.has(block.userId)) {
        map.get(block.userId)!.push(block);
      }
    }
    return map;
  }, [dayBlocks, columns]);

  // Location / business-wide blocks — span all staff columns as a single overlay
  const sharedBlocks = useMemo(() =>
    dayBlocks.filter(b => b.blockScope !== 'staff'),
    [dayBlocks],
  );
  const sharedTimedBlockGroups = useMemo(() =>
    getBlockOverlapGroups(sharedBlocks.filter(b => !b.isAllDay)),
    [sharedBlocks],
  );

  // Position helper for shared block overlays (mirrors TimeColumn's getPos)
  const getSharedBlockPos = useCallback((startsAt: string, endsAt: string) => {
    if (dayGridSlotStarts.length > 0) {
      return getTimePositionForGrid(startsAt, endsAt, dayGridStartMinutes, slotIntervalMinutes, daySlotHeight, calendarTimezone);
    }
    return getTimePosition(startsAt, endsAt, calendarTimezone);
  }, [dayGridSlotStarts.length, dayGridStartMinutes, slotIntervalMinutes, daySlotHeight, calendarTimezone]);

  /** Stable slot-click handler — avoids inline closures that defeat React.memo on DroppableSlot. */
  const slotClickColumnsRef = useRef(columns);
  slotClickColumnsRef.current = columns;
  const handleSlotClick = useCallback((hour: number, minute?: number, columnId?: number) => {
    const col = columnId != null ? slotClickColumnsRef.current.find(c => c.id === columnId) : undefined;
    const hh = String(hour).padStart(2, "0");
    const mm = String(minute ?? 0).padStart(2, "0");
    dispatch(
      toggleAddForm({
        open: true,
        prefill: {
          date: selectedDate,
          time: `${hh}:${mm}`,
          staffUserId: col?.isUnassigned ? undefined : col?.id,
        },
      }),
    );
  }, [dispatch, selectedDate]);

  const colorCoding = calendarPreferences.getColorCoding();
  const dayKnownColorKeys = useMemo(() => {
    if (colorCoding === "staff") return columns.map(c => c.id);
    if (colorCoding === "service") return locationServices.map(s => s.serviceName);
    return undefined;
  }, [colorCoding, columns, locationServices]);
  const dayColorMap = useMemo(() => {
    const allAppts: SlimAppointment[] = [];
    for (const list of appointmentsByColumn.values()) {
      allAppts.push(...list);
    }
    return buildCalendarColorMap(allAppts, colorCoding, dayKnownColorKeys);
  }, [appointmentsByColumn, colorCoding, dayKnownColorKeys]);

  /** Slot ids within the dragged appointment's (or group's) duration range */
  const prevDurationHighlightRef = useRef<ReadonlySet<string>>(EMPTY_FORBIDDEN_SLOT_SET);
  const dayDurationHighlightSlotIds = useMemo(() => {
    if (!overId || !activeAppointment || slotIntervalMinutes <= 0) return EMPTY_FORBIDDEN_SLOT_SET;
    const overStr = String(overId);
    const match = overStr.match(/^slot-(\d+)-(.+)-(\d+)-(\d+)$/);
    if (!match) return EMPTY_FORBIDDEN_SLOT_SET;
    const [, colId, dk, hourStr, minStr] = match;
    const dropSlotMin = parseInt(hourStr, 10) * 60 + parseInt(minStr, 10);

    const groupId = activeAppointment.bookingGroupId?.trim();
    const groupSegments = groupId
      ? dayAppointments
          .filter((a) => (a.bookingGroupId?.trim() ?? "") === groupId)
          .sort((a, b) => (a.bookingGroupOrder ?? 0) - (b.bookingGroupOrder ?? 0))
      : [];
    const isGroup = groupSegments.length > 1;

    if (isGroup) {
      // Highlight each segment's individual time range in its own staff column
      const groupFirstStartMs = new Date(groupSegments[0].scheduledAt).getTime();
      const draggedStartMs = new Date(activeAppointment.scheduledAt).getTime();
      const draggedOffsetMin = (draggedStartMs - groupFirstStartMs) / 60000;
      const newGroupStartMin = dropSlotMin - draggedOffsetMin;

      const ids = new Set<string>();
      for (const seg of groupSegments) {
        const segStartMs = new Date(seg.scheduledAt).getTime();
        const segEndMs = new Date(seg.endsAt).getTime();
        const segOffsetMin = (segStartMs - groupFirstStartMs) / 60000;
        const segDurationMin = (segEndMs - segStartMs) / 60000;
        const segPreviewStartMin = Math.round(newGroupStartMin + segOffsetMin);
        const segColId = seg.staffUserIds?.[0] ?? 0;
        const segSlotsNeeded = Math.ceil(segDurationMin / slotIntervalMinutes);
        for (let i = 0; i < segSlotsNeeded; i++) {
          const m = segPreviewStartMin + i * slotIntervalMinutes;
          if (m < 0 || m >= 24 * 60) continue;
          ids.add(`slot-${segColId}-${dk}-${Math.floor(m / 60)}-${m % 60}`);
        }
      }
      return ids;
    }

    const slotsNeeded = Math.ceil(activeAppointment.duration / slotIntervalMinutes);
    const ids = new Set<string>();
    for (let i = 0; i < slotsNeeded; i++) {
      const m = Math.round(dropSlotMin) + i * slotIntervalMinutes;
      if (m < 0 || m >= 24 * 60) continue;
      ids.add(`slot-${colId}-${dk}-${Math.floor(m / 60)}-${m % 60}`);
    }
    // Stabilize reference: if contents match previous, reuse old Set to prevent DroppableSlot re-renders
    const prev = prevDurationHighlightRef.current;
    if (ids.size === prev.size && [...ids].every(id => prev.has(id))) return prev;
    prevDurationHighlightRef.current = ids;
    return ids;
  }, [overId, activeAppointment, slotIntervalMinutes, dayAppointments]);

  const daySlotRowsForForbidden = useMemo(
    () =>
      dayGridSlotStarts.length > 0
        ? dayGridSlotStarts
        : GRID_HOURS.map((hour) => ({ hour, minute: 0 as const })),
    [dayGridSlotStarts],
  );

  const prevForbiddenRef = useRef<ReadonlySet<string>>(EMPTY_FORBIDDEN_SLOT_SET);
  const dayForbiddenSlotIds = useMemo(() => {
    if (!activeId || !activeAppointment) return EMPTY_FORBIDDEN_SLOT_SET;
    if (activeAppointment.status === "cancelled") return EMPTY_FORBIDDEN_SLOT_SET;
    if (isSlimAppointmentSchedulingLocked(activeAppointment, dayAppointments)) {
      return EMPTY_FORBIDDEN_SLOT_SET;
    }
    const session = dndSessionRef.current;
    if (!session || session.dragData.appointment.id !== activeAppointment.id) {
      return EMPTY_FORBIDDEN_SLOT_SET;
    }
    const { nowMs, dragData } = session;
    const useSlots = dayGridSlotStarts.length > 0;
    const forbidden = new Set<string>();
    for (const col of columns) {
      for (const slot of daySlotRowsForForbidden) {
        const slotId = useSlots
          ? `slot-${col.id}-${dateKey}-${slot.hour}-${slot.minute}`
          : `slot-${col.id}-${dateKey}-${slot.hour}`;
        if (
          isDayTimeSlotForbiddenForPreview({
            appointment: activeAppointment,
            sourceColumnId: dragData.columnId,
            sourceDateKey: dragData.dateKey,
            targetColumnId: col.id,
            targetDateKey: dateKey,
            targetHour: slot.hour,
            targetMinute: slot.minute,
            nowMs,
            calendarTimezone,
            dayAppointments,
            appointmentsByColumn,
            blocksByColumn,
            locationServices,
            locationBundles,
            targetColumnLabel: col.label,
            bufferTimeMinutes,
          })
        ) {
          forbidden.add(slotId);
        }
      }
    }
    const prev = prevForbiddenRef.current;
    if (forbidden.size === prev.size && [...forbidden].every(id => prev.has(id))) return prev;
    prevForbiddenRef.current = forbidden;
    return forbidden;
  }, [
    activeId,
    activeAppointment,
    columns,
    daySlotRowsForForbidden,
    dayGridSlotStarts.length,
    dateKey,
    calendarTimezone,
    dayAppointments,
    appointmentsByColumn,
    blocksByColumn,
    locationServices,
    locationBundles,
    bufferTimeMinutes,
    dndSessionRef,
  ]);

  const schedulingLockedAppointmentIds = useMemo(() => {
    const ids = new Set<number>();
    for (const a of dayAppointments) {
      if (isSlimAppointmentSchedulingLocked(a, dayAppointments)) {
        ids.add(a.id);
      }
    }
    return ids;
  }, [dayAppointments]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    dndSessionRef.current = null;
    setActiveId(null);
    setOverId(null);
    const nowMs = Date.now();
    const data = event.active.data?.current as AppointmentDragData | null;
    const overData = event.over?.data?.current as TimeSlotDropData | StaffColumnDropData | null;
    if (!data || data.type !== "appointment" || !overData) return;
    const appointment = data.appointment;
    if (appointment.status === "cancelled") return;
    if (isSlimAppointmentSchedulingLocked(appointment, dayAppointments)) return;

    const groupSegCountOnDay = countSegmentsSameBookingGroup(dayAppointments, appointment.bookingGroupId);
    const isGroupDragRestricted = isMultiSegmentGroupDrag(appointment, groupSegCountOnDay);

    if (overData.type === "staff-column") {
      const r = evaluateDayStaffColumnDrop({
        appointment,
        staffId: overData.staffId,
        staffLabel: overData.label,
        isGroupDragRestricted,
        appointmentsByColumn,
        locationServices,
        locationBundles,
        bufferTimeMinutes,
      });
      if (!r.allowed) {
        if (r.toastMessage) toast.error(r.toastMessage);
        return;
      }
      dispatch(
        setCalendarPendingDrop({
          type: "reassign",
          appointment,
          staffId: overData.staffId,
          staffLabel: overData.label,
        }),
      );
      return;
    }

    if (overData.type === "time-slot") {
      const label = columns.find((c) => c.id === overData.columnId)?.label ?? "This team member";
      const slotResult = evaluateDayTimeSlotDrop({
        appointment,
        sourceColumnId: data.columnId,
        sourceDateKey: data.dateKey,
        targetColumnId: overData.columnId,
        targetDateKey: overData.dateKey,
        targetHour: overData.hour,
        targetMinute: overData.minute ?? 0,
        nowMs,
        calendarTimezone,
        dayAppointments,
        appointmentsByColumn,
        blocksByColumn,
        locationServices,
        locationBundles,
        targetColumnLabel: label,
        bufferTimeMinutes,
      });
      if (!slotResult.ok) {
        if (slotResult.toastMessage) toast.error(slotResult.toastMessage);
        return;
      }
      if (slotResult.action === "noop") return;
      if (slotResult.action === "reschedule_single") {
        dispatch(
          setCalendarPendingDrop({
            type: "reschedule",
            appointment,
            dateKey: slotResult.dateKey,
            hour: slotResult.hour,
            minute: slotResult.minute,
            columnId: slotResult.columnId,
          }),
        );
        return;
      }
      dispatch(
        setCalendarPendingDrop({
          type: "reschedule",
          appointment,
          dateKey: slotResult.dateKey,
          hour: slotResult.hour,
          minute: slotResult.minute,
          columnId: slotResult.columnId,
          isGroupDrop: true,
          bookingGroupId: slotResult.bookingGroupId,
          newGroupStartIso: slotResult.newGroupStartIso,
          segmentsPreview: slotResult.segmentsPreview,
        }),
      );
    }
  }, [
    dispatch,
    appointmentsByColumn,
    blocksByColumn,
    dayAppointments,
    calendarTimezone,
    locationServices,
    locationBundles,
    columns,
    bufferTimeMinutes,
    dndSessionRef,
    setActiveId,
    setOverId,
  ]);

  const handleConfirmDrop = useCallback(() => {
    if (!pendingDrop) return;
    const toConfirm = pendingDrop;
    if (toConfirm.type === "reassign") {
      setDropConfirmInProgress(true);
      dispatch(
        updateAppointment.request({
          appointmentId: toConfirm.appointment.id,
          data: { staffUserIds: [toConfirm.staffId] },
          bookingGroupId: toConfirm.appointment.bookingGroupId ?? undefined,
        }),
      );
      return;
    }
    // Group drop
    if (toConfirm.type === "reschedule" && toConfirm.isGroupDrop && toConfirm.newGroupStartIso && toConfirm.bookingGroupId) {
      const newScheduledAt = new Date(toConfirm.newGroupStartIso);
      const segments = toConfirm.segmentsPreview ?? [];
      const lastPreview = segments[segments.length - 1];
      const groupEndMs = lastPreview
        ? new Date(lastPreview.endIso).getTime()
        : newScheduledAt.getTime() + toConfirm.appointment.duration * 60 * 1000;
      const totalGroupDurationMinutes = Math.round((groupEndMs - newScheduledAt.getTime()) / 60000);
      const newEndsAt = new Date(groupEndMs);
      const isOutOfHours = !open247 && dayWorkingHours && isTimeRangeOutsideWorkingHours(newScheduledAt, totalGroupDurationMinutes, dayWorkingHours, open247, calendarTimezone);
      if (isOutOfHours) {
        setPendingReschedulePayload({
          appointmentId: toConfirm.appointment.id,
          newScheduledAt,
          newEndsAt,
          staffUserIds: undefined,
          bookingGroupId: toConfirm.bookingGroupId,
        });
        setOverrideDialogOpen(true);
        return;
      }
      setDropConfirmInProgress(true);
      dispatch(
        rescheduleAppointmentGroup.request({
          bookingGroupId: toConfirm.bookingGroupId,
          payload: { scheduledAt: toConfirm.newGroupStartIso },
        }),
      );
      return;
    }
    const { appointment, dateKey: dKey, hour, columnId: targetColumnId } = toConfirm;
    const minute = toConfirm.minute ?? 0;
    const newScheduledAt = buildZonedDateFromDateKey(
      dKey,
      `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      calendarTimezone,
    );
    const newEndsAt = new Date(newScheduledAt.getTime() + appointment.duration * 60 * 1000);
    const isOutOfHours = !open247 && dayWorkingHours && isTimeRangeOutsideWorkingHours(newScheduledAt, appointment.duration, dayWorkingHours, open247, calendarTimezone);
    const sourceColumnId = appointment.staffUserIds.length === 0 ? 0 : appointment.staffUserIds[0];
    const changingColumn = sourceColumnId !== targetColumnId;
    const payload: { scheduledAt?: string; staffUserIds?: number[] } = {};
    if (changingColumn && targetColumnId !== 0) {
      payload.staffUserIds = [targetColumnId];
    }
    if (isOutOfHours) {
      setPendingReschedulePayload({
        appointmentId: appointment.id,
        newScheduledAt,
        newEndsAt,
        staffUserIds: payload.staffUserIds,
        bookingGroupId: appointment.bookingGroupId ?? undefined,
      });
      setOverrideDialogOpen(true);
      return;
    }
    payload.scheduledAt = newScheduledAt.toISOString();
    const gid = appointment.bookingGroupId;
    const timeChanged =
      newScheduledAt.getTime() !== new Date(appointment.scheduledAt).getTime();
    setDropConfirmInProgress(true);
    if (gid) {
      const staffIds = payload.staffUserIds;
      if (changingColumn && staffIds != null && staffIds.length > 0) {
        if (timeChanged) {
          dispatch(
            updateAppointment.request({
              appointmentId: appointment.id,
              data: { staffUserIds: staffIds },
              bookingGroupId: gid,
              chainReschedule: {
                bookingGroupId: gid,
                payload: { scheduledAt: payload.scheduledAt! },
              },
            }),
          );
        } else {
          dispatch(
            updateAppointment.request({
              appointmentId: appointment.id,
              data: { staffUserIds: staffIds },
              bookingGroupId: gid,
            }),
          );
        }
      } else {
        dispatch(
          rescheduleAppointmentGroup.request({
            bookingGroupId: gid,
            payload: { scheduledAt: payload.scheduledAt! },
          }),
        );
      }
    } else {
      dispatch(
        updateAppointment.request({
          appointmentId: appointment.id,
          data: payload,
          bookingGroupId: undefined,
        }),
      );
    }
  }, [pendingDrop, dispatch, open247, dayWorkingHours, calendarTimezone, setDropConfirmInProgress, setPendingReschedulePayload, setOverrideDialogOpen]);

  // Build confirm dialog description
  const confirmDescription = (() => {
    if (!pendingDrop) return null;
    if (pendingDrop.type === "reschedule") {
      const min = pendingDrop.minute ?? 0;
      const timeStr = `${pendingDrop.hour}:${String(min).padStart(2, "0")}`;
      const isGroup =
        !!pendingDrop.appointment.bookingGroupId?.trim() &&
        isMultiSegmentGroupDrag(
          pendingDrop.appointment,
          countSegmentsSameBookingGroup(dayAppointments, pendingDrop.appointment.bookingGroupId),
        );
      if (isGroup) {
        return <>Move this booking (all items) to {pendingDrop.dateKey} at {timeStr}. Staff assignment will not change.</>;
      }
      const sourceCol = pendingDrop.appointment.staffUserIds.length === 0 ? 0 : pendingDrop.appointment.staffUserIds[0];
      const changingColumn = sourceCol !== pendingDrop.columnId;
      const staffLabel = columns.find(c => c.id === pendingDrop.columnId)?.label;
      if (changingColumn && staffLabel) {
        return <>Assign &quot;{pendingDrop.appointment.bookedItemName}&quot; to {staffLabel} and move to {pendingDrop.dateKey} at {timeStr}?</>;
      }
      return <>Move &quot;{pendingDrop.appointment.bookedItemName}&quot; to {pendingDrop.dateKey} at {timeStr}?</>;
    }
    if (pendingDrop.type === "reassign") {
      return <>Assign this appointment to {pendingDrop.staffLabel}?</>;
    }
    return null;
  })();

  return (
    <div className="relative">
      {/* Closed day indicator */}
      {!isOpen && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-border">
          <ShieldAlert className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400 font-medium">Location is closed this day</span>
        </div>
      )}

      {showFilterEmptyBanner ? (
        <EmptyState
          icon={SlidersHorizontal}
          title="No appointments match your filters"
          description="Try adjusting your filters or clearing them to see all appointments for this day."
          className="h-[calc(100dvh-115px)] !py-0 !justify-center cursor-default"
        />
      ) : (
      <DndContext
        sensors={dndSensors}
        collisionDetection={collisionDetection}
        autoScroll={{ layoutShiftCompensation: false, threshold: { x: 0, y: 0.1 } }}
        measuring={{ droppable: { strategy: MeasuringStrategy.BeforeDragging } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Scrollable grid */}
        <div className="relative">
          <div className="flex" style={isScrollableGrid ? { minWidth: `calc((100% - ${GUTTER_WIDTH}px) / ${COLUMN_SCROLL_THRESHOLD} * ${columns.length} + ${GUTTER_WIDTH}px)` } : undefined}>
            {/* Time gutter */}
            <div className="relative flex flex-col items-end pr-2 select-none flex-shrink-0 sticky left-0 z-20 bg-white dark:bg-surface" style={{ width: GUTTER_WIDTH }}>
              <div className="h-8 flex-shrink-0 sticky top-0 z-30 bg-white dark:bg-surface" />
              {dayGridSlotStarts.length > 0
                ? dayGridSlotStarts.map((slot) => {
                  const isOutside = !open247 && (slot.hour < openHour || slot.hour >= closeHour);
                  return (
                    <div key={`${slot.hour}-${slot.minute}`} className={`text-[11px] flex items-start justify-end ${isOutside ? "text-muted-foreground/40" : "text-foreground-2 font-medium"}`} style={{ height: daySlotHeight }}>
                      {slot.minute === 0 ? formatHourLabel(slot.hour, is24h) : null}
                    </div>
                  );
                })
                : GRID_HOURS.map((hour) => (
                  <div key={hour} className="text-[11px] text-muted-foreground flex items-start justify-end" style={{ height: HOUR_HEIGHT }}>
                    {formatHourLabel(hour, is24h)}
                  </div>
                ))}
              {isToday && (
                <div
                  className="absolute right-0 z-30 pointer-events-none -translate-y-1/2"
                  style={{ top: nowGutterTop }}
                >
                  <span className="bg-white text-primary text-[10px] border border-primary border-2 font-semibold leading-none px-1 py-1.5 rounded-full tabular-nums whitespace-nowrap min-w-[58px] text-center inline-block">
                    {nowLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Staff columns */}
            {columns.map(col => (
              <DroppableColumn
                key={col.id}
                id={`column-${col.id}`}
                staffId={col.id}
                label={col.label}
                slotBasedDragHighlight
                dndActive={!!activeId}
                dropDisabled={
                  !!activeId &&
                  !!activeAppointment &&
                  isDayStaffColumnDropDisabled({
                    appointment: activeAppointment,
                    staffId: col.id,
                    staffLabel: col.label,
                    isGroupDragRestricted: activeDragIsGroupRestricted,
                    appointmentsByColumn,
                    locationServices,
                    locationBundles,
                  })
                }
              >
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground border-b border-border truncate px-1 sticky top-0 z-30 bg-white dark:bg-surface cursor-default h-8">
                  {(() => {
                    const s = locationStaff.find(m => m.id === col.id);
                    if (!s) return null;
                    const initials = ((s.firstName?.trim()?.[0] ?? "") + (s.lastName?.trim()?.[0] ?? "")).toUpperCase() || "?";
                    const avatarBg = getStaffAvatarColor(
                      s.id,
                      `${s.id}-${s.firstName ?? ""}-${s.lastName ?? ""}`,
                      colorCoding === 'staff' ? dayColorMap : null,
                    );
                    return (
                      <Avatar className="size-6.5 shrink-0 border border-border transition-none">
                        {s.profileImage ? <AvatarImage src={s.profileImage} alt="" /> : null}
                        <AvatarFallback
                          className="text-[11px] font-semibold leading-none text-foreground-1"
                          style={{ backgroundColor: avatarBg }}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })()}
                  <span className="truncate">{col.label}</span>
                </div>
                <TimeColumn
                  appointments={appointmentsByColumnWithPreview.get(col.id) ?? []}
                  blocks={blocksByColumn.get(col.id) ?? []}
                  locationStaff={locationStaff}
                  openHour={openHour}
                  closeHour={closeHour}
                  open247={open247}
                  isToday={isToday}
                  enableDnd
                  columnId={col.id}
                  dateKey={dateKey}
                  gridSlotStarts={dayGridSlotStarts.length > 0 ? dayGridSlotStarts : undefined}
                  slotHeight={dayGridSlotStarts.length > 0 ? daySlotHeight : undefined}
                  gridStartMinutes={dayGridSlotStarts.length > 0 ? dayGridStartMinutes : undefined}
                  intervalMinutes={dayGridSlotStarts.length > 0 ? slotIntervalMinutes : undefined}
                  timezone={calendarTimezone}
                  colorMap={dayColorMap}
                  schedulingLockedAppointmentIds={schedulingLockedAppointmentIds}
                  forbiddenSlotIds={activeId ? dayForbiddenSlotIds : EMPTY_FORBIDDEN_SLOT_SET}
                  dndActive={!!activeId}
                  durationHighlightSlotIds={dayDurationHighlightSlotIds}
                  draggingGroupId={activeDragIsGroupRestricted ? activeAppointment?.bookingGroupId?.trim() : null}
                  onSlotClick={handleSlotClick}
                />
              </DroppableColumn>
            ))}
          </div>

          {/* ── Shared (location / business-wide) block overlays ─────────────────
              Rendered as a single stripe spanning all staff columns (after the gutter).
              Column headers are h-8 = 32px; timed block tops are offset by that. ── */}
          {(() => {
            const HEADER_H = 32;
            return (
              <>
                {/* All-day shared blocks — subtle tinted band with left accent */}
                {sharedBlocks.filter(b => b.isAllDay).map(block => {
                  const gridH = dayGridSlotStarts.length > 0
                    ? dayGridSlotStarts.length * daySlotHeight
                    : GRID_HOURS.length * HOUR_HEIGHT;
                  const ReasonIcon = getCalendarBlockReasonIcon(block.reason);
                  return (
                    <BlockDetailPopover
                      key={`shared-block-${block.id}`}
                      block={block}
                      staffName={null}
                      locationStaff={locationStaff}
                      timezone={calendarTimezone}
                    >
                      <div
                        className="absolute z-[5] cursor-pointer rounded-xl bg-neutral-100/70 dark:bg-neutral-800/30"
                        style={{
                          left: GUTTER_WIDTH,
                          right: 0,
                          top: HEADER_H,
                          height: gridH,
                          border: '1px solid var(--border)',
                          borderLeft: '3px solid var(--border-strong)',
                        }}
                      >
                        <div className="absolute top-2 left-2">
                          <span className="flex items-center justify-center size-5 rounded-full border border-border-strong bg-white dark:bg-surface">
                            <ReasonIcon className="size-3 text-muted-foreground" />
                          </span>
                        </div>
                      </div>
                    </BlockDetailPopover>
                  );
                })}

                {/* Timed shared blocks — subtle band with left accent */}
                {sharedTimedBlockGroups.map((group, gi) => {
                  if (group.blocks.length === 1) {
                    const block = group.blocks[0];
                    const pos = getSharedBlockPos(block.startsAt, block.endsAt);
                    const blockInset = 6;
                    const h = Math.max(pos.height - blockInset * 2, 20);
                    const ReasonIcon = getCalendarBlockReasonIcon(block.reason);
                    return (
                      <BlockDetailPopover
                        key={`shared-block-${block.id}`}
                        block={block}
                        staffName={null}
                        locationStaff={locationStaff}
                        timezone={calendarTimezone}
                      >
                        <div
                          className="absolute z-[5] cursor-pointer overflow-hidden rounded-xl
                            bg-neutral-100/70 dark:bg-neutral-800/30"
                          style={{
                            left: GUTTER_WIDTH + 4,
                            right: 4,
                            top: HEADER_H + pos.top + blockInset,
                            height: h,
                            border: '1px solid var(--border)',
                          borderLeft: '3px solid var(--border-strong)',
                          }}
                        >
                          <div className="absolute top-1 left-1.5">
                            <span className="flex items-center justify-center size-5 rounded-full border border-border-strong bg-white dark:bg-surface">
                              <ReasonIcon className="size-3 text-muted-foreground" />
                            </span>
                          </div>
                        </div>
                      </BlockDetailPopover>
                    );
                  }

                  /* Merged group */
                  const pos = getSharedBlockPos(group.minStartIso, group.maxEndIso);
                  const mergedInset = 6;
                  const h = Math.max(pos.height - mergedInset * 2, 20);
                  const count = group.blocks.length;
                  const timeRangeStr = formatTimeRange(group.minStartIso, group.maxEndIso, calendarTimezone);
                  return (
                    <BlockGroupDialog
                      key={`shared-block-group-${gi}`}
                      blocks={group.blocks}
                      timeRangeStr={timeRangeStr}
                      locationStaff={locationStaff}
                      timezone={calendarTimezone}
                    >
                      <button
                        type="button"
                        className="absolute z-[5] cursor-pointer text-left overflow-hidden outline-none rounded-xl
                          bg-neutral-100/70 dark:bg-neutral-800/30
                          focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0"
                        style={{
                          left: GUTTER_WIDTH + 4,
                          right: 4,
                          top: HEADER_H + pos.top + mergedInset,
                          height: h,
                          border: '1px solid var(--border)',
                          borderLeft: '3px solid var(--border-strong)',
                        }}
                      >
                        <div className="absolute top-1 left-1.5">
                          <span className="flex items-center justify-center size-5 rounded-full border border-border-strong bg-white dark:bg-surface text-[9px] font-semibold text-foreground tabular-nums">
                            {count}
                          </span>
                        </div>
                      </button>
                    </BlockGroupDialog>
                  );
                })}
              </>
            );
          })()}
        </div>

        {createPortal(
          <DragOverlay
            modifiers={
              activeDragIsGroupRestricted
                ? [snapCenterToCursor, restrictToVerticalAxis]
                : [snapCenterToCursor]
            }
          >
            {activeAppointment ? (() => {
              const pos = getTimePositionForGrid(
                activeAppointment.scheduledAt,
                activeAppointment.endsAt,
                dayGridStartMinutes,
                slotIntervalMinutes,
                daySlotHeight,
                calendarTimezone,
              );
              return (
                <div style={{ width: 180 }} className="cursor-grabbing">
                  <AppointmentBlock
                    appointment={activeAppointment}
                    top={0}
                    height={pos.height}
                    colorMap={dayColorMap}
                  />
                </div>
              );
            })() : null}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
      )}

      <ConfirmDropDialog
        open={!!pendingDrop && !overrideDialogOpen && !dropConfirmInProgress && confirmModalDelayedOpen}
        onOpenChange={(open) => !open && handleCancelDrop()}
        onConfirm={handleConfirmDrop}
        onCancel={handleCancelDrop}
        description={confirmDescription}
      />

      <OverrideDialog
        open={overrideDialogOpen || (!!updateConflictOffer && updateConflictOffer.conflictType !== 'staff_appointment')}
        onOpenChange={(open) => {
          if (!open) {
            if (updateConflictOffer) handleCancelConflictOverride();
            else handleCancelDrop();
          }
        }}
        isConflictOverride={!!updateConflictOffer}
        onConfirm={updateConflictOffer ? handleConfirmConflictOverride : handleConfirmOverride}
        onCancel={updateConflictOffer ? handleCancelConflictOverride : handleCancelDrop}
        reasonText={overrideReasonText}
        onReasonChange={setOverrideReasonText}
        inputId="dnd-override-reason"
      />
    </div>
  );
};
