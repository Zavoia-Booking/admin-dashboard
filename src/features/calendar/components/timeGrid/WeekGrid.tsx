import { type FC, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useNowTick } from "./useNowTick.ts";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import {
  getLocationStaff,
  getLocationWorkingHours,
  getLocationOpen247,
  getSelectedDate,
  getWeekData,
  getWeekDataLoading,
  getEffectiveStaffFilterIds,
  getWeekViewDisplayStart,
  getOptimisticBlocks,
  blockOverlapsDate,
  getBookingSettings,
  getCalendarTimezone,
  appointmentsToDisplayBlocks,
  getLocationServices,
  getScrollToNow,
} from "../../selectors.ts";
import {
  rescheduleAppointmentGroup,
  updateAppointment,
  setCalendarPendingDrop,
  toggleAddForm,
  setScrollToNow,
} from "../../actions.ts";
import { AppointmentViewMode } from "../../types.ts";
import type {
  SlimAppointment,
  DayDataResponse,
} from "../../../../shared/types/calendar.ts";
import { getWeekStart } from "../../utils.ts";
import {
  getWorkingHoursForDate,
  getDayOpenCloseHours,
  getSlotStartsInRange,
  getTimePositionForGrid,
  isTimeRangeOutsideWorkingHours,
} from "../../workingHours.ts";
import { getMinutesInTimezone, formatDateInTimezone, buildZonedDateFromDateKey } from "../../timezone.ts";
import { isSlimAppointmentSchedulingLocked } from "../../calendarScheduling.ts";
import {
  countSegmentsSameBookingGroup,
  isMultiSegmentGroupDrag,
  evaluateWeekTimeSlotDrop,
  isWeekTimeSlotForbiddenForPreview,
} from "../../dndDropEligibility.ts";
import { buildCalendarColorMap } from "../../colors.ts";
import { calendarPreferences } from "../../calendarPreferences.ts";
import { dispatchSelectDateAndDayView } from "../../selectDateAndDayViewDispatch.ts";
import { AppointmentBlock } from "../AppointmentBlock.tsx";
import { WeekDayStrip } from "../WeekDayStrip.tsx";
import { DndContext, DragOverlay, MeasuringStrategy, pointerWithin } from "@dnd-kit/core";
import type { CollisionDetection, DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis, snapCenterToCursor } from "@dnd-kit/modifiers";
import type { AppointmentDragData, TimeSlotDropData } from "../CalendarDnD.tsx";
import { toast } from "sonner";

import { TimeColumn } from "./TimeColumn.tsx";
import { WeekDayColumnSummary } from "./WeekDayColumnSummary.tsx";
import { ConfirmDropDialog } from "./ConfirmDropDialog.tsx";
import { OverrideDialog } from "./OverrideDialog.tsx";
import { useGridDndState } from "./useGridDndState.ts";
import { parseDraggableActiveAppointmentId } from "./overlapUtils.ts";
import {
  GRID_HEIGHT_PER_HOUR,
  GRID_HOURS,
  GUTTER_WIDTH,
  HOUR_HEIGHT,
  EMPTY_FORBIDDEN_SLOT_SET,
  formatHourLabel,
  formatNowLabel,
  type GridSlot,
} from "./constants.ts";

export const WeekGrid: FC = () => {
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
  const weekDisplayStart = useSelector(getWeekViewDisplayStart);
  const weekData = useSelector(getWeekData);
  const isLoading = useSelector(getWeekDataLoading);
  const scrollToNow = useSelector(getScrollToNow);
  const locationStaff = useSelector(getLocationStaff);
  const locationServicesWeek = useSelector(getLocationServices);
  const workingHours = useSelector(getLocationWorkingHours);
  const open247 = useSelector(getLocationOpen247);
  const staffFilter = useSelector(getEffectiveStaffFilterIds);
  const optimisticBlocks = useSelector(getOptimisticBlocks);
  const bookingSettings = useSelector(getBookingSettings);
  const calendarTimezone = useSelector(getCalendarTimezone);
  const bufferTimeMinutes = bookingSettings?.bufferTimeMinutes ?? 0;

  const isSingleStaff = staffFilter.length === 1;
  const todayStr = formatDateInTimezone(new Date(), calendarTimezone);

  // Build 7 days for the displayed week
  const weekDays = useMemo(() => {
    const ws = weekDisplayStart ?? getWeekStart(selectedDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws);
      d.setDate(ws.getDate() + i);
      return d;
    });
  }, [weekDisplayStart, selectedDate]);

  /** Stable slot-click handler for the single-staff week view (avoids inline closures per day). */
  const weekDaysRef = useRef(weekDays);
  weekDaysRef.current = weekDays;
  const handleWeekSlotClick = useCallback((hour: number, minute?: number, columnId?: number) => {
    const day = columnId != null ? weekDaysRef.current?.[columnId] : undefined;
    const hh = String(hour).padStart(2, '0');
    const mm = String(minute ?? 0).padStart(2, '0');
    dispatch(toggleAddForm({
      open: true,
      prefill: {
        date: day,
        time: `${hh}:${mm}`,
        staffUserId: staffFilter.length === 1 ? staffFilter[0] : undefined,
      },
    }));
  }, [dispatch, staffFilter]);

  // Parse working hours for each day
  const dayWorkingHours = useMemo(() => {
    return weekDays.map(day => {
      const dayHours = getWorkingHoursForDate(day, workingHours, open247);
      const isOpen = open247 || (dayHours?.isOpen ?? false);
      const { openHour, closeHour } = getDayOpenCloseHours(dayHours, open247, 6, 22);
      return { isOpen, openHour, closeHour };
    });
  }, [weekDays, workingHours, open247]);

  const weekSlotIntervalMinutes = bookingSettings?.slotIntervalMinutes ?? 15;
  const weekSlotMinutes = useMemo(
    () => getSlotStartsInRange(0, 24 * 60, weekSlotIntervalMinutes),
    [weekSlotIntervalMinutes],
  );
  const weekGridSlotStarts: GridSlot[] = useMemo(
    () => weekSlotMinutes.map((m) => ({ hour: Math.floor(m / 60), minute: m % 60 })),
    [weekSlotMinutes],
  );
  const weekGridStartMinutes = weekSlotMinutes[0] ?? 0;
  const weekSlotHeight =
    weekSlotMinutes.length > 0 ? GRID_HEIGHT_PER_HOUR / (60 / weekSlotIntervalMinutes) : HOUR_HEIGHT;

  const weekNowMinutes = calendarTimezone
    ? getMinutesInTimezone(new Date().toISOString(), calendarTimezone)
    : new Date().getHours() * 60 + new Date().getMinutes();
  const weekNowGutterTop = ((weekNowMinutes - weekGridStartMinutes) / weekSlotIntervalMinutes) * weekSlotHeight;
  const is24h = calendarPreferences.getTimeFormat() === '24h';
  const weekNowLabel = formatNowLabel(weekNowMinutes, is24h);
  const weekHasToday = weekDays.some((d) => formatDateInTimezone(d, calendarTimezone) === todayStr);
  useNowTick(weekHasToday);

  // Scroll to "now" line only when the scrollToNow flag is set (Today button / initial load).
  // Prev/next navigation preserves scroll position.
  useLayoutEffect(() => {
    if (!scrollToNow || !weekHasToday || isLoading) return;
    const sc = document.querySelector<HTMLElement>("[data-calendar-scroll]");
    if (!sc) return;
    const headerOffset = 32;
    sc.scrollTop = Math.max(0, headerOffset + weekNowGutterTop - sc.clientHeight / 2);
    dispatch(setScrollToNow(false));
  }, [isLoading, weekHasToday, scrollToNow, weekDisplayStart, weekNowGutterTop, dispatch]);

  // Get appointments and blocks for each day, filtered by staff
  const columnData = useMemo(() => {
    return weekDays.map(day => {
      const dateKey = formatDateInTimezone(day, calendarTimezone);
      const dayData: DayDataResponse | undefined = weekData?.[dateKey];

      let appointments = dayData?.appointments ?? [];
      const serverBlocks = dayData?.blocks ?? [];
      const forDay = optimisticBlocks.filter((b) => blockOverlapsDate(b, dateKey, calendarTimezone));
      const blocks = [...serverBlocks, ...forDay];

      if (staffFilter.length > 0) {
        appointments = appointments.filter(appt => {
          if (appt.isUnassigned || appt.staffUserIds.length === 0) return false;
          return appt.staffUserIds.some(id => staffFilter.includes(id));
        });
      }

      return { appointments, blocks };
    });
  }, [weekDays, weekData, staffFilter, optimisticBlocks, calendarTimezone]);

  const columnDataByDateKey = useMemo(() => {
    const map: Record<string, typeof columnData[number]> = {};
    weekDays.forEach((day, i) => {
      const dateKey = formatDateInTimezone(day, calendarTimezone);
      map[dateKey] = columnData[i];
    });
    return map;
  }, [weekDays, columnData, calendarTimezone]);

  // Convert to display blocks then to SlimAppointment for rendering
  const columnDisplayData = useMemo(() => {
    return columnData.map((col) => ({
      ...col,
      appointments: appointmentsToDisplayBlocks(col.appointments).map((block): SlimAppointment => ({
        id: block.id,
        scheduledAt: block.start,
        endsAt: block.end,
        status: block.status,
        bookedItemName: block.label,
        duration: block.duration,
        staffUserIds: block.staffUserIds,
        customerName: block.customerName,
        bookingSource: block.bookingSource,
        isUnassigned: block.isUnassigned,
        overrideReason: block.overrideReason,
        bookingGroupId: block.bookingGroupId ?? undefined,
        notes: block.notes ?? undefined,
      })),
    }));
  }, [columnData]);

  // Merge pending drop preview into column data
  const columnDataWithPreview = useMemo(() => {
    if (!pendingDrop || pendingDrop.type !== "reschedule") return columnDisplayData;
    const pd = pendingDrop;
    const appointment = pd.appointment;
    const appointmentId = appointment.id;
    const allDisplayAppointments = columnDisplayData.flatMap((col) => col.appointments);
    // Group drop
    if (pd.isGroupDrop && pd.segmentsPreview?.length) {
      const segmentsPreview = pd.segmentsPreview ?? [];
      const segmentIds = new Set(segmentsPreview.map((s) => s.id));
      return columnDisplayData.map((col, i) => {
        const dateKey = formatDateInTimezone(weekDays[i], calendarTimezone);
        const withoutSegments = col.appointments.filter((a) => !segmentIds.has(a.id));
        if (dateKey !== pd.dateKey) {
          return { ...col, appointments: withoutSegments };
        }
        const previewAppointments: SlimAppointment[] = segmentsPreview.map((seg) => {
          const full = allDisplayAppointments.find((a) => a.id === seg.id);
          return full
            ? { ...full, scheduledAt: seg.startIso, endsAt: seg.endIso }
            : {
              id: seg.id,
              scheduledAt: seg.startIso,
              endsAt: seg.endIso,
              status: appointment.status,
              bookedItemName: appointment.bookedItemName,
              duration: Math.round((new Date(seg.endIso).getTime() - new Date(seg.startIso).getTime()) / 60000),
              staffUserIds: seg.staffUserIds,
              customerName: appointment.customerName,
              bookingSource: appointment.bookingSource,
              isUnassigned: false,
              bookingGroupId: pd.bookingGroupId ?? undefined,
              notes: appointment.notes ?? undefined,
            };
        });
        return { ...col, appointments: [...withoutSegments, ...previewAppointments] };
      });
    }
    const sourceIndex = columnDisplayData.findIndex((col) => col.appointments.some((a) => a.id === appointmentId));
    const minute = pd.minute ?? 0;
    const previewStartsAt = buildZonedDateFromDateKey(
      pd.dateKey,
      `${String(pd.hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      calendarTimezone,
    );
    const previewEndsAt = new Date(previewStartsAt.getTime() + appointment.duration * 60 * 1000);
    const preview: SlimAppointment = {
      ...appointment,
      scheduledAt: previewStartsAt.toISOString(),
      endsAt: previewEndsAt.toISOString(),
    };
    return columnDisplayData.map((col, i) => {
      const dateKey = formatDateInTimezone(weekDays[i], calendarTimezone);
      if (dateKey === pd.dateKey) {
        const without = col.appointments.filter((a) => a.id !== appointmentId);
        return { ...col, appointments: [...without, preview] };
      }
      if (i === sourceIndex) {
        return { ...col, appointments: col.appointments.filter((a) => a.id !== appointmentId) };
      }
      return col;
    });
  }, [columnDisplayData, pendingDrop, weekDays, calendarTimezone]);

  const weekColorCoding = calendarPreferences.getColorCoding();
  const weekKnownColorKeys = useMemo(() => {
    if (weekColorCoding === "staff")
      return staffFilter.length > 0 ? staffFilter : locationStaff.map(s => s.id);
    if (weekColorCoding === "service")
      return locationServicesWeek.map(s => s.serviceName);
    return undefined;
  }, [weekColorCoding, staffFilter, locationStaff, locationServicesWeek]);
  const weekColorMap = useMemo(() => {
    const allAppts: SlimAppointment[] = [];
    for (const col of columnDataWithPreview) {
      allAppts.push(...col.appointments);
    }
    return buildCalendarColorMap(allAppts, weekColorCoding, weekKnownColorKeys);
  }, [columnDataWithPreview, weekColorCoding, weekKnownColorKeys]);

  const activeAppointment = useMemo(() => {
    if (!activeId) return null;
    const id = parseDraggableActiveAppointmentId(String(activeId));
    if (id == null) return null;
    for (const col of columnDataWithPreview) {
      const found = col.appointments.find((a) => a.id === id);
      if (found) return found;
    }
    return null;
  }, [activeId, columnDataWithPreview]);

  const activeDragIsGroupRestricted = useMemo(() => {
    if (!activeAppointment) return false;
    const flat = columnData.flatMap((c) => c.appointments);
    const n = countSegmentsSameBookingGroup(flat, activeAppointment.bookingGroupId);
    return isMultiSegmentGroupDrag(activeAppointment, n);
  }, [activeAppointment, columnData]);

  const prevWeekDurationRef = useRef<ReadonlySet<string>>(EMPTY_FORBIDDEN_SLOT_SET);
  const weekDurationHighlightSlotIds = useMemo(() => {
    if (!overId || !activeAppointment || weekSlotIntervalMinutes <= 0) return EMPTY_FORBIDDEN_SLOT_SET;
    const overStr = String(overId);
    const match = overStr.match(/^slot-(\d+)-(.+)-(\d+)-(\d+)$/);
    if (!match) return EMPTY_FORBIDDEN_SLOT_SET;
    const [, colId, dk, hourStr, minStr] = match;
    const dropSlotMin = parseInt(hourStr, 10) * 60 + parseInt(minStr, 10);

    const groupId = activeAppointment.bookingGroupId?.trim();
    const allAppts = columnData.flatMap((c) => c.appointments);
    const groupSegments = groupId
      ? allAppts
          .filter((a) => (a.bookingGroupId?.trim() ?? "") === groupId)
          .sort((a, b) => (a.bookingGroupOrder ?? 0) - (b.bookingGroupOrder ?? 0))
      : [];
    const isGroup = groupSegments.length > 1;

    if (isGroup) {
      // Highlight each segment's individual time range (not the full group span)
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
        const segSlotsNeeded = Math.ceil(segDurationMin / weekSlotIntervalMinutes);
        for (let i = 0; i < segSlotsNeeded; i++) {
          const m = segPreviewStartMin + i * weekSlotIntervalMinutes;
          if (m < 0 || m >= 24 * 60) continue;
          ids.add(`slot-${colId}-${dk}-${Math.floor(m / 60)}-${m % 60}`);
        }
      }
      return ids;
    }

    const slotsNeeded = Math.ceil(activeAppointment.duration / weekSlotIntervalMinutes);
    const ids = new Set<string>();
    for (let i = 0; i < slotsNeeded; i++) {
      const m = Math.round(dropSlotMin) + i * weekSlotIntervalMinutes;
      if (m < 0 || m >= 24 * 60) continue;
      ids.add(`slot-${colId}-${dk}-${Math.floor(m / 60)}-${m % 60}`);
    }
    const prev = prevWeekDurationRef.current;
    if (ids.size === prev.size && [...ids].every(id => prev.has(id))) return prev;
    prevWeekDurationRef.current = ids;
    return ids;
  }, [overId, activeAppointment, weekSlotIntervalMinutes, columnData]);

  const weekSchedulingLockedIds = useMemo(() => {
    const flat = columnData.flatMap((c) => c.appointments);
    const ids = new Set<number>();
    for (const a of flat) {
      if (isSlimAppointmentSchedulingLocked(a, flat)) {
        ids.add(a.id);
      }
    }
    return ids;
  }, [columnData]);

  const weekSlotRowsForForbidden = useMemo(
    () =>
      weekGridSlotStarts.length > 0
        ? weekGridSlotStarts
        : GRID_HOURS.map((hour) => ({ hour, minute: 0 as const })),
    [weekGridSlotStarts],
  );

  const prevWeekForbiddenRef = useRef<ReadonlySet<string>>(EMPTY_FORBIDDEN_SLOT_SET);
  const weekForbiddenSlotIds = useMemo(() => {
    if (!isSingleStaff || !activeId || !activeAppointment) return EMPTY_FORBIDDEN_SLOT_SET;
    if (activeAppointment.status === "cancelled") return EMPTY_FORBIDDEN_SLOT_SET;
    const weekFlatForLock = columnData.flatMap((c) => c.appointments);
    if (isSlimAppointmentSchedulingLocked(activeAppointment, weekFlatForLock)) {
      return EMPTY_FORBIDDEN_SLOT_SET;
    }
    const session = dndSessionRef.current;
    if (!session || session.dragData.appointment.id !== activeAppointment.id) {
      return EMPTY_FORBIDDEN_SLOT_SET;
    }
    const { nowMs, dragData } = session;
    const useSlots = weekGridSlotStarts.length > 0;
    const forbidden = new Set<string>();
    for (let i = 0; i < weekDays.length; i++) {
      const dayDateKey = formatDateInTimezone(weekDays[i], calendarTimezone);
      for (const slot of weekSlotRowsForForbidden) {
        const slotId = useSlots
          ? `slot-${i}-${dayDateKey}-${slot.hour}-${slot.minute}`
          : `slot-${i}-${dayDateKey}-${slot.hour}`;
        if (
          isWeekTimeSlotForbiddenForPreview({
            appointment: activeAppointment,
            sourceColumnId: dragData.columnId,
            sourceDateKey: dragData.dateKey,
            targetColumnId: i,
            targetDateKey: dayDateKey,
            targetHour: slot.hour,
            targetMinute: slot.minute,
            nowMs,
            calendarTimezone,
            columnData,
            columnDataByDateKey,
            columnDataWithPreview,
            bufferTimeMinutes,
          })
        ) {
          forbidden.add(slotId);
        }
      }
    }
    const prev = prevWeekForbiddenRef.current;
    if (forbidden.size === prev.size && [...forbidden].every(id => prev.has(id))) return prev;
    prevWeekForbiddenRef.current = forbidden;
    return forbidden;
  }, [
    isSingleStaff,
    activeId,
    activeAppointment,
    weekDays,
    weekSlotRowsForForbidden,
    weekGridSlotStarts.length,
    calendarTimezone,
    columnData,
    columnDataByDateKey,
    columnDataWithPreview,
    bufferTimeMinutes,
    dndSessionRef,
  ]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    dndSessionRef.current = null;
    setActiveId(null);
    setOverId(null);
    const nowMs = Date.now();
    const data = event.active.data?.current as AppointmentDragData | null;
    const overData = event.over?.data?.current as TimeSlotDropData | null;
    if (!data || data.type !== "appointment" || !overData || overData.type !== "time-slot") return;
    const appointment = data.appointment;
    if (appointment.status === "cancelled") return;
    const weekFlatForLock = columnData.flatMap((c) => c.appointments);
    if (isSlimAppointmentSchedulingLocked(appointment, weekFlatForLock)) return;

    const slotResult = evaluateWeekTimeSlotDrop({
      appointment,
      sourceColumnId: data.columnId,
      sourceDateKey: data.dateKey,
      targetColumnId: overData.columnId,
      targetDateKey: overData.dateKey,
      targetHour: overData.hour,
      targetMinute: overData.minute ?? 0,
      nowMs,
      calendarTimezone,
      columnData,
      columnDataByDateKey,
      columnDataWithPreview,
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
  }, [dispatch, columnDataWithPreview, columnData, calendarTimezone, bufferTimeMinutes, columnDataByDateKey, dndSessionRef, setActiveId, setOverId]);

  const handleConfirmDrop = useCallback(() => {
    if (!pendingDrop || pendingDrop.type !== "reschedule") return;
    const toConfirm = pendingDrop;
    const { appointment, dateKey: dKey, hour } = toConfirm;
    const minute = toConfirm.minute ?? 0;
    // Week view group drop
    if (toConfirm.isGroupDrop && toConfirm.newGroupStartIso && toConfirm.bookingGroupId) {
      const newScheduledAt = new Date(toConfirm.newGroupStartIso);
      const segments = toConfirm.segmentsPreview ?? [];
      const lastPreview = segments[segments.length - 1];
      const groupEndMs = lastPreview
        ? new Date(lastPreview.endIso).getTime()
        : newScheduledAt.getTime() + appointment.duration * 60 * 1000;
      const totalGroupDurationMinutes = Math.round((groupEndMs - newScheduledAt.getTime()) / 60000);
      const newEndsAt = new Date(groupEndMs);
      const dayIndex = weekDays.findIndex((d) => formatDateInTimezone(d, calendarTimezone) === dKey);
      const targetDayWorkingHours = dayIndex >= 0 ? getWorkingHoursForDate(weekDays[dayIndex], workingHours, open247) : null;
      const isOutOfHours = !open247 && targetDayWorkingHours && isTimeRangeOutsideWorkingHours(newScheduledAt, totalGroupDurationMinutes, targetDayWorkingHours, open247, calendarTimezone);
      if (isOutOfHours) {
        setPendingReschedulePayload({
          appointmentId: appointment.id,
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
    const dayIndex = weekDays.findIndex((d) => formatDateInTimezone(d, calendarTimezone) === dKey);
    const targetDayWorkingHours = dayIndex >= 0 ? getWorkingHoursForDate(weekDays[dayIndex], workingHours, open247) : null;
    const newScheduledAt = buildZonedDateFromDateKey(
      dKey,
      `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      calendarTimezone,
    );
    const newEndsAt = new Date(newScheduledAt.getTime() + appointment.duration * 60 * 1000);
    const isOutOfHours = !open247 && targetDayWorkingHours && isTimeRangeOutsideWorkingHours(newScheduledAt, appointment.duration, targetDayWorkingHours, open247, calendarTimezone);
    const payload: { scheduledAt?: string; staffUserIds?: number[] } = {};
    if (isOutOfHours) {
      setPendingReschedulePayload({
        appointmentId: appointment.id,
        newScheduledAt,
        newEndsAt,
        bookingGroupId: appointment.bookingGroupId ?? undefined,
      });
      setOverrideDialogOpen(true);
      return;
    }
    payload.scheduledAt = newScheduledAt.toISOString();
    setDropConfirmInProgress(true);
    if (appointment.bookingGroupId) {
      dispatch(
        rescheduleAppointmentGroup.request({
          bookingGroupId: appointment.bookingGroupId,
          payload: { scheduledAt: payload.scheduledAt! },
        }),
      );
    } else {
      dispatch(
        updateAppointment.request({
          appointmentId: appointment.id,
          data: payload,
          bookingGroupId: undefined,
        }),
      );
    }
  }, [pendingDrop, dispatch, open247, workingHours, weekDays, calendarTimezone, setDropConfirmInProgress, setPendingReschedulePayload, setOverrideDialogOpen]);

  // Loading state is handled as an overlay below to preserve scroll position.

  // Build confirm dialog description
  const confirmDescription = (() => {
    if (!pendingDrop || pendingDrop.type !== "reschedule") return null;
    const min = pendingDrop.minute ?? 0;
    const timeStr = `${pendingDrop.hour}:${String(min).padStart(2, "0")}`;
    const isGroup =
      !!pendingDrop.appointment.bookingGroupId?.trim() &&
      isMultiSegmentGroupDrag(
        pendingDrop.appointment,
        countSegmentsSameBookingGroup(
          columnData.flatMap((c) => c.appointments),
          pendingDrop.appointment.bookingGroupId,
        ),
      );
    if (isGroup) {
      return <>Move this booking (all items) to {pendingDrop.dateKey} at {timeStr}. Staff assignment will not change.</>;
    }
    return <>Move &quot;{pendingDrop.appointment.bookedItemName}&quot; to {pendingDrop.dateKey} at {timeStr}?</>;
  })();

  const gridContent = (
    <div className="relative">
      {/* Full-width "now" line spanning all columns */}
      {weekHasToday && (
        <div
          className="absolute left-0 right-0 z-[25] pointer-events-none"
          style={{ top: weekNowGutterTop }}
        >
          <div className="h-[2px] bg-primary" style={{ marginLeft: GUTTER_WIDTH }} />
        </div>
      )}
      <div className="flex" style={{ minWidth: 7 * 100 + GUTTER_WIDTH }}>
        <div className="relative flex flex-col items-end pr-2 select-none flex-shrink-0 sticky left-0 z-20 bg-white dark:bg-surface" style={{ width: GUTTER_WIDTH }}>
          {weekGridSlotStarts.length > 0
            ? (() => {
              const weekMinOpen = open247 ? 0 : Math.min(...dayWorkingHours.map((d) => d.openHour));
              const weekMaxClose = open247 ? 24 : Math.max(...dayWorkingHours.map((d) => d.closeHour));
              return weekGridSlotStarts.map((slot) => {
                const isOutside = !open247 && (slot.hour < weekMinOpen || slot.hour >= weekMaxClose);
                return (
                  <div key={`${slot.hour}-${slot.minute}`} className={`text-[11px] flex items-start justify-end ${isOutside ? "text-muted-foreground/40" : "text-foreground-2 font-medium"}`} style={{ height: weekSlotHeight }}>
                    {slot.minute === 0 ? formatHourLabel(slot.hour, is24h) : null}
                  </div>
                );
              });
            })()
            : GRID_HOURS.map((hour) => (
              <div key={hour} className="text-[11px] text-muted-foreground flex items-start justify-end" style={{ height: HOUR_HEIGHT }}>
                {formatHourLabel(hour, is24h)}
              </div>
            ))}
          {weekHasToday && (
            <div
              className="absolute right-0 z-30 pointer-events-none -translate-y-1/2"
              style={{ top: weekNowGutterTop }}
            >
              <span className="bg-white text-primary text-[10px] border border-primary border-2 font-semibold leading-none px-1 py-1.5 rounded-full tabular-nums whitespace-nowrap min-w-[58px] text-center inline-block">
                {weekNowLabel}
              </span>
            </div>
          )}
        </div>
        {isSingleStaff
          ? weekDays.map((day, i) => {
            const { appointments, blocks } = columnDataWithPreview[i];
            const { openHour, closeHour } = dayWorkingHours[i];
            const isToday = formatDateInTimezone(day, calendarTimezone) === todayStr;
            const dateKey = formatDateInTimezone(day, calendarTimezone);
            return (
              <div
                key={day.toDateString()}
                className="flex-1 min-w-[100px] cursor-pointer"
                onDoubleClick={() => {
                  dispatchSelectDateAndDayView(dispatch, day, AppointmentViewMode.WEEK, selectedDate);
                }}
              >
                <div className="mx-1">
                  <TimeColumn
                    appointments={appointments}
                    blocks={blocks}
                    locationStaff={locationStaff}
                    openHour={openHour}
                    closeHour={closeHour}
                    open247={open247}
                    isToday={isToday}
                    enableDnd
                    columnId={i}
                    dateKey={dateKey}
                    gridSlotStarts={weekGridSlotStarts.length > 0 ? weekGridSlotStarts : undefined}
                    slotHeight={weekGridSlotStarts.length > 0 ? weekSlotHeight : undefined}
                    gridStartMinutes={weekGridSlotStarts.length > 0 ? weekGridStartMinutes : undefined}
                    intervalMinutes={weekGridSlotStarts.length > 0 ? weekSlotIntervalMinutes : undefined}
                    timezone={calendarTimezone}
                    colorMap={weekColorMap}
                    schedulingLockedAppointmentIds={weekSchedulingLockedIds}
                    forbiddenSlotIds={activeId ? weekForbiddenSlotIds : EMPTY_FORBIDDEN_SLOT_SET}
                    dndActive={!!activeId}
                    durationHighlightSlotIds={weekDurationHighlightSlotIds}
                    draggingGroupId={activeDragIsGroupRestricted ? activeAppointment?.bookingGroupId?.trim() : null}
                    onSlotClick={handleWeekSlotClick}
                  />
                </div>
              </div>
            );
          })
          : weekDays.map((day, i) => {
            const { appointments, blocks } = columnDataWithPreview[i];
            const { openHour, closeHour } = dayWorkingHours[i];
            const isToday = formatDateInTimezone(day, calendarTimezone) === todayStr;
            const dateKey = formatDateInTimezone(day, calendarTimezone);
            return (
              <div
                key={day.toDateString()}
                className="flex-1 min-w-[100px] cursor-pointer"
                onDoubleClick={() => {
                  dispatchSelectDateAndDayView(dispatch, day, AppointmentViewMode.WEEK, selectedDate);
                }}
              >
                <div className="mx-1">
                  <WeekDayColumnSummary
                    appointments={appointments}
                    blocks={blocks}
                    locationStaff={locationStaff}
                    openHour={openHour}
                    closeHour={closeHour}
                    open247={open247}
                    isToday={isToday}
                    day={day}
                    dateKey={dateKey}
                    calendarViewMode={AppointmentViewMode.WEEK}
                    timezone={calendarTimezone}
                    gridSlotStarts={weekGridSlotStarts.length > 0 ? weekGridSlotStarts : undefined}
                    slotHeight={weekGridSlotStarts.length > 0 ? weekSlotHeight : undefined}
                    gridStartMinutes={weekGridSlotStarts.length > 0 ? weekGridStartMinutes : undefined}
                    intervalMinutes={weekGridSlotStarts.length > 0 ? weekSlotIntervalMinutes : undefined}
                    colorMap={weekColorMap}
                    onSlotClick={(hour) => {
                      const hh = String(hour).padStart(2, '0');
                      dispatch(toggleAddForm({
                        open: true,
                        prefill: {
                          date: day,
                          time: `${hh}:00`,
                        },
                      }));
                    }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-col">
      <WeekDayStrip gutterWidth={GUTTER_WIDTH} />
      {isSingleStaff ? (
        <DndContext
          sensors={dndSensors}
          collisionDetection={collisionDetection}
          autoScroll={{ layoutShiftCompensation: false, threshold: { x: 0, y: 0.1 } }}
          measuring={{ droppable: { strategy: MeasuringStrategy.BeforeDragging } }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {gridContent}
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
                  weekGridStartMinutes,
                  weekSlotIntervalMinutes,
                  weekSlotHeight,
                  calendarTimezone,
                );
                return (
                  <div style={{ width: 140 }} className="cursor-grabbing">
                    <AppointmentBlock
                      appointment={activeAppointment}
                      top={0}
                      height={pos.height}
                      colorMap={weekColorMap}
                    />
                  </div>
                );
              })() : null}
            </DragOverlay>,
            document.body,
          )}
        </DndContext>
      ) : (
        gridContent
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
        inputId="week-dnd-override-reason"
      />
    </div>
  );
};
