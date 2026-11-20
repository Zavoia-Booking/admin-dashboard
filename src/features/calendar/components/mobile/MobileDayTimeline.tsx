import { type FC, useCallback, useEffect, useMemo, useRef, useLayoutEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal } from "lucide-react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  pointerWithin,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { toast } from "sonner";
import type {
  SlimAppointment,
  CalendarBlockDto,
  Appointment,
  CalendarStaffMember,
} from "../../../../shared/types/calendar";
import { CalendarBlockScope } from "../../../../shared/types/calendar";
import {
  getLocationContext,
  getLocationStaff,
  getSelectedDate,
  getSelectedLocationId,
  getEffectiveStaffFilterIds,
  getLocationServices,
  getLocationBundles,
  getBookingSettings,
  getLocationOpen247,
  getDayAppointments,
  getDayBlocks,
  getDayData,
} from "../../selectors";
import {
  toggleEditFormAction,
  toggleAddForm,
  setStaffFilter,
  setCalendarPendingDrop,
  updateAppointment,
} from "../../actions";
import { useDayAppointmentList } from "../../hooks/useDayAppointmentList";
import {
  useDayTimelineData,
  type UseDayTimelineDataResult,
} from "../../hooks/useDayTimelineData";
import {
  getTimePositionForGrid,
  clampBlockToViewDay,
  isTimeRangeOutsideWorkingHours,
} from "../../workingHours";
import { buildZonedDateFromDateKey, formatDateInTimezone, getMinutesInTimezone } from "../../timezone";
import { isSlimAppointmentSchedulingLocked } from "../../calendarScheduling";
import {
  evaluateDayTimeSlotDrop,
  isDayTimeSlotForbiddenForPreview,
} from "../../dndDropEligibility";
import type { AppointmentDragData, TimeSlotDropData } from "../CalendarDnD";
import { DROP_ANIMATION } from "../calendarDndAnimations";
import { useGridDndState } from "../timeGrid/useGridDndState";
import { ConfirmDropDialog, RescheduleConfirmDescription } from "../timeGrid/ConfirmDropDialog";
import { OverrideDialog } from "../timeGrid/OverrideDialog";
import { calendarPreferences } from "../../calendarPreferences";
import {
  MOBILE_GRID_HEIGHT_PER_HOUR,
  MOBILE_GUTTER_WIDTH,
  MOBILE_COLUMN_MIN_WIDTH,
  EMPTY_FORBIDDEN_SLOT_SET,
  formatHourLabel,
  type GridSlot,
} from "../timeGrid/constants";
import { EmptyState } from "../../../../shared/components/common/EmptyState";
import { getCalendarBlockReasonLabel } from "../blockReasonMeta";
import { DragTimeIndicator } from "../timeGrid/DragTimeIndicator";
import { MobileDayColumn } from "./MobileDayColumn";
import { MobileGridBlockCard } from "./MobileGridBlockCard";
import { MobileTimelineApptCard } from "./MobileTimelineApptCard";
import { BLOCK_STRIPE_ACCENT, BLOCK_STRIPE_GRID } from "../../blockStyles";
import { MobileDayColumnHeader } from "./MobileDayColumnHeader";
import { MobileBlockSummary } from "./MobileBlockSummary";
import { Skeleton } from "../../../../shared/components/ui/skeleton";
import { useMobileCalendarDragContext } from "./mobileDragContext";
import { dropRejectHaptic, emptySlotTapHaptic } from "../../haptics";

/**
 * Mobile single-day timeline with one column per staff member, horizontally
 * scrollable. Mirrors desktop `DayGrid` structure at a tighter scale:
 *   - 96 px/hour (from 80 on the earlier single-column layout)
 *   - 112 px min column width (desktop uses 140)
 *   - 44 px sticky time gutter on the left
 *
 * Each staff column header is tappable: dispatches `setStaffFilter([id])` so
 * the grid reflows to a full-width view of that staff. To clear, the user
 * opens the filters drawer from the + menu (existing).
 */

const HEADER_HEIGHT = 44; // column-header row height
const MOBILE_HEADER_OFFSET = HEADER_HEIGHT;
const OPENING_SCROLL_INSET = 8; // Leave room for the hour label below the sticky header.

type MobileColumnDef = { key: string; staff: CalendarStaffMember | null };
interface MobileDayLayout {
  appointments: SlimAppointment[];
  blocks: CalendarBlockDto[];
  columns: MobileColumnDef[];
  appointmentsByColumn: Map<string, SlimAppointment[]>;
  staffBlocksByColumn: Map<string, CalendarBlockDto[]>;
  wrapperBlocks: CalendarBlockDto[];
}

export const MobileDayTimeline: FC = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation("calendar");
  const [scrollToNowRequest, setScrollToNowRequest] = useState(0);
  const locationStaff = useSelector(getLocationStaff);
  const locationContext = useSelector(getLocationContext);
  const selectedLocationId = useSelector(getSelectedLocationId);
  const selectedDate = useSelector(getSelectedDate);
  const staffFilterIds = useSelector(getEffectiveStaffFilterIds);

  const timeline = useDayTimelineData({
    hourHeight: MOBILE_GRID_HEIGHT_PER_HOUR,
    headerOffset: 0, // header is rendered separately; grid math starts at 0
  });
  const list = useDayAppointmentList();
  const showFilterEmptyState = list.sortedItems.length === 0 && list.hasActiveFilters;

  const locationServices = useSelector(getLocationServices);
  const locationBundles = useSelector(getLocationBundles);
  const bookingSettings = useSelector(getBookingSettings);
  const open247 = useSelector(getLocationOpen247);
  const dayAppointments = useSelector(getDayAppointments);
  const dayBlocks = useSelector(getDayBlocks);
  const hasDayData = useSelector(getDayData) != null;
  const bufferTimeMinutes = bookingSettings?.bufferTimeMinutes ?? 0;
  const dayWorkingHours = timeline.dayWorkingHours;

  // DnD: shared state machine (sensors, active/over, pending drop, overrides).
  const {
    dispatch: dndDispatch,
    pendingDrop,
    updateConflictOffer,
    activeId,
    setActiveId,
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
    handleDragStart: startGridDrag,
    handleDragOver,
    handleConfirmOverride,
    handleCancelDrop,
    handleConfirmConflictOverride,
    handleCancelConflictOverride,
  } = useGridDndState();

  const collisionDetection: CollisionDetection = useCallback((args) => pointerWithin(args), []);


  // Tell the mobile calendar layout that a drag is in progress so it can
  // suppress pull-to-refresh. We publish this while any appointment is held
  // or dropped and still pending confirmation.
  const { setDragActive } = useMobileCalendarDragContext();
  useEffect(() => {
    const active = activeId != null || pendingDrop != null;
    setDragActive(active);
    return () => setDragActive(false);
  }, [activeId, pendingDrop, setDragActive]);

  const containerRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);
  const handledScrollToNowRequest = useRef(0);
  const positionedGrid = useRef<{ element: HTMLDivElement; dateKey: string; locationId: number } | null>(null);

  const syncScroll = useCallback((source: "header" | "body") => {
    if (isSyncingScroll.current) return;
    const src = source === "body" ? bodyScrollRef.current : headerScrollRef.current;
    const dst = source === "body" ? headerScrollRef.current : bodyScrollRef.current;
    if (!src || !dst) return;
    isSyncingScroll.current = true;
    dst.scrollLeft = src.scrollLeft;
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  }, []);

  useEffect(() => {
    const requestScrollToNow = () => setScrollToNowRequest((request) => request + 1);
    window.addEventListener("calendar:scroll-to-now", requestScrollToNow);
    return () => window.removeEventListener("calendar:scroll-to-now", requestScrollToNow);
  }, []);

  const openingMinutes = timeline.workingHoursBounds?.start ?? 0;
  const hasLocationContext = selectedLocationId != null && selectedLocationId === locationContext?.location.id;
  useLayoutEffect(() => {
    // Wait for the actual grid and the selected location's hours, not the loading skeleton.
    if (list.isDayLoading || showFilterEmptyState || !hasLocationContext) return;
    const el = containerRef.current;
    if (!el) return;
    const previous = positionedGrid.current;
    // Keep an explicit Today jump pending until the day data is ready.
    const hasPendingNowRequest = scrollToNowRequest !== handledScrollToNowRequest.current;
    const shouldJumpToNow = hasPendingNowRequest && timeline.isToday && hasDayData;
    const isNewGrid = !previous || previous.element !== el ||
      previous.dateKey !== timeline.dateKey || previous.locationId !== selectedLocationId;
    if (shouldJumpToNow || isNewGrid) {
      const scroller = findScrollParent(el);
      if (!scroller) return;
      const target = shouldJumpToNow
        ? timeline.nowGutterTop + MOBILE_HEADER_OFFSET - scroller.clientHeight / 2
        : (openingMinutes / 60) * timeline.hourHeight - OPENING_SCROLL_INSET;
      scroller.scrollTop = Math.max(0, target);
      positionedGrid.current = { element: el, dateKey: timeline.dateKey, locationId: selectedLocationId };
    }
    if (hasPendingNowRequest && (shouldJumpToNow || !timeline.isToday)) {
      handledScrollToNowRequest.current = scrollToNowRequest;
    }
  }, [
    hasDayData, hasLocationContext, list.isDayLoading, openingMinutes, scrollToNowRequest,
    selectedLocationId, showFilterEmptyState, timeline.dateKey, timeline.hourHeight,
    timeline.isToday, timeline.nowGutterTop,
  ]);

  // Tap an empty slot → open the add form prefilled with that time and staff, like desktop.
  // Column id 0 is the unassigned column.
  const handleSlotClick = useCallback(
    (hour: number, minute?: number, columnId?: number) => {
      const hh = String(hour).padStart(2, "0");
      const mm = String(minute ?? 0).padStart(2, "0");
      emptySlotTapHaptic();
      dispatch(
        toggleAddForm({
          open: true,
          prefill: {
            date: selectedDate,
            time: `${hh}:${mm}`,
            staffUserId: columnId ? columnId : undefined,
          },
        }),
      );
    },
    [dispatch, selectedDate],
  );

  const handleAppointmentTap = useCallback(
    (appt: SlimAppointment) => {
      const placeholder: Appointment = {
        id: appt.id,
        customer: null,
        teamMembers: [],
        location: { id: 0, name: "", address: "", description: "", phone: "", email: "" },
        scheduledAt: new Date(appt.scheduledAt),
        endsAt: new Date(appt.endsAt),
        status: appt.status,
        notes: "",
        price: 0,
        cancellationReason: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        bookedItemName: appt.bookedItemName,
        bookingSource: appt.bookingSource,
        overrideReason: appt.overrideReason,
      };
      dispatch(toggleEditFormAction({ open: true, item: placeholder }));
    },
    [dispatch],
  );

  // Track only the id; deref the fresh block on each render so edits made via
  // the edit slider are reflected in the summary without needing to re-tap.
  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);
  const handleBlockTap = useCallback((block: CalendarBlockDto) => {
    setActiveBlockId(block.id);
  }, []);

  const handleColumnFilter = useCallback(
    (staffId: number) => {
      // Toggle: tapping the already-filtered column clears it (user intent
      // "show all staff again"). Tapping any other column narrows to it.
      const isCurrentlyFiltered =
        staffFilterIds.length === 1 && staffFilterIds[0] === staffId;
      dispatch(setStaffFilter(isCurrentlyFiltered ? [] : [staffId]));
    },
    [dispatch, staffFilterIds],
  );

  // ───────────────────────────────────────────────────────────────
  // DnD — memos keyed by columnId (staff.id or 0 for unassigned)
  // Mirrors desktop DayGrid's eligibility wiring so the validation
  // layer (`dndDropEligibility.ts`) works unchanged.
  // ───────────────────────────────────────────────────────────────
  const calendarTimezone = timeline.calendarTimezone ?? "UTC";
  const dateKey = timeline.dateKey;

  const isDayInPast = useMemo(() => {
    return dateKey < formatDateInTimezone(new Date(), calendarTimezone);
  }, [dateKey, calendarTimezone]);

  const dndColumns = useMemo(() => {
    const staffCols = locationStaff.map((s) => ({
      id: s.id,
      label: `${s.firstName} ${s.lastName}`,
      isUnassigned: false,
    }));
    const hasUnassigned = dayAppointments.some(
      (a) => a.isUnassigned || a.staffUserIds.length === 0,
    );
    if (hasUnassigned) {
      staffCols.push({ id: 0, label: t("page.common.unassigned"), isUnassigned: true });
    }
    return staffCols;
  }, [locationStaff, dayAppointments, t]);

  const dndAppointmentsByColumn = useMemo(() => {
    const map = new Map<number, SlimAppointment[]>();
    for (const col of dndColumns) map.set(col.id, []);
    for (const a of dayAppointments) {
      if (a.isUnassigned || a.staffUserIds.length === 0) {
        map.get(0)?.push(a);
      } else {
        for (const staffId of a.staffUserIds) {
          if (map.has(staffId)) map.get(staffId)!.push(a);
        }
      }
    }
    return map;
  }, [dayAppointments, dndColumns]);

  const dndBlocksByColumn = useMemo(() => {
    const map = new Map<number, CalendarBlockDto[]>();
    for (const col of dndColumns) map.set(col.id, []);
    for (const b of dayBlocks) {
      if (b.blockScope === "staff" && b.userId && map.has(b.userId)) {
        map.get(b.userId)!.push(b);
      }
    }
    return map;
  }, [dayBlocks, dndColumns]);

  const [dragSource, setDragSource] = useState<{
    dragData: AppointmentDragData;
    nowMs: number;
  } | null>(null);
  const activeAppointment = dragSource?.dragData.appointment;

  // While a drag is active, only the source column needs live drop targets —
  // mobile is reschedule-only, same-column. Non-source columns skip mounting
  // `DroppableSlot` entirely so dnd-kit's pointerWithin collision loop shrinks
  // from ~N×96 to just 96. That's the dominant cost of multi-column drag lag
  // on cheap Android WebView.
  const dragSourceColumnId = dragSource?.dragData.columnId ?? null;

  const schedulingLockedAppointmentIds = useMemo(() => {
    const ids = new Set<number>();
    for (const a of dayAppointments) {
      if (isSlimAppointmentSchedulingLocked(a, dayAppointments)) ids.add(a.id);
    }
    return ids;
  }, [dayAppointments]);

  const slotIntervalMinutes = timeline.slotIntervalMinutes;
  const dayGridSlotStarts = timeline.dayGridSlotStarts;
  const [dropPreviewSlot, setDropPreviewSlot] = useState<GridSlot | null>(null);
  const latestDropPreview = useRef<GridSlot | null>(null);
  const dropPreviewFrame = useRef<number | null>(null);

  const cancelDropPreviewFrame = useCallback(() => {
    if (dropPreviewFrame.current != null) {
      cancelAnimationFrame(dropPreviewFrame.current);
      dropPreviewFrame.current = null;
    }
  }, []);
  useEffect(() => cancelDropPreviewFrame, [cancelDropPreviewFrame]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    startGridDrag(event);
    setDragSource(dndSessionRef.current);
  }, [startGridDrag, dndSessionRef]);

  const dayForbiddenSlotIds = useMemo(() => {
    if (!dragSource) return EMPTY_FORBIDDEN_SLOT_SET;
    const { nowMs, dragData } = dragSource;
    const { appointment, columnId } = dragData;
    if (appointment.status === "cancelled" || schedulingLockedAppointmentIds.has(appointment.id)) return EMPTY_FORBIDDEN_SLOT_SET;
    const targetColumnLabel = dndColumns.find((col) => col.id === columnId)?.label ?? t("page.dnd.thisTeamMember");
    const forbidden = new Set<string>();
    // Only the source column has mounted drop targets while dragging.
    for (const slot of dayGridSlotStarts) {
      if (isDayTimeSlotForbiddenForPreview({
        appointment,
        sourceColumnId: columnId,
        sourceDateKey: dragData.dateKey,
        targetColumnId: columnId,
        targetDateKey: dateKey,
        targetHour: slot.hour,
        targetMinute: slot.minute,
        nowMs,
        calendarTimezone,
        dayAppointments,
        appointmentsByColumn: dndAppointmentsByColumn,
        blocksByColumn: dndBlocksByColumn,
        locationServices,
        locationBundles,
        targetColumnLabel,
        bufferTimeMinutes,
      })) {
        forbidden.add(`slot-${columnId}-${dateKey}-${slot.hour}-${slot.minute}`);
      }
    }
    return forbidden;
  }, [
    dragSource,
    schedulingLockedAppointmentIds,
    dndColumns,
    dayGridSlotStarts,
    dateKey,
    calendarTimezone,
    dayAppointments,
    dndAppointmentsByColumn,
    dndBlocksByColumn,
    locationServices,
    locationBundles,
    bufferTimeMinutes,
    t,
  ]);

  const resolveDropSlot = useCallback((event: DragMoveEvent | DragEndEvent, data: AppointmentDragData): GridSlot | null => {
    if (data.dateKey !== dateKey) return null;
    // The move event can still carry the previous `over` while dnd-kit
    // publishes the current collision. Prefer the hit from this event.
    const hit = event.collisions?.[0]?.data?.droppableContainer;
    const target = event.collisions == null ? event.over : hit;
    const slot = target?.data.current as TimeSlotDropData | undefined;
    if (
      slot?.type === "time-slot" && slot.columnId === data.columnId &&
      slot.dateKey === data.dateKey && !target?.disabled
    ) {
      return { hour: slot.hour, minute: slot.minute ?? 0 };
    }
    if (slotIntervalMinutes <= 0 || timeline.daySlotHeight <= 0 || dayGridSlotStarts.length === 0) return null;

    // Preserve the same-column fallback, including dnd-kit's autoscroll delta.
    const sourceMinutes = getMinutesInTimezone(data.appointment.scheduledAt, calendarTimezone);
    const sourceIndex = Math.max(0, Math.round((sourceMinutes - timeline.dayGridStartMinutes) / slotIntervalMinutes));
    const slotDelta = Math.round(event.delta.y / timeline.daySlotHeight);
    const index = Math.max(0, Math.min(dayGridSlotStarts.length - 1, sourceIndex + slotDelta));
    return dayGridSlotStarts[index] ?? null;
  }, [calendarTimezone, dateKey, dayGridSlotStarts, slotIntervalMinutes, timeline.dayGridStartMinutes, timeline.daySlotHeight]);

  const handleDragPreview = useCallback((event: DragMoveEvent) => {
    const data = event.active.data.current as AppointmentDragData | undefined;
    if (data?.type !== "appointment" || !dndSessionRef.current) return;
    const next = resolveDropSlot(event, data);
    const previous = latestDropPreview.current;
    if (next?.hour === previous?.hour && next?.minute === previous?.minute) return;
    latestDropPreview.current = next;
    if (dropPreviewFrame.current == null) {
      dropPreviewFrame.current = requestAnimationFrame(() => {
        dropPreviewFrame.current = null;
        setDropPreviewSlot(latestDropPreview.current);
      });
    }
  }, [dndSessionRef, resolveDropSlot]);

  const handleMobileDragOver = useCallback((event: DragMoveEvent) => {
    handleDragOver(event);
    handleDragPreview(event);
  }, [handleDragOver, handleDragPreview]);

  const clearMobileDrag = useCallback(() => {
    dndSessionRef.current = null;
    cancelDropPreviewFrame();
    latestDropPreview.current = null;
    setActiveId(null);
    setOverId(null);
    setDragSource(null);
    setDropPreviewSlot(null);
  }, [cancelDropPreviewFrame, dndSessionRef, setActiveId, setOverId]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      clearMobileDrag();
      const nowMs = Date.now();
      const data = event.active.data?.current as AppointmentDragData | null;
      if (!data || data.type !== "appointment") return;
      const appointment = data.appointment;
      if (appointment.status === "cancelled") return;
      if (isSlimAppointmentSchedulingLocked(appointment, dayAppointments)) return;
      const slot = resolveDropSlot(event, data);
      if (!slot) return;
      const targetDateKey = data.dateKey;
      const targetColumnId = data.columnId;

      const label =
        dndColumns.find((c) => c.id === targetColumnId)?.label ?? t("page.dnd.thisTeamMember");
      const slotResult = evaluateDayTimeSlotDrop({
        appointment,
        sourceColumnId: data.columnId,
        sourceDateKey: data.dateKey,
        targetColumnId,
        targetDateKey,
        targetHour: slot.hour,
        targetMinute: slot.minute,
        nowMs,
        calendarTimezone,
        dayAppointments,
        appointmentsByColumn: dndAppointmentsByColumn,
        blocksByColumn: dndBlocksByColumn,
        locationServices,
        locationBundles,
        targetColumnLabel: label,
        bufferTimeMinutes,
      });
      if (!slotResult.ok) {
        if (slotResult.toastMessage) {
          toast.error(slotResult.toastMessage);
          dropRejectHaptic();
        }
        return;
      }
      if (slotResult.action === "noop") return;
      dndDispatch(
        setCalendarPendingDrop({
          type: "reschedule",
          appointment,
          dateKey: slotResult.dateKey,
          hour: slotResult.hour,
          minute: slotResult.minute,
          columnId: slotResult.columnId,
        }),
      );
    },
    [
      dndDispatch,
      dndAppointmentsByColumn,
      dndBlocksByColumn,
      dayAppointments,
      calendarTimezone,
      locationServices,
      locationBundles,
      dndColumns,
      bufferTimeMinutes,
      clearMobileDrag,
      resolveDropSlot,
      t,
    ],
  );

  const handleConfirmDrop = useCallback(() => {
    if (!pendingDrop || dropConfirmInProgress) return;
    const toConfirm = pendingDrop;
    if (toConfirm.type !== "reschedule") return; // mobile has no reassign drop

    const { appointment, dateKey: dKey, hour } = toConfirm;
    const minute = toConfirm.minute ?? 0;
    const newScheduledAt = buildZonedDateFromDateKey(
      dKey,
      `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      calendarTimezone,
    );
    const newEndsAt = new Date(newScheduledAt.getTime() + appointment.duration * 60 * 1000);
    const isOutOfHours =
      !open247 &&
      dayWorkingHours &&
      isTimeRangeOutsideWorkingHours(newScheduledAt, appointment.duration, dayWorkingHours, open247, calendarTimezone);
    if (isOutOfHours) {
      setPendingReschedulePayload({
        appointmentId: appointment.id,
        newScheduledAt,
        newEndsAt,
        staffUserIds: undefined,
      });
      setOverrideDialogOpen(true);
      return;
    }
    const scheduledAt = newScheduledAt.toISOString();
    setDropConfirmInProgress(true);
    dndDispatch(
      updateAppointment.request({
        appointmentId: appointment.id,
        data: { scheduledAt },
      }),
    );
  }, [
    pendingDrop,
    dropConfirmInProgress,
    dndDispatch,
    open247,
    dayWorkingHours,
    calendarTimezone,
    setDropConfirmInProgress,
    setPendingReschedulePayload,
    setOverrideDialogOpen,
  ]);

  // Column + appointment layout derivation. Memoized to avoid rebuilding
  // `appointmentsByColumn` (O(cols × appts) allocations) and running the
  // group-drag preview rewrite on every target change during drag — that
  // rebuild was a top bottleneck on cheap Android WebView.
  const layout = useMemo<MobileDayLayout>(() => {
    const appointments = list.sortedItems
      .filter((i): i is Extract<typeof i, { type: "appointment" }> => i.type === "appointment")
      .map((i) => i.data);
    const blocks = list.sortedItems
      .filter((i): i is Extract<typeof i, { type: "block" }> => i.type === "block")
      .map((i) => i.data);

    const displayedStaff: CalendarStaffMember[] = staffFilterIds.length > 0
      ? locationStaff.filter((s) => staffFilterIds.includes(s.id))
      : locationStaff;
    const hasUnassignedAppt = appointments.some(
      (a) => a.isUnassigned || a.staffUserIds.length === 0,
    );
    const columns: MobileColumnDef[] = [
      ...displayedStaff.map((s) => ({ key: `staff-${s.id}`, staff: s })),
      ...(hasUnassignedAppt
        ? [{ key: "unassigned", staff: null as CalendarStaffMember | null }]
        : []),
    ];

    const appointmentsByColumn = new Map<string, SlimAppointment[]>();
    for (const col of columns) {
      if (col.staff) {
        appointmentsByColumn.set(
          col.key,
          appointments.filter((a) => a.staffUserIds.includes(col.staff!.id)),
        );
      } else {
        appointmentsByColumn.set(
          col.key,
          appointments.filter((a) => a.isUnassigned || a.staffUserIds.length === 0),
        );
      }
    }

    // Post-drop optimistic preview: the moment the user releases the drag
    // (pendingDrop set, dialog about to open), visually relocate the dragged
    // appointment to the drop position so the card lands where the finger
    // landed — NOT at its old scheduledAt. Matches desktop `DayGrid.
    // appointmentsByColumnWithPreview`. On confirm → saga updates scheduledAt
    // to match (no visible change). On cancel → pendingDrop clears →
    // POSITION_TRANSITION eases the card back to its original slot.
    if (pendingDrop && pendingDrop.type === "reschedule") {
      const pd = pendingDrop;
      // Remove the dragged appointment from every column so we can re-insert at
      // the preview position without duplicates.
      for (const [key, listForCol] of appointmentsByColumn) {
        appointmentsByColumn.set(key, listForCol.filter((a) => a.id !== pd.appointment.id));
      }

      const resolveColKey = (staffId: number | undefined): string => {
        if (staffId != null && staffId !== 0) return `staff-${staffId}`;
        return "unassigned";
      };

      const minute = pd.minute ?? 0;
      const previewStart = buildZonedDateFromDateKey(
        pd.dateKey,
        `${String(pd.hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
        calendarTimezone,
      );
      const previewEnd = new Date(
        previewStart.getTime() + pd.appointment.duration * 60 * 1000,
      );
      // Re-insert in the original column (mobile is reschedule-only; staff
      // doesn't change during a drop).
      const colKey = resolveColKey(pd.appointment.staffUserIds?.[0]);
      const existing = appointmentsByColumn.get(colKey);
      if (existing) {
        appointmentsByColumn.set(colKey, [
          ...existing,
          {
            ...pd.appointment,
            scheduledAt: previewStart.toISOString(),
            endsAt: previewEnd.toISOString(),
          },
        ]);
      }
    }

    // Staff-scoped blocks per column; location/business blocks paint wrapper-level.
    const staffBlocksByColumn = new Map<string, CalendarBlockDto[]>();
    for (const col of columns) {
      if (col.staff) {
        staffBlocksByColumn.set(
          col.key,
          blocks.filter(
            (b) =>
              !b.isAllDay &&
              b.blockScope === CalendarBlockScope.STAFF &&
              b.userId === col.staff!.id,
          ),
        );
      } else {
        staffBlocksByColumn.set(col.key, []);
      }
    }
    const wrapperBlocks = blocks.filter((b) => b.blockScope !== CalendarBlockScope.STAFF);

    return { appointments, blocks, columns, appointmentsByColumn, staffBlocksByColumn, wrapperBlocks };
  }, [
    list.sortedItems,
    staffFilterIds,
    locationStaff,
    pendingDrop,
    dateKey,
    calendarTimezone,
  ]);

  // Show skeleton only on the true first load (no data in store yet). While a
  // refetch is in flight over existing data — e.g. post-drop refresh after a
  // reschedule — keep the grid mounted so cards' POSITION_TRANSITION animates
  // from old to new top instead of unmount-remounting at the new spot.
  if (!hasLocationContext || (list.isDayLoading && layout.appointments.length === 0 && layout.blocks.length === 0)) {
    return <MobileTimelineSkeleton />;
  }

  if (showFilterEmptyState) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <EmptyState
          icon={SlidersHorizontal}
          title={t("page.appointments.noMatchFilters")}
          description={t("page.appointments.noMatchFiltersDayDesc")}
          className="!py-0 !gap-6"
        />
      </div>
    );
  }

  const { blocks, columns, appointmentsByColumn, staffBlocksByColumn, wrapperBlocks } = layout;

  // Single-staff case (filter active OR only one staff total): treat the column
  // as full-width, skip horizontal scrolling entirely.
  const isSingleColumn = columns.length === 1;
  const gridHeight = 24 * MOBILE_GRID_HEIGHT_PER_HOUR;
  const previewSlotId = dragSource && dropPreviewSlot &&
    dragSource.dragData.dateKey === dateKey && activeAppointment && activeAppointment.status !== "cancelled" &&
    !schedulingLockedAppointmentIds.has(activeAppointment.id)
    ? `slot-${dragSource.dragData.columnId}-${dateKey}-${dropPreviewSlot.hour}-${dropPreviewSlot.minute}`
    : null;
  const validPreviewSlotId = previewSlotId && !dayForbiddenSlotIds.has(previewSlotId) ? previewSlotId : null;
  const previewTop = validPreviewSlotId && dropPreviewSlot
    ? ((dropPreviewSlot.hour * 60 + dropPreviewSlot.minute - timeline.dayGridStartMinutes) / slotIntervalMinutes) * timeline.daySlotHeight
    : 0;
  const dropPreview = validPreviewSlotId && activeAppointment
    ? {
        top: previewTop,
        height: Math.min(gridHeight - previewTop, (activeAppointment.duration / slotIntervalMinutes) * timeline.daySlotHeight),
      }
    : undefined;

  // Sticky staff-column indicator on the filter state.
  const filteredStaffId = staffFilterIds.length === 1 ? staffFilterIds[0] : null;
  const unassignedLabel = t("page.common.unassigned");

  // Staff color map for avatars (By Staff coding).
  const colorCodingPref = calendarPreferences.getColorCoding();
  const staffColorMap = colorCodingPref === "staff" ? list.appointmentColorMap : null;

  // Always set overflow-y explicitly. `overflow-x` alone with default
  // `overflow-y: visible` gets promoted to `auto` per the CSS spec, which
  // would turn this zone into a nested vertical scroll container and steal
  // vertical gestures from contentRef (freezing scroll in single-column mode).
  const scrollZoneClass = `${isSingleColumn ? "overflow-x-hidden" : "overflow-x-auto"} overflow-y-clip flex-1 no-scrollbar`;
  const innerMinWidth = isSingleColumn ? undefined : columns.length * MOBILE_COLUMN_MIN_WIDTH;

  const confirmDescription = (() => {
    if (!pendingDrop || pendingDrop.type !== "reschedule") return null;
    return (
      <RescheduleConfirmDescription
        name={pendingDrop.appointment.bookedItemName}
        customerName={pendingDrop.appointment.customerName}
        sourceScheduledAt={pendingDrop.appointment.scheduledAt}
        targetDateKey={pendingDrop.dateKey}
        targetHour={pendingDrop.hour}
        targetMinute={pendingDrop.minute}
        timezone={timeline.calendarTimezone ?? "UTC"}
      />
    );
  })();

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col w-full bg-background"
      // Scope layout + paint invalidations to this subtree so reflows triggered
      // by the location header's margin transition (above contentRef) don't
      // cascade into the grid's DOM tree.
      style={{ contain: "layout paint" }}
    >
     <DndContext
      sensors={dndSensors}
      collisionDetection={collisionDetection}
      autoScroll={{ layoutShiftCompensation: false, threshold: { x: 0, y: 0.15 } }}
      measuring={{ droppable: { strategy: MeasuringStrategy.BeforeDragging } }}
      onDragStart={handleDragStart}
      onDragMove={handleDragPreview}
      onDragOver={handleMobileDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={clearMobileDrag}
     >
      {/* Sticky header row — lives outside the horizontal scroll zone so it can
       *  stick to the top of the outer MobileCalendarLayout scroll container
       *  (sticky anchors to the nearest scroll container; nesting inside the
       *  horizontal scroll zone would bind it there instead).
       *
       *  `will-change: transform` promotes it to its own compositor layer so
       *  the browser keeps it on the GPU during scroll and during the location
       *  header's margin transition, rather than re-painting per frame. */}
      <div
        className="sticky top-0 z-30 flex bg-white dark:bg-surface"
        style={{ willChange: "transform" }}
      >
        <div
          className="shrink-0 border-r border-border/60"
          style={{ width: MOBILE_GUTTER_WIDTH }}
        >
          <div className="h-11 border-b border-border/60" />
        </div>
        <div
          ref={headerScrollRef}
          onScroll={() => syncScroll("header")}
          className={scrollZoneClass}
        >
          <div className="flex" style={{ minWidth: innerMinWidth }}>
            {columns.map((col) => (
              <div
                key={col.key}
                className="border-l border-border/60"
                style={{ minWidth: MOBILE_COLUMN_MIN_WIDTH, flex: `1 0 ${MOBILE_COLUMN_MIN_WIDTH}px` }}
              >
                <MobileDayColumnHeader
                  staff={col.staff}
                  isFiltered={col.staff != null && filteredStaffId === col.staff.id}
                  onTap={() => col.staff && handleColumnFilter(col.staff.id)}
                  staffColorMap={staffColorMap}
                  unassignedLabel={unassignedLabel}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body row — gutter with hour labels + horizontally-scrollable grid. */}
      <div className="relative flex w-full">
        <div
          className="shrink-0 bg-white dark:bg-surface border-r border-border/60"
          style={{ width: MOBILE_GUTTER_WIDTH, height: gridHeight }}
        >
          <div className="relative" style={{ height: gridHeight }}>
            <HourLabels timeline={timeline} />
            {timeline.isToday && (
              <div
                className="absolute right-0 z-30 pointer-events-none -translate-y-1/2"
                style={{ top: timeline.nowGutterTop }}
                aria-hidden
              >
                <span className="bg-white text-primary text-[10px] border border-primary border-2 font-semibold leading-none px-1 py-1.5 rounded-full tabular-nums whitespace-nowrap text-center inline-block">
                  {timeline.nowLabel}
                </span>
              </div>
            )}
            <DragTimeIndicator
              overId={validPreviewSlotId}
              dayGridStartMinutes={timeline.dayGridStartMinutes}
              slotIntervalMinutes={timeline.slotIntervalMinutes}
              daySlotHeight={timeline.daySlotHeight}
              is24h={timeline.is24h}
            />
          </div>
        </div>
        <div
          ref={bodyScrollRef}
          onScroll={() => syncScroll("body")}
          className={scrollZoneClass}
        >
          <div
            className="relative bg-surface"
            style={{ minWidth: innerMinWidth, height: gridHeight }}
          >
            <WorkingHoursShading timeline={timeline} />
            <HourDividers timeline={timeline} headerOffset={0} />
            <div className="flex relative" style={{ minHeight: gridHeight }}>
              {columns.map((col) => {
                const columnId = col.staff?.id ?? 0;
                // Non-source columns during a drag: skip DroppableSlot mounts
                // entirely. dnd-kit's pointerWithin iterates every registered
                // droppable on every pointer move — collapsing the list to
                // just the source column's ~96 slots (vs ~96 × N columns) is
                // the single biggest drag-time perf win on cheap Android.
                const isInactiveDragColumn =
                  activeId != null &&
                  dragSourceColumnId != null &&
                  columnId !== dragSourceColumnId;
                return (
                  <MobileDayColumn
                    key={col.key}
                    staff={col.staff}
                    isFiltered={col.staff != null && filteredStaffId === col.staff.id}
                    appointments={appointmentsByColumn.get(col.key) ?? []}
                    blocks={staffBlocksByColumn.get(col.key) ?? []}
                    dayGridStartMinutes={timeline.dayGridStartMinutes}
                    slotIntervalMinutes={timeline.slotIntervalMinutes}
                    daySlotHeight={timeline.daySlotHeight}
                    dateKey={timeline.dateKey}
                    columnId={columnId}
                    timezone={timeline.calendarTimezone ?? undefined}
                    colorMap={list.appointmentColorMap}
                    staffColorMap={staffColorMap}
                    onFilter={() => col.staff && handleColumnFilter(col.staff.id)}
                    onAppointmentTap={handleAppointmentTap}
                    onBlockTap={handleBlockTap}
                    onSlotClick={handleSlotClick}
                    unassignedLabel={unassignedLabel}
                    headerSlot={<></>}
                    gridSlotStarts={isInactiveDragColumn ? undefined : dayGridSlotStarts}
                    dndActive={!!activeId}
                    forbiddenSlotIds={activeId ? dayForbiddenSlotIds : EMPTY_FORBIDDEN_SLOT_SET}
                    dropPreview={columnId === dragSourceColumnId ? dropPreview : undefined}
                    schedulingLockedAppointmentIds={schedulingLockedAppointmentIds}
                    isToday={timeline.isToday}
                    isDayInPast={isDayInPast}
                    nowMinutes={timeline.nowMinutes}
                    day={selectedDate}
                    locationStaff={locationStaff}
                  />
                );
              })}
            </div>
            <BlocksLayer
              blocks={wrapperBlocks}
              timeline={timeline}
              headerOffset={0}
              onTap={handleBlockTap}
            />
            {timeline.isToday && <NowLine timeline={timeline} headerOffset={0} />}
          </div>
        </div>
      </div>

      {createPortal(
        <DragOverlay
          // 120ms in-place fade-out on drop (via DROP_ANIMATION). Original
          // dimmed card remains visible at its old position under the fading
          // overlay, then POSITION_TRANSITION slides it to the new slot after
          // the saga commits the reschedule.
          dropAnimation={DROP_ANIMATION}
          modifiers={[snapCenterToCursor]}
          style={{ pointerEvents: "none" }}
        >
          {activeAppointment ? (
            <MobileDragOverlayCard
              appointment={activeAppointment}
              height={Math.max(
                28,
                (activeAppointment.duration / timeline.slotIntervalMinutes) * timeline.daySlotHeight,
              )}
              colorMap={list.appointmentColorMap}
              timezone={timeline.calendarTimezone ?? undefined}
            />
          ) : null}
        </DragOverlay>,
        document.body,
      )}
     </DndContext>

      <ConfirmDropDialog
        open={!!pendingDrop && !overrideDialogOpen && !dropConfirmInProgress && confirmModalDelayedOpen}
        onOpenChange={(open) => !open && handleCancelDrop()}
        onConfirm={handleConfirmDrop}
        onCancel={handleCancelDrop}
        description={confirmDescription}
      />
      <OverrideDialog
        open={overrideDialogOpen || (!!updateConflictOffer && updateConflictOffer.conflictType !== "staff_appointment")}
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
        inputId="mobile-dnd-override-reason"
      />

      <MobileBlockSummary
        block={
          activeBlockId != null
            ? blocks.find((b) => b.id === activeBlockId) ?? null
            : null
        }
        onClose={() => setActiveBlockId(null)}
        locationStaff={locationStaff}
        timezone={timeline.calendarTimezone ?? undefined}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Hour labels (in the sticky gutter)
// ─────────────────────────────────────────────────────────────

const HourLabels: FC<{ timeline: UseDayTimelineDataResult }> = ({ timeline }) => {
  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = 0; h <= 24; h += 1) arr.push(h);
    return arr;
  }, []);
  return (
    <>
      {hours.map((hour) => {
        const top = hour * timeline.hourHeight;
        return (
          <div
            key={hour}
            className="absolute right-0 pr-2 text-right text-[11px] font-medium text-foreground-3 tabular-nums -translate-y-1/2"
            style={{ top, width: MOBILE_GUTTER_WIDTH }}
          >
            {hour === 0 || hour === 24 ? "" : formatHourLabel(hour, timeline.is24h)}
          </div>
        );
      })}
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// DragOverlay already sizes its wrapper to the draggable's measured width.
// ─────────────────────────────────────────────────────────────

interface MobileDragOverlayCardProps {
  appointment: SlimAppointment;
  height: number;
  colorMap: Map<string, import("../../colors").AppointmentBlockColorPair> | null | undefined;
  timezone?: string;
}

const MobileDragOverlayCard: FC<MobileDragOverlayCardProps> = ({
  appointment,
  height,
  colorMap,
  timezone,
}) => {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        filter:
          "drop-shadow(0 8px 16px rgba(0,0,0,0.22)) drop-shadow(0 2px 4px rgba(0,0,0,0.10))",
      }}
      className="cursor-grabbing"
    >
      <MobileTimelineApptCard
        appointment={appointment}
        top={0}
        height={height}
        colorMap={colorMap}
        timezone={timezone}
        isDragPreview
        onTap={() => {}}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Hour dividers (horizontal lines, wrapper-level)
// ─────────────────────────────────────────────────────────────

const HourDividers: FC<{ timeline: UseDayTimelineDataResult; headerOffset: number }> = ({
  timeline,
  headerOffset,
}) => {
  const h = timeline.hourHeight;
  return (
    <div
      className="absolute left-0 right-0 pointer-events-none"
      style={{
        top: headerOffset,
        height: 24 * h + 1,
        backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${h - 1}px, rgba(0,0,0,0.07) ${h - 1}px ${h}px)`,
      }}
      aria-hidden
    />
  );
};

// ─────────────────────────────────────────────────────────────
// Non-working-hours shading (wrapper-level)
// ─────────────────────────────────────────────────────────────

const WorkingHoursShading: FC<{ timeline: UseDayTimelineDataResult }> = ({ timeline }) => {
  const { workingHoursBounds, isClosed, hourHeight } = timeline;
  if (isClosed) {
    return (
      <div
        className="pointer-events-none absolute inset-0 bg-neutral-200 dark:bg-surface-active"
        aria-hidden
      />
    );
  }
  // A 24/7 location has no closed-hours regions.
  if (!workingHoursBounds) return null;
  const openingTop = (workingHoursBounds.start / 60) * hourHeight;
  const closingTop = (workingHoursBounds.end / 60) * hourHeight;

  return (
    <>
      {workingHoursBounds.start > 0 && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 border-b-2 border-border-strong bg-neutral-200 dark:bg-surface-active"
          style={{ height: openingTop }}
          aria-hidden
        />
      )}
      {workingHoursBounds.end < 24 * 60 && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 border-t-2 border-border-strong bg-neutral-200 dark:bg-surface-active"
          style={{ top: closingTop }}
          aria-hidden
        />
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Blocks layer (wrapper-level, diagonal hatch)
// ─────────────────────────────────────────────────────────────

const BLOCK_HATCH_STYLE: React.CSSProperties = { background: BLOCK_STRIPE_GRID };

interface BlocksLayerProps {
  blocks: CalendarBlockDto[];
  timeline: UseDayTimelineDataResult;
  headerOffset: number;
  onTap: (block: CalendarBlockDto) => void;
}

const BlocksLayer: FC<BlocksLayerProps> = ({ blocks, timeline, headerOffset, onTap }) => {
  const { t } = useTranslation("calendar");
  const tz = timeline.calendarTimezone ?? undefined;
  return (
    <>
      {blocks.map((block) => {
        if (block.isAllDay) {
          return (
            <button
              key={`block-${block.id}`}
              type="button"
              onClick={() => onTap(block)}
              className="absolute rounded-md border-l-[3px] px-2 py-1 text-left text-[11px] font-medium text-foreground-1"
              style={{
                top: headerOffset + 2,
                left: 0,
                right: 4,
                borderLeftColor: BLOCK_STRIPE_ACCENT,
                ...BLOCK_HATCH_STYLE,
              }}
            >
              <span className="truncate">
                {t("page.blocks.allDay")} · {getCalendarBlockReasonLabel(block.reason, t)}
              </span>
            </button>
          );
        }
        const clipped = tz
          ? clampBlockToViewDay(block.startsAt, block.endsAt, timeline.dateKey, tz)
          : { startsAt: block.startsAt, endsAt: block.endsAt };
        const { top, height } = getTimePositionForGrid(
          clipped.startsAt,
          clipped.endsAt,
          timeline.dayGridStartMinutes,
          timeline.slotIntervalMinutes,
          timeline.daySlotHeight,
          tz,
        );
        return (
          <MobileGridBlockCard
            key={`block-${block.id}`}
            block={block}
            top={top + headerOffset}
            height={height}
            left={2}
            right={4}
            dateKey={timeline.dateKey}
            timezone={tz}
            onTap={onTap}
          />
        );
      })}
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Now line
// ─────────────────────────────────────────────────────────────

const NowLine: FC<{ timeline: UseDayTimelineDataResult; headerOffset: number }> = ({
  timeline,
  headerOffset,
}) => {
  return (
    <div
      className="absolute left-0 right-0 pointer-events-none z-20 flex items-center"
      style={{ top: timeline.nowGutterTop + headerOffset }}
      aria-hidden
    >
      <div className="flex-1 h-[2px] bg-primary" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────

const MobileTimelineSkeleton: FC = () => (
  <div className="relative w-full p-2">
    {Array.from({ length: 8 }, (_, i) => (
      <div key={i} className="flex items-center gap-2 py-3">
        <Skeleton className="h-3 shrink-0" style={{ width: MOBILE_GUTTER_WIDTH - 8 }} />
        <Skeleton className="flex-1 h-8" />
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function findScrollParent(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}
