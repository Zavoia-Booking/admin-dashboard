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
}) => {
  const dispatch = useDispatch();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `appointment-${appointment.id}`,
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
          slotHeight
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
      />
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
  onSlotClick,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "time-slot", columnId, dateKey, hour, minute } satisfies TimeSlotDropData,
  });
  const isHourBoundary = minute === 0;
  return (
    <div
      ref={setNodeRef}
      className={`${isHourBoundary ? "border-b border-border" : "border-b border-dashed border-border/60"} ${isOver ? "ring-2 ring-primary/50 bg-primary/10" : ""} ${
        isOutsideHours
          ? "bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
          : "cursor-pointer hover:bg-primary/5 transition-colors"
      }`}
      style={{ height: slotHeight }}
      onClick={onSlotClick ? () => onSlotClick(hour, minute) : undefined}
    />
  );
};
