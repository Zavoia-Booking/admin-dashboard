import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getDayAppointments,
  getDayBlocks,
  getDayDataLoading,
  getLocationStaff,
  getLocationContext,
  getLocationWorkingHours,
  getLocationOpen247,
  getSelectedDate,
  getWeekData,
  getWeekDataLoading,
  getStaffFilter,
  getSelectedLocationId,
  getUpdateConflictOffer,
  getPendingDrop,
  getWeekViewDisplayStart,
  getOptimisticBlocks,
  blockOverlapsDate,
} from "../selectors.ts";
import { deleteCalendarBlock, setSelectedDateAction, setViewModeAction, toggleAddForm, updateAppointment, setUpdateConflictOffer, setCalendarPendingDrop } from "../actions.ts";
import { AppointmentViewMode } from "../types.ts";
import type {
  SlimAppointment,
  CalendarBlockDto,
  CalendarStaffMember,
  DayDataResponse,
} from "../../../shared/types/calendar.ts";
import { getWeekStart, toLocalDateString } from "../utils.ts";
import { getWorkingHoursForDate, getDayOpenCloseHours, isTimeRangeOutsideWorkingHours } from "../workingHours.ts";
import { AppointmentBlock } from "./AppointmentBlock.tsx";
import { WeekDayStrip } from "./WeekDayStrip.tsx";
import { DraggableAppointmentBlock, DroppableSlot } from "./CalendarDnD.tsx";
import type { AppointmentDragData, TimeSlotDropData, StaffColumnDropData } from "./CalendarDnD.tsx";
import { formatTimeRange, getStaffDisplayNames } from "./utils.tsx";
import { Loader2, Clock, MapPin, User, Trash2, ShieldAlert } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "../../../shared/components/ui/popover.tsx";
import { Button } from "../../../shared/components/ui/button.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../shared/components/ui/alert-dialog.tsx";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useSensors,
  useSensor,
  PointerSensor,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { Label } from "../../../shared/components/ui/label.tsx";
import { Input } from "../../../shared/components/ui/input.tsx";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 80; // px per hour - taller for better visibility
const GRID_START_HOUR = 6; // 6 AM
const GRID_END_HOUR = 22; // 10 PM
const GRID_HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i);
const GUTTER_WIDTH = 60; // px - slightly wider for cleaner look

const formatHourLabel = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
};

/** True if two time ranges overlap (startA < endB && endA > startB). */
function timeRangesOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && endA > startB;
}

/** Calculate top offset and height (px) for a time range on the grid */
const getTimePosition = (isoStart: string, isoEnd: string) => {
  const start = new Date(isoStart);
  const end = new Date(isoEnd);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const gridStartMinutes = GRID_START_HOUR * 60;

  const top = ((startMinutes - gridStartMinutes) / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 24);
  return { top, height };
};

/**
 * Assign lane index and total lanes for overlapping appointments so they can be shown side-by-side.
 * Returns for each appointment { laneIndex, totalLanes } (0-based lane, 1-based total).
 */
function getOverlapLanes(
  appointments: SlimAppointment[],
): Map<number, { laneIndex: number; totalLanes: number }> {
  const result = new Map<number, { laneIndex: number; totalLanes: number }>();
  if (appointments.length === 0) return result;

  const positions = appointments.map((a) => getTimePosition(a.scheduledAt, a.endsAt));
  const indexed = appointments
    .map((appt, i) => ({ id: appt.id, top: positions[i].top, bottom: positions[i].top + positions[i].height }))
    .sort((a, b) => a.top - b.top || a.bottom - b.bottom);

  const laneEnds: number[] = [];

  for (const { id, top, bottom } of indexed) {
    let lane = 0;
    while (lane < laneEnds.length && laneEnds[lane] > top) lane++;
    if (lane === laneEnds.length) laneEnds.push(bottom);
    else laneEnds[lane] = bottom;
    result.set(id, { laneIndex: lane, totalLanes: 0 }); // totalLanes filled below
  }

  const totalLanes = laneEnds.length;
  result.forEach((v) => { v.totalLanes = totalLanes; });
  return result;
}

const getBlockReasonLabel = (reason: string): string => {
  switch (reason) {
    case 'holiday': return 'Holiday';
    case 'vacation': return 'Vacation';
    case 'sick': return 'Sick';
    case 'lunch_break': return 'Lunch Break';
    case 'break': return 'Break';
    case 'meeting': return 'Meeting';
    case 'personal': return 'Personal';
    case 'maintenance': return 'Maintenance';
    case 'other': return 'Other';
    default: return reason;
  }
};

const getBlockScopeLabel = (scope: string): string => {
  switch (scope) {
    case 'location': return 'Location Block';
    case 'staff': return 'Staff Time Off';
    case 'business': return 'Business Block';
    default: return scope;
  }
};

// ─────────────────────────────────────────────────────────────
// Block Detail Popover
// ─────────────────────────────────────────────────────────────

interface BlockDetailPopoverProps {
  block: CalendarBlockDto;
  staffName: string | null;
  children: React.ReactNode;
}

const BlockDetailPopover: FC<BlockDetailPopoverProps> = ({ block, staffName, children }) => {
  const dispatch = useDispatch();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleRequestDeleteBlock = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleDelete = useCallback(() => {
    dispatch(deleteCalendarBlock.request(block.id));
    setShowDeleteConfirm(false);
    setPopoverOpen(false);
  }, [dispatch, block.id]);

  const timeDisplay = block.isAllDay
    ? 'All day'
    : formatTimeRange(block.startsAt, block.endsAt);

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-64 p-0">
          <div className="px-3 py-2.5 border-b border-border bg-red-50/50 dark:bg-red-900/20 rounded-t-md">
            <div className="font-medium text-sm text-foreground">
              {block.title || getBlockReasonLabel(block.reason)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {getBlockScopeLabel(block.blockScope)}
            </div>
          </div>
          <div className="px-3 py-2.5 space-y-2">
            <div className="flex items-center gap-2 text-xs text-foreground">
              <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span>{timeDisplay}</span>
            </div>
            {block.title && (
              <div className="flex items-center gap-2 text-xs text-foreground">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span>{getBlockReasonLabel(block.reason)}</span>
              </div>
            )}
            {block.blockScope === 'staff' && staffName && (
              <div className="flex items-center gap-2 text-xs text-foreground">
                <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span>{staffName}</span>
              </div>
            )}
          </div>
          <div className="px-3 py-2 border-t border-border">
            <Button
              variant="destructive"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={handleRequestDeleteBlock}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete Block
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete block?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the {getBlockScopeLabel(block.blockScope).toLowerCase()}
              {block.title ? ` "${block.title}"` : ''}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Time Column — shared column renderer for both Day and Week views
// ─────────────────────────────────────────────────────────────

interface TimeColumnProps {
  appointments: SlimAppointment[];
  blocks: CalendarBlockDto[];
  locationStaff: CalendarStaffMember[];
  openHour: number;
  closeHour: number;
  open247: boolean;
  isToday: boolean;
  onSlotClick?: (hour: number) => void;
  /** When set, slots and appointments are droppable/draggable for DnD reschedule and reassign */
  enableDnd?: boolean;
  columnId?: number;
  dateKey?: string;
}

const TimeColumn: FC<TimeColumnProps> = ({
  appointments,
  blocks,
  locationStaff,
  openHour,
  closeHour,
  open247,
  isToday,
  onSlotClick,
  enableDnd = false,
  columnId = 0,
  dateKey = "",
}) => {
  const gridHeight = GRID_HOURS.length * HOUR_HEIGHT;

  return (
    <div className="relative" style={{ height: gridHeight }}>
      {/* Hour grid lines + working hours shading (droppable when DnD enabled) */}
      {GRID_HOURS.map(hour => {
        const isOutsideHours = !open247 && (hour < openHour || hour >= closeHour);
        if (enableDnd && dateKey) {
          const slotId = `slot-${columnId}-${dateKey}-${hour}`;
          return (
            <DroppableSlot
              key={hour}
              id={slotId}
              columnId={columnId}
              dateKey={dateKey}
              hour={hour}
              isOutsideHours={isOutsideHours}
              onSlotClick={onSlotClick}
            />
          );
        }
        return (
          <div
            key={hour}
            className={`border-b border-dashed border-border ${isOutsideHours
                ? "bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                : "cursor-pointer hover:bg-primary/5 transition-colors"
              }`}
            style={{ height: HOUR_HEIGHT }}
            onClick={onSlotClick ? () => onSlotClick(hour) : undefined}
          />
        );
      })}

      {/* Current time indicator (only on today's column) */}
      {isToday && (
        <div
          className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
          style={{ top: ((new Date().getHours() * 60 + new Date().getMinutes()) - (GRID_START_HOUR * 60)) / 60 * HOUR_HEIGHT }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 ring-2 ring-white dark:ring-neutral-900" />
          <div className="flex-1 h-[2px] bg-red-500" />
        </div>
      )}

      {/* Block overlays */}
      {blocks.map(block => {
        const staffName = block.blockScope === 'staff' && block.userId
          ? getStaffDisplayNames([block.userId], locationStaff)
          : null;

        if (block.isAllDay) {
          return (
            <BlockDetailPopover key={`block-${block.id}`} block={block} staffName={staffName}>
              <div
                className="absolute inset-x-0 bg-gray-100/80 dark:bg-gray-800/50 border-l-2 border-gray-300 dark:border-gray-600 z-[5] cursor-pointer hover:bg-gray-200/80 dark:hover:bg-gray-800/70 transition-colors"
                style={{ top: 0, height: gridHeight }}
                title={block.title || block.reason}
              />
            </BlockDetailPopover>
          );
        }
        const pos = getTimePosition(block.startsAt, block.endsAt);
        return (
          <BlockDetailPopover key={`block-${block.id}`} block={block} staffName={staffName}>
            <div
              className="absolute inset-x-1 bg-gray-100/80 dark:bg-gray-800/50 border-l-2 border-gray-300 dark:border-gray-600 rounded-sm z-[5] cursor-pointer hover:bg-gray-200/80 dark:hover:bg-gray-800/70 transition-colors"
              style={{ top: pos.top, height: pos.height }}
              title={block.title || getBlockReasonLabel(block.reason)}
            >
              <span className="text-[10px] text-gray-600 dark:text-gray-400 px-1 truncate block">
                {block.title || getBlockReasonLabel(block.reason)}
              </span>
            </div>
          </BlockDetailPopover>
        );
      })}

      {/* Appointment blocks — overlapping ones laid out side-by-side; draggable when DnD enabled */}
      {(() => {
        const overlapLanes = getOverlapLanes(appointments);
        return appointments.map(appt => {
          const pos = getTimePosition(appt.scheduledAt, appt.endsAt);
          const lanes = overlapLanes.get(appt.id);
          const totalLanes = lanes?.totalLanes ?? 1;
          const laneIndex = lanes?.laneIndex ?? 0;
          const leftPercent = totalLanes > 1 ? laneIndex * (100 / totalLanes) + 0.5 : 0;
          const widthPercent = totalLanes > 1 ? 100 / totalLanes - 1 : 100;
          if (enableDnd && dateKey) {
            return (
              <DraggableAppointmentBlock
                key={`appt-${appt.id}`}
                appointment={appt}
                columnId={columnId}
                dateKey={dateKey}
                leftPercent={totalLanes > 1 ? leftPercent : undefined}
                widthPercent={totalLanes > 1 ? widthPercent : undefined}
              />
            );
          }
          return (
            <AppointmentBlock
              key={`appt-${appt.id}`}
              appointment={appt}
              top={pos.top}
              height={pos.height}
              leftPercent={totalLanes > 1 ? leftPercent : undefined}
              widthPercent={totalLanes > 1 ? widthPercent : undefined}
            />
          );
        });
      })()}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Droppable column wrapper (for staff reassign drop target)
// ─────────────────────────────────────────────────────────────

const DroppableColumn: FC<{
  id: string;
  staffId: number;
  label: string;
  isOver?: boolean;
  children: React.ReactNode;
}> = ({ id, staffId, label, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "staff-column", staffId, label } satisfies StaffColumnDropData,
  });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[140px] border-l border-border transition-colors ${isOver ? "bg-primary/10 ring-1 ring-primary/30" : ""}`}
    >
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// CalendarTimeGrid — main export
// ─────────────────────────────────────────────────────────────

interface CalendarTimeGridProps {
  viewMode: AppointmentViewMode;
}

export const CalendarTimeGrid: FC<CalendarTimeGridProps> = ({ viewMode }) => {
  const selectedLocationId = useSelector(getSelectedLocationId);

  if (!selectedLocationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Select a location to view the calendar.</p>
      </div>
    );
  }

  if (viewMode === AppointmentViewMode.DAY) {
    return <DayGrid />;
  }

  return <WeekGrid />;
};

// ─────────────────────────────────────────────────────────────
// Day Grid — staff columns + unassigned lane
// ─────────────────────────────────────────────────────────────

const DayGrid: FC = () => {
  const dispatch = useDispatch();
  const selectedDate = useSelector(getSelectedDate);
  const dayAppointments = useSelector(getDayAppointments);
  const dayBlocks = useSelector(getDayBlocks);
  const isLoading = useSelector(getDayDataLoading);
  const locationStaff = useSelector(getLocationStaff);
  const locationContext = useSelector(getLocationContext);
  const workingHours = useSelector(getLocationWorkingHours);
  const open247 = useSelector(getLocationOpen247);
  const staffFilter = useSelector(getStaffFilter);
  const updateConflictOffer = useSelector(getUpdateConflictOffer);
  const pendingDrop = useSelector(getPendingDrop);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropConfirmInProgress, setDropConfirmInProgress] = useState(false);
  const [confirmModalDelayedOpen, setConfirmModalDelayedOpen] = useState(false);
  const [overrideReasonText, setOverrideReasonText] = useState("");
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [pendingReschedulePayload, setPendingReschedulePayload] = useState<{
    appointmentId: number;
    newScheduledAt: Date;
    newEndsAt: Date;
    staffUserIds?: number[];
  } | null>(null);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
  );

  const dayWorkingHours = getWorkingHoursForDate(selectedDate, workingHours, open247);
  const isOpen = open247 || (dayWorkingHours?.isOpen ?? false);
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const { openHour, closeHour } = getDayOpenCloseHours(dayWorkingHours, open247, GRID_START_HOUR, GRID_END_HOUR);
  const dateKey = toLocalDateString(selectedDate);

  // When pendingDrop is cleared (after refresh), hide confirm-in-progress so modal doesn't reappear
  useEffect(() => {
    if (!pendingDrop) setDropConfirmInProgress(false);
  }, [pendingDrop]);

  // Staff double-book conflict: do not allow override; clear pending drop and offer so card snaps back
  useEffect(() => {
    if (updateConflictOffer?.conflictType === 'staff_appointment') {
      dispatch(setCalendarPendingDrop(null));
      dispatch(setUpdateConflictOffer(null));
    }
  }, [updateConflictOffer?.conflictType, dispatch, updateConflictOffer]);

  // Short delay before showing confirm modal so the card can finish animating to its dropped position
  const CONFIRM_MODAL_DELAY_MS = 320;
  useEffect(() => {
    if (!pendingDrop || dropConfirmInProgress) {
      setConfirmModalDelayedOpen(false);
      return;
    }
    const t = setTimeout(() => setConfirmModalDelayedOpen(true), CONFIRM_MODAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [pendingDrop, dropConfirmInProgress]);

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

    // Apply staff filter
    const visibleStaffCols = staffFilter.length > 0
      ? staffCols.filter(col => staffFilter.includes(col.id))
      : staffCols;

    // When specific staff are selected, show only those staff columns.
    // "Unassigned" is shown only in "All Staff" mode.
    if (staffFilter.length > 0) {
      return visibleStaffCols;
    }

    return [...visibleStaffCols, { id: 0, label: 'Unassigned', isUnassigned: true }];
  }, [locationStaff, staffFilter, locationContext]);

  // Group appointments by column
  const appointmentsByColumn = useMemo(() => {
    const map = new Map<number, SlimAppointment[]>();
    columns.forEach(col => map.set(col.id, []));

    for (const appt of dayAppointments) {
      if (appt.isUnassigned || appt.staffUserIds.length === 0) {
        if (map.has(0)) {
          map.get(0)?.push(appt);
        }
      } else {
        for (const staffId of appt.staffUserIds) {
          if (map.has(staffId)) {
            map.get(staffId)!.push(appt);
          }
        }
      }
    }
    return map;
  }, [dayAppointments, columns]);

  // When a drop is pending, show the appointment in the target column at the drop position until confirm/cancel
  const appointmentsByColumnWithPreview = useMemo(() => {
    const map = new Map<number, SlimAppointment[]>();
    columns.forEach(col => {
      const list = appointmentsByColumn.get(col.id) ?? [];
      map.set(col.id, [...list]);
    });

    const pd = pendingDrop;
    if (!pd) return map;

    const appointment = pd.appointment;
    const appointmentId = appointment.id;
    const sourceCol = appointment.staffUserIds.length === 0 ? 0 : appointment.staffUserIds[0];
    const targetCol = pd.type === "reassign" ? pd.staffId : pd.columnId;

    const removeFrom = (colId: number) => {
      const list = map.get(colId);
      if (list) map.set(colId, list.filter((a) => a.id !== appointmentId));
    };
    const addTo = (colId: number, appt: SlimAppointment) => {
      const list = map.get(colId) ?? [];
      map.set(colId, [...list, appt]);
    };

    removeFrom(sourceCol);
    if (pd.type === "reschedule") {
      const [y, m, d] = pd.dateKey.split("-").map(Number);
      const previewStartsAt = new Date(y, m - 1, d, pd.hour, 0, 0, 0);
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
  }, [appointmentsByColumn, columns, pendingDrop]);

  // Group blocks by column
  const blocksByColumn = useMemo(() => {
    const map = new Map<number, CalendarBlockDto[]>();
    columns.forEach(col => map.set(col.id, []));

    for (const block of dayBlocks) {
      if (block.blockScope === 'staff' && block.userId) {
        if (map.has(block.userId)) {
          map.get(block.userId)!.push(block);
        }
      } else {
        columns.forEach(col => map.get(col.id)?.push(block));
      }
    }
    return map;
  }, [dayBlocks, columns]);

  const activeAppointment = useMemo(() => {
    if (!activeId || String(activeId).startsWith("appointment-") === false) return null;
    const id = parseInt(String(activeId).replace("appointment-", ""), 10);
    return dayAppointments.find((a) => a.id === id) ?? null;
  }, [activeId, dayAppointments]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const data = event.active.data?.current as AppointmentDragData | null;
    const overData = event.over?.data?.current as TimeSlotDropData | StaffColumnDropData | null;
    if (!data || data.type !== "appointment" || !overData) return;
    const appointment = data.appointment;
    if (appointment.status === "cancelled") return;

    const staffConflictMessage = "This team member already has an appointment at this time. Choose another time or team member.";

    if (overData.type === "time-slot") {
      const { columnId, dateKey, hour } = overData;
      if (columnId !== 0) {
        const columnApps = (appointmentsByColumn.get(columnId) ?? []).filter((a) => a.id !== appointment.id);
        const [y, m, d] = dateKey.split("-").map(Number);
        const slotStart = new Date(y, m - 1, d, hour, 0, 0, 0).getTime();
        const slotEnd = slotStart + appointment.duration * 60 * 1000;
        const hasConflict = columnApps.some((other) => {
          const otherStart = new Date(other.scheduledAt).getTime();
          const otherEnd = new Date(other.endsAt).getTime();
          return timeRangesOverlap(slotStart, slotEnd, otherStart, otherEnd);
        });
        if (hasConflict) {
          toast.error(staffConflictMessage);
          return;
        }
      }
      dispatch(setCalendarPendingDrop({
        type: "reschedule",
        appointment,
        dateKey: overData.dateKey,
        hour: overData.hour,
        columnId: overData.columnId,
      }));
    } else if (overData.type === "staff-column") {
      const { staffId } = overData;
      if (staffId !== 0) {
        const columnApps = (appointmentsByColumn.get(staffId) ?? []).filter((a) => a.id !== appointment.id);
        const apptStart = new Date(appointment.scheduledAt).getTime();
        const apptEnd = new Date(appointment.endsAt).getTime();
        const hasConflict = columnApps.some((other) => {
          const otherStart = new Date(other.scheduledAt).getTime();
          const otherEnd = new Date(other.endsAt).getTime();
          return timeRangesOverlap(apptStart, apptEnd, otherStart, otherEnd);
        });
        if (hasConflict) {
          toast.error(staffConflictMessage);
          return;
        }
      }
      dispatch(setCalendarPendingDrop({
        type: "reassign",
        appointment,
        staffId: overData.staffId,
        staffLabel: overData.label,
      }));
    }
  }, [dispatch, appointmentsByColumn]);

  const handleConfirmDrop = useCallback(() => {
    if (!pendingDrop) return;
    setDropConfirmInProgress(true);
    const toConfirm = pendingDrop;
    if (toConfirm.type === "reassign") {
      const staffUserIds = toConfirm.staffId === 0 ? [] : [toConfirm.staffId];
      dispatch(
        updateAppointment.request({
          appointmentId: toConfirm.appointment.id,
          data: { staffUserIds },
        }),
      );
      return;
    }
    const { appointment, dateKey: dKey, hour, columnId: targetColumnId } = toConfirm;
    const [y, m, d] = dKey.split("-").map(Number);
    const newScheduledAt = new Date(y, m - 1, d, hour, 0, 0, 0);
    const newEndsAt = new Date(newScheduledAt.getTime() + appointment.duration * 60 * 1000);
    const isOutOfHours = !open247 && dayWorkingHours && isTimeRangeOutsideWorkingHours(newScheduledAt, appointment.duration, dayWorkingHours, open247);
    const sourceColumnId = appointment.staffUserIds.length === 0 ? 0 : appointment.staffUserIds[0];
    const changingColumn = sourceColumnId !== targetColumnId;
    const payload: { scheduledAt?: string; staffUserIds?: number[] } = {};
    if (changingColumn) {
      payload.staffUserIds = targetColumnId === 0 ? [] : [targetColumnId];
    }
    if (isOutOfHours) {
      setPendingReschedulePayload({
        appointmentId: appointment.id,
        newScheduledAt,
        newEndsAt,
        staffUserIds: payload.staffUserIds,
      });
      setOverrideDialogOpen(true);
      return;
    }
    payload.scheduledAt = newScheduledAt.toISOString();
    dispatch(
      updateAppointment.request({
        appointmentId: appointment.id,
        data: payload,
      }),
    );
  }, [pendingDrop, dispatch, open247, dayWorkingHours]);

  const handleConfirmOverride = useCallback(() => {
    if (!pendingReschedulePayload) return;
    const reason = overrideReasonText.trim() || undefined;
    const data: {
      scheduledAt: string;
      allowOutOfHours: boolean;
      overrideConflicts: boolean;
      overrideReason?: string;
      staffUserIds?: number[];
    } = {
      scheduledAt: pendingReschedulePayload.newScheduledAt.toISOString(),
      allowOutOfHours: true,
      overrideConflicts: true,
      overrideReason: reason,
    };
    if (pendingReschedulePayload.staffUserIds !== undefined) {
      data.staffUserIds = pendingReschedulePayload.staffUserIds;
    }
    dispatch(
      updateAppointment.request({
        appointmentId: pendingReschedulePayload.appointmentId,
        data,
      }),
    );
    setPendingReschedulePayload(null);
    setOverrideDialogOpen(false);
    setOverrideReasonText("");
  }, [pendingReschedulePayload, overrideReasonText, dispatch]);

  const handleCancelDrop = useCallback(() => {
    dispatch(setCalendarPendingDrop(null));
    setPendingReschedulePayload(null);
    setOverrideDialogOpen(false);
    setOverrideReasonText("");
  }, [dispatch]);

  const handleConfirmConflictOverride = useCallback(() => {
    if (!updateConflictOffer) return;
    const reason = overrideReasonText.trim() || undefined;
    dispatch(
      updateAppointment.request({
        appointmentId: updateConflictOffer.appointmentId,
        data: {
          ...updateConflictOffer.data,
          overrideConflicts: true,
          overrideReason: reason,
        },
      }),
    );
    dispatch(setUpdateConflictOffer(null));
    setOverrideReasonText("");
  }, [updateConflictOffer, overrideReasonText, dispatch]);

  const handleCancelConflictOverride = useCallback(() => {
    dispatch(setUpdateConflictOffer(null));
    setOverrideReasonText("");
  }, [dispatch]);

  // Don't show full-page loading when refreshing after a drop confirm (card stays in place)
  if (isLoading && !pendingDrop) {
    return (
      <div className="flex items-center justify-center h-64 gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading day view...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Closed day indicator */}
      {!isOpen && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-border">
          <ShieldAlert className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400 font-medium">Location is closed this day</span>
        </div>
      )}

      <DndContext
        sensors={dndSensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Scrollable grid */}
        <div className="overflow-x-auto">
          <div className="flex" style={{ minWidth: columns.length * 140 + GUTTER_WIDTH }}>
            {/* Time gutter */}
            <div className="flex flex-col items-end pr-2 select-none flex-shrink-0" style={{ width: GUTTER_WIDTH }}>
              <div className="h-8 flex-shrink-0" />
              {GRID_HOURS.map(hour => (
                <div key={hour} className="text-[11px] text-muted-foreground flex items-start justify-end" style={{ height: HOUR_HEIGHT }}>
                  {formatHourLabel(hour)}
                </div>
              ))}
            </div>

            {/* Staff columns (droppable for reassign) */}
            {columns.map(col => (
              <DroppableColumn
                key={col.id}
                id={`column-${col.id}`}
                staffId={col.id}
                label={col.label}
              >
                <div className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground border-b border-border truncate px-1">
                  {col.label}
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
                  onSlotClick={(hour) => {
                    const hh = String(hour).padStart(2, "0");
                    dispatch(
                      toggleAddForm({
                        open: true,
                        prefill: {
                          date: selectedDate,
                          time: `${hh}:00`,
                          staffUserId: col.isUnassigned ? undefined : col.id,
                        },
                      }),
                    );
                  }}
                />
              </DroppableColumn>
            ))}
          </div>
        </div>

        {createPortal(
          <DragOverlay modifiers={[snapCenterToCursor]}>
            {activeAppointment ? (
              <div className="rounded-xl px-3 py-2 shadow-lg border border-border bg-card cursor-grabbing">
                <div className="font-bold text-xs truncate">{activeAppointment.bookedItemName}</div>
                <div className="text-[10px] opacity-90 truncate mt-1">
                  {formatTimeRange(activeAppointment.scheduledAt, activeAppointment.endsAt)}
                </div>
              </div>
            ) : null}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>

      {/* Confirmation: Move or Assign — hide immediately on confirm so it doesn't flash after refresh */}
      <AlertDialog open={!!pendingDrop && !overrideDialogOpen && !dropConfirmInProgress && confirmModalDelayedOpen} onOpenChange={(open) => !open && handleCancelDrop()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDrop?.type === "reschedule" && (() => {
                const sourceCol = pendingDrop.appointment.staffUserIds.length === 0 ? 0 : pendingDrop.appointment.staffUserIds[0];
                const changingColumn = sourceCol !== pendingDrop.columnId;
                const staffLabel = columns.find(c => c.id === pendingDrop.columnId)?.label;
                if (changingColumn && pendingDrop.columnId === 0) {
                  return <>Unassign &quot;{pendingDrop.appointment.bookedItemName}&quot; and move to {pendingDrop.dateKey} at {pendingDrop.hour}:00?</>;
                }
                if (changingColumn && staffLabel) {
                  return <>Assign &quot;{pendingDrop.appointment.bookedItemName}&quot; to {staffLabel} and move to {pendingDrop.dateKey} at {pendingDrop.hour}:00?</>;
                }
                return <>Move &quot;{pendingDrop.appointment.bookedItemName}&quot; to {pendingDrop.dateKey} at {pendingDrop.hour}:00?</>;
              })()}
              {pendingDrop?.type === "reassign" && (
                <>Assign this appointment to {pendingDrop.staffLabel}?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDrop}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDrop();
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single "Reschedule anyway" dialog: out-of-hours (client) or 409 block conflict (server). Not shown for staff_appointment — that conflict cannot be overridden. */}
      <AlertDialog
        open={overrideDialogOpen || (!!updateConflictOffer && updateConflictOffer.conflictType !== 'staff_appointment')}
        onOpenChange={(open) => {
          if (!open) {
            if (updateConflictOffer) handleCancelConflictOverride();
            else handleCancelDrop();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {updateConflictOffer ? "Confirm reschedule" : "Outside business hours"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {updateConflictOffer
                ? "This time has a scheduling conflict. Do you want to reschedule anyway? You can add an optional reason below."
                : "This time is outside business hours. Are you sure you want to reschedule? You can add an optional reason below."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="dnd-override-reason" className="text-xs text-muted-foreground">Reason (optional)</Label>
            <Input
              id="dnd-override-reason"
              placeholder="e.g. Customer request"
              value={overrideReasonText}
              onChange={(e) => setOverrideReasonText(e.target.value)}
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={updateConflictOffer ? handleCancelConflictOverride : handleCancelDrop}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (updateConflictOffer) handleConfirmConflictOverride();
                else handleConfirmOverride();
              }}
            >
              Reschedule anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Week Grid — 7 day columns
// ─────────────────────────────────────────────────────────────

const WeekGrid: FC = () => {
  const dispatch = useDispatch();
  const selectedDate = useSelector(getSelectedDate);
  const weekDisplayStart = useSelector(getWeekViewDisplayStart);
  const weekData = useSelector(getWeekData);
  const isLoading = useSelector(getWeekDataLoading);
  const locationStaff = useSelector(getLocationStaff);
  const workingHours = useSelector(getLocationWorkingHours);
  const open247 = useSelector(getLocationOpen247);
  const staffFilter = useSelector(getStaffFilter);
  const optimisticBlocks = useSelector(getOptimisticBlocks);

  const todayStr = new Date().toDateString();

  // Build 7 days for the displayed week (prev/next don't change selectedDate)
  const weekDays = useMemo(() => {
    const ws = weekDisplayStart ?? getWeekStart(selectedDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws);
      d.setDate(ws.getDate() + i);
      return d;
    });
  }, [weekDisplayStart, selectedDate]);

  // Parse working hours for each day (shared util)
  const dayWorkingHours = useMemo(() => {
    return weekDays.map(day => {
      const dayHours = getWorkingHoursForDate(day, workingHours, open247);
      const isOpen = open247 || (dayHours?.isOpen ?? false);
      const { openHour, closeHour } = getDayOpenCloseHours(dayHours, open247, GRID_START_HOUR, GRID_END_HOUR);
      return { isOpen, openHour, closeHour };
    });
  }, [weekDays, workingHours, open247]);

  // Get appointments and blocks for each day, filtered by staff (blocks include optimistic)
  const columnData = useMemo(() => {
    return weekDays.map(day => {
      const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      const dayData: DayDataResponse | undefined = weekData?.[dateKey];

      let appointments = dayData?.appointments ?? [];
      const serverBlocks = dayData?.blocks ?? [];
      const forDay = optimisticBlocks.filter((b) => blockOverlapsDate(b, dateKey));
      const blocks = [...serverBlocks, ...forDay];

      // Apply staff filter
      if (staffFilter.length > 0) {
        appointments = appointments.filter(appt => {
          if (appt.isUnassigned || appt.staffUserIds.length === 0) return false;
          return appt.staffUserIds.some(id => staffFilter.includes(id));
        });
      }

      return { appointments, blocks };
    });
  }, [weekDays, weekData, staffFilter, optimisticBlocks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading week view...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Week day strip (date headers) */}
      <WeekDayStrip gutterWidth={GUTTER_WIDTH} />

      {/* Scrollable grid */}
      <div className="overflow-x-auto">
        <div className="flex" style={{ minWidth: 7 * 100 + GUTTER_WIDTH }}>
          {/* Time gutter */}
          <div className="flex flex-col items-end pr-4 select-none flex-shrink-0" style={{ width: GUTTER_WIDTH }}>
            {/* Spacer for top padding of grid to align with cards? No, grid starts immediately. */}
            {GRID_HOURS.map(hour => (
              <div key={hour} className="text-xs font-medium text-muted-foreground flex items-start justify-end" style={{ height: HOUR_HEIGHT }}>
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, i) => {
            const { appointments, blocks } = columnData[i];
            const { openHour, closeHour } = dayWorkingHours[i];
            const isToday = day.toDateString() === todayStr;

            return (
              <div
                key={day.toDateString()}
                className="flex-1 min-w-[100px] cursor-pointer"
                onDoubleClick={() => {
                  dispatch(setSelectedDateAction(day));
                  dispatch(setViewModeAction(AppointmentViewMode.DAY));
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
    </div>
  );
};
