/**
 * Drag-and-drop helpers for calendar grid: draggable appointment block and droppable slot.
 * Used by CalendarTimeGrid (Day view) for reschedule and staff reassign.
 * Whole card is draggable; DndContext uses delay activation (hold to drag). Single click opens details.
 */
import { type FC, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { SlimAppointment } from "../../../shared/types/calendar.ts";
import { getAppointmentDetailRequest } from "../api.ts";
import { toggleEditFormAction } from "../actions.ts";
import { AppointmentBlock } from "./AppointmentBlock.tsx";

const HOUR_HEIGHT = 80;
const GRID_START_HOUR = 6;

function getTimePosition(isoStart: string, isoEnd: string): { top: number; height: number } {
  const start = new Date(isoStart);
  const end = new Date(isoEnd);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const gridStartMinutes = GRID_START_HOUR * 60;
  const top = ((startMinutes - gridStartMinutes) / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 24);
  return { top, height };
}

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
}

export const DraggableAppointmentBlock: FC<DraggableAppointmentBlockProps> = ({
  appointment,
  columnId,
  dateKey,
  leftPercent,
  widthPercent,
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
      const fullAppointment = await getAppointmentDetailRequest(appointment.id);
      dispatch(toggleEditFormAction({ open: true, item: fullAppointment }));
    } catch {
      // silently fail — appointment may have been deleted
    }
  }, [dispatch, appointment.id]);

  const pos = getTimePosition(appointment.scheduledAt, appointment.endsAt);
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
      onClick={handleClick}
      style={{ ...wrapperStyle, touchAction: "none" }}
      className={isDragging ? "opacity-50 cursor-grabbing" : "cursor-grab"}
    >
      <AppointmentBlock
        appointment={appointment}
        top={0}
        height={pos.height}
        leftPercent={leftPercent}
        widthPercent={widthPercent}
      />
    </div>
  );
};

interface DroppableSlotProps {
  id: string;
  columnId: number;
  dateKey: string;
  hour: number;
  isOutsideHours: boolean;
  onSlotClick?: (hour: number) => void;
}

export const DroppableSlot: FC<DroppableSlotProps> = ({
  id,
  columnId,
  dateKey,
  hour,
  isOutsideHours,
  onSlotClick,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "time-slot", columnId, dateKey, hour } satisfies TimeSlotDropData,
  });
  return (
    <div
      ref={setNodeRef}
      className={`border-b border-dashed border-border ${isOver ? "ring-2 ring-primary/50 bg-primary/10" : ""} ${
        isOutsideHours
          ? "bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
          : "cursor-pointer hover:bg-primary/5 transition-colors"
      }`}
      style={{ height: HOUR_HEIGHT }}
      onClick={onSlotClick ? () => onSlotClick(hour) : undefined}
    />
  );
};
