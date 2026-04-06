import type { FC } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { StaffColumnDropData } from "../CalendarDnD.tsx";

interface DroppableColumnProps {
  id: string;
  staffId: number;
  label: string;
  isOver?: boolean;
  children: React.ReactNode;
  dropDisabled?: boolean;
  dndActive?: boolean;
  /**
   * When true, valid-target tint comes only from per-slot droppables (TimeColumn); the column wrapper
   * does not add a second info background (avoids double tint + header tint). Column hover still shows a ring.
   */
  slotBasedDragHighlight?: boolean;
  /** Override minimum column width (px). Defaults to 140. */
  minWidth?: number;
}

export const DroppableColumn: FC<DroppableColumnProps> = ({ id, staffId, label, children, dropDisabled = false, dndActive = false, slotBasedDragHighlight = false, minWidth = 140 }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "staff-column", staffId, label } satisfies StaffColumnDropData,
    disabled: dropDisabled,
  });
  const validDropHighlight = Boolean(dndActive && !dropDisabled);
  const dragTintClass =
    validDropHighlight && slotBasedDragHighlight
      ? isOver
        ? "ring-1 ring-inset ring-primary/40"
        : ""
      : validDropHighlight
        ? isOver
          ? "bg-info/18 dark:bg-info/26 ring-1 ring-inset ring-primary/40"
          : "bg-info/10 dark:bg-info/16"
        : "";
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-1 flex-col border-l border-border transition-colors ${dragTintClass}`}
      style={{ minWidth }}
    >
      {children}
    </div>
  );
};
