/**
 * Drag-and-drop helpers for calendar grid: draggable appointment block and droppable slot.
 * Used by CalendarTimeGrid (Day view) for reschedule and staff reassign.
 * Whole card is draggable; DndContext uses delay activation (hold to drag). Single click opens details.
 */
import { type FC, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { SlimAppointment } from "../../../shared/types/calendar.ts";
import { getAppointmentDetailRequest, getAppointmentGroupRequest } from "../api.ts";
import { toggleEditFormAction } from "../actions.ts";
import { AppointmentBlock } from "./AppointmentBlock.tsx";
import type { AppointmentBlockColorPair } from "../colors.ts";
import { getTimePositionForGrid } from "../workingHours.ts";

const HOUR_HEIGHT = 80;
const GRID_START_HOUR = 6;

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

export const DraggableAppointmentBlock: FC<DraggableAppointmentBlockProps> = ({
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

  const handleClick = useCallback(async () => {
    try {
      const bookingGroupId = (appointment as { bookingGroupId?: string }).bookingGroupId;
      if (bookingGroupId) {
        const list = await getAppointmentGroupRequest(bookingGroupId);
        const item = (Array.isArray(list) ? list : []).find((a: { id: number }) => a.id === appointment.id) ?? (Array.isArray(list) ? list[0] : null);
        if (item) {
          dispatch(toggleEditFormAction({ open: true, item, groupAppointments: Array.isArray(list) ? list : [] }));
        }
      } else {
        const fullAppointment = await getAppointmentDetailRequest(appointment.id);
        dispatch(toggleEditFormAction({ open: true, item: fullAppointment }));
      }
    } catch {
      // silently fail — appointment may have been deleted
    }
  }, [dispatch, appointment.id, (appointment as { bookingGroupId?: string }).bookingGroupId]);

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

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ ...wrapperStyle, touchAction: "none" }}
      className={isDragging ? "opacity-50 cursor-grabbing" : "cursor-grab"}
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
};

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
  onSlotClick?: (hour: number, minute?: number) => void;
}

export const DroppableSlot: FC<DroppableSlotProps> = ({
  id,
  columnId,
  dateKey,
  hour,
  minute = 0,
  isOutsideHours,
  slotHeight = HOUR_HEIGHT,
  dropDisabled = false,
  dndActive = false,
  onSlotClick,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "time-slot", columnId, dateKey, hour, minute } satisfies TimeSlotDropData,
    disabled: dropDisabled,
  });
  const isHourBoundary = minute === 0;
  const validDropHighlight = Boolean(dndActive && !dropDisabled);
  const borderClass = isHourBoundary ? "border-b border-border" : "border-b border-dashed border-border/60";

  const interactClass = dropDisabled
    ? isOutsideHours
      ? "bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
      : "cursor-pointer hover:bg-muted/25 transition-colors"
    : validDropHighlight
      ? "cursor-pointer bg-info/10 dark:bg-info/18 transition-colors hover:bg-info/16 dark:hover:bg-info/24"
      : isOutsideHours
        ? "bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        : "cursor-pointer hover:bg-primary/5 transition-colors";

  const overClass =
    !dropDisabled && isOver
      ? validDropHighlight
        ? "ring-2 ring-primary/40 bg-info/20 dark:bg-info/28"
        : "ring-2 ring-primary/50 bg-info/12 dark:bg-info/18"
      : "";

  return (
    <div
      ref={setNodeRef}
      className={`relative ${borderClass} ${interactClass} ${overClass}`}
      style={{ height: slotHeight }}
      onClick={onSlotClick ? () => onSlotClick(hour, minute) : undefined}
    />
  );
};
