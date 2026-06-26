/**
 * Drag-and-drop helpers for calendar grid: draggable appointment block and droppable slot.
 * Used by CalendarTimeGrid (Day view) for reschedule and staff reassign.
 * Whole card is draggable; DndContext uses delay activation (hold to drag). Single click opens details.
 */
import { type FC, memo, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { SlimAppointment, Appointment } from "../../../shared/types/calendar.ts";
import { toggleEditFormAction } from "../actions.ts";
import { AppointmentBlock } from "./AppointmentBlock.tsx";
import type { AppointmentBlockColorPair } from "../colors.ts";
import { getTimePositionForGrid } from "../workingHours.ts";

const HOUR_HEIGHT = 128;
const GRID_START_HOUR = 6;

// Stable reference for the Apple-style position transition so the inline
// `style` object's `transition` slot is identity-equal across renders —
// React's style-diff short-circuits on identity, skipping DOM attribute
// writes on every render of every card during a drag. Opacity transition
// included so the dimmed-original cancel/reject returns smoothly. Kept
// module-local (not exported) to keep Vite Fast Refresh happy; the mobile
// card maintains its own identical copy.
const POSITION_TRANSITION =
  "top 180ms cubic-bezier(0.2, 0, 0, 1), " +
  "height 180ms cubic-bezier(0.2, 0, 0, 1), " +
  "opacity 150ms ease-out";

export type AppointmentDragData = {
  type: "appointment";
  appointment: SlimAppointment;
  columnId: number;
  dateKey: string;
};

export type TimeSlotDropData = {
  type: "time-slot";
  columnId: number;
  dateKey: string;
  hour: number;
  /** Slot start minute (0, 15, 30, 45 for 15-min grid). Default 0 for hour-only slots. */
  minute?: number;
};

export type StaffColumnDropData = {
  type: "staff-column";
  staffId: number;
  label: string;
};

interface DraggableAppointmentBlockProps {
  appointment: SlimAppointment;
  columnId: number;
  dateKey: string;
  leftPercent?: number;
  widthPercent?: number;
  /** When set, use interval-based grid positioning (from workingHours.getTimePositionForGrid). */
  gridStartMinutes?: number;
  intervalMinutes?: number;
  slotHeight?: number;
  /** Location/business calendar IANA timezone; aligns draggable position with TimeColumn.getPos. */
  timezone?: string;
  colorMap?: Map<string, AppointmentBlockColorPair> | null;
  /** Past booking (or group fully ended): no drag; click still opens detail like Edit slider without Edit. */
  disableDrag?: boolean;
}

export const DraggableAppointmentBlock: FC<DraggableAppointmentBlockProps> = memo(({
  appointment,
  columnId,
  dateKey,
  leftPercent,
  widthPercent,
  gridStartMinutes,
  intervalMinutes,
  slotHeight,
  timezone,
  colorMap,
  disableDrag = false,
}) => {
  const dispatch = useDispatch();
  const dragDisabled = appointment.status === "cancelled" || disableDrag;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `appointment-${columnId}-${appointment.id}`,
    disabled: dragDisabled,
    data: {
      type: "appointment",
      appointment,
      columnId,
      dateKey,
    } satisfies AppointmentDragData,
  });

  const handleClick = useCallback(() => {
    const slim = appointment as SlimAppointment;
    const placeholder: Appointment = {
      id: slim.id,
      customer: null,
      teamMembers: [],
      location: { id: 0, name: '', address: '', description: '', phone: '', email: '' },
      scheduledAt: new Date(slim.scheduledAt),
      endsAt: new Date(slim.endsAt),
      status: slim.status,
      notes: '',
      price: 0,
      cancellationReason: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      bookedItemName: slim.bookedItemName,
      bookingSource: slim.bookingSource,
      overrideReason: slim.overrideReason,
    };
    dispatch(toggleEditFormAction({ open: true, item: placeholder }));
  }, [dispatch, appointment]);

  const pos =
    gridStartMinutes != null && intervalMinutes != null && slotHeight != null
      ? getTimePositionForGrid(
          appointment.scheduledAt,
          appointment.endsAt,
          gridStartMinutes,
          intervalMinutes,
          slotHeight,
          timezone,
        )
      : (() => {
          const start = new Date(appointment.scheduledAt);
          const end = new Date(appointment.endsAt);
          const startMinutes = start.getHours() * 60 + start.getMinutes();
          const endMinutes = end.getHours() * 60 + end.getMinutes();
          const gs = GRID_START_HOUR * 60;
          return {
            top: ((startMinutes - gs) / 60) * HOUR_HEIGHT,
            height: Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 24),
          };
        })();
  const wrapperStyle: React.CSSProperties = {
    position: "absolute",
    top: pos.top,
    height: pos.height,
    transition: isDragging ? "none" : POSITION_TRANSITION,
  };
  if (leftPercent != null && widthPercent != null) {
    wrapperStyle.left = `${leftPercent}%`;
    wrapperStyle.width = `${widthPercent}%`;
  } else {
    wrapperStyle.left = 4;
    wrapperStyle.right = 4;
  }

  if (appointment.status === "cancelled") {
    return (
      <AppointmentBlock
        appointment={appointment}
        top={pos.top}
        height={pos.height}
        leftPercent={leftPercent}
        widthPercent={widthPercent}
        colorMap={colorMap}
      />
    );
  }

  if (disableDrag) {
    return (
      <div ref={setNodeRef} style={wrapperStyle} className="cursor-pointer">
        <AppointmentBlock
          appointment={appointment}
          top={0}
          height={pos.height}
          leftPercent={leftPercent}
          widthPercent={widthPercent}
          onOpenDetail={handleClick}
          colorMap={colorMap}
        />
      </div>
    );
  }

  // Press-in scale mirrors the mobile card: `:active` applies instantly on
  // mouse-down / touch-start and eases up to scale(1.02) over 240ms — close
  // enough to dnd-kit's 8px mouse / 250ms touch activation thresholds that
  // the user feels the press before the drag picks up.
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ ...wrapperStyle, touchAction: "manipulation" }}
      className={`outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0 rounded-xl transition-transform duration-[240ms] ease-out ${isDragging ? "opacity-30 pointer-events-none" : "cursor-grab active:scale-[1.02]"}`}
    >
      <AppointmentBlock
        appointment={appointment}
        top={0}
        height={pos.height}
        leftPercent={leftPercent}
        widthPercent={widthPercent}
        onOpenDetail={handleClick}
        colorMap={colorMap}
      />
    </div>
  );
});
DraggableAppointmentBlock.displayName = "DraggableAppointmentBlock";

interface DroppableSlotProps {
  id: string;
  columnId: number;
  dateKey: string;
  hour: number;
  /** Slot start minute (0, 15, 30, 45 for 15-min grid). Default 0. */
  minute?: number;
  isOutsideHours: boolean;
  slotHeight?: number;
  /** When true, dnd-kit ignores this target (no visual change vs a normal slot). */
  dropDisabled?: boolean;
  /** While a grid drag is active: valid targets get a muted info tint (see `--info` / `bg-info-*`). */
  dndActive?: boolean;
  /** When true, the slot is in the past and cannot be clicked. */
  isPast?: boolean;
  /** When true, this slot is within the dragged appointment's duration range (multi-slot highlight). */
  inDurationRange?: boolean;
  onSlotClick?: (hour: number, minute?: number, columnId?: number) => void;
}

export const DroppableSlot: FC<DroppableSlotProps> = memo(({
  id,
  columnId,
  dateKey,
  hour,
  minute = 0,
  isOutsideHours,
  slotHeight = HOUR_HEIGHT,
  dropDisabled = false,
  dndActive = false,
  isPast = false,
  inDurationRange = false,
  onSlotClick,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "time-slot", columnId, dateKey, hour, minute } satisfies TimeSlotDropData,
    disabled: dropDisabled,
  });
  const isHourBoundary = minute === 0;
  const validDropHighlight = Boolean(dndActive && !dropDisabled);
  const borderClass = minute === 45 ? "" : "border-b border-dashed border-border";

  // Forbidden-slot hover: rendered instead of `interactClass`/`overClass` when
  // the user drags over a slot that can't accept the drop (past, overlapping,
  // out-of-hours, or cross-column on mobile). Carries a denial signal so we
  // don't silently ignore the gesture.
  const forbiddenHover = dropDisabled && dndActive && isOver;

  const interactClass = forbiddenHover
    ? "bg-destructive/12 dark:bg-destructive/18 cursor-not-allowed"
    : isPast
      ? "bg-muted/20 cursor-default"
      : dropDisabled
        ? isOutsideHours
          ? "bg-muted/30 cursor-pointer hover:bg-primary/5"
          : "cursor-pointer hover:bg-primary/5"
        : inDurationRange
          ? "cursor-pointer bg-primary/12 dark:bg-primary/18"
          : validDropHighlight
            ? "cursor-pointer bg-info/10 dark:bg-info/18 hover:bg-info/16 dark:hover:bg-info/24"
            : isOutsideHours
              ? "bg-muted/30 cursor-pointer hover:bg-primary/5"
              : "cursor-pointer hover:bg-primary/5";

  const overClass = forbiddenHover
    ? "ring-2 ring-destructive/40"
    : !dropDisabled && (isOver || inDurationRange)
      ? inDurationRange
        ? "bg-primary/15 dark:bg-primary/22"
        : validDropHighlight
          ? "ring-2 ring-primary/40 bg-info/20 dark:bg-info/28"
          : "ring-2 ring-primary/50 bg-info/12 dark:bg-info/18"
      : "";

  const handleClick = useCallback(() => {
    if (onSlotClick && !isPast) onSlotClick(hour, minute, columnId);
  }, [onSlotClick, isPast, hour, minute, columnId]);

  // Slot transition is only applied when the drag is NOT active — during a
  // drag, hundreds of slots can flip highlight state per second on cheap
  // Android, and a 100ms cross-fade on each stacks concurrent animations +
  // compositor work until the frame budget dies. The red forbidden-hover
  // feedback still reads at 0ms (color just snaps in), which matches native.
  const slotTransitionClass = dndActive
    ? ""
    : "transition-[background-color,box-shadow] duration-100 ease-out";

  return (
    <div
      ref={setNodeRef}
      className={`relative ${slotTransitionClass} ${borderClass} ${interactClass} ${overClass}`}
      style={{
        height: slotHeight,
        ...(isHourBoundary ? { borderTop: '1px solid var(--border)' } : undefined),
      }}
      onClick={onSlotClick && !isPast ? handleClick : undefined}
    />
  );
});
