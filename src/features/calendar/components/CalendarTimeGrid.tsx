import { type FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
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
  getWeekData,
  getWeekDataLoading,
  getEffectiveStaffFilterIds,
  getHasActiveCalendarFilters,
  getSelectedLocationId,
  getUpdateConflictOffer,
  getPendingDrop,
  getWeekViewDisplayStart,
  getOptimisticBlocks,
  blockOverlapsDate,
  getBookingSettings,
  getCalendarTimezone,
  appointmentsToDisplayBlocks,
  getLocationServices,
  getLocationBundles,
} from "../selectors.ts";
import { selectIsTeamMember, selectCurrentUserId } from "../../auth/selectors";
import { deleteCalendarBlock, setBlockFormEditingAction, toggleAddForm, toggleBlockFormAction, updateAppointment, rescheduleAppointmentGroup, setUpdateConflictOffer, setCalendarPendingDrop, setDayFiltersAction, setStaffFilter } from "../actions.ts";
import { dispatchSelectDateAndDayView } from "../selectDateAndDayViewDispatch.ts";
import { AppointmentViewMode } from "../types.ts";
import type {
  SlimAppointment,
  CalendarDisplayBlock,
  CalendarBlockDto,
  CalendarStaffMember,
  DayDataResponse,
} from "../../../shared/types/calendar.ts";
import { getWeekStart } from "../utils.ts";
import {
  getWorkingHoursForDate,
  getDayOpenCloseHours,
  getDayOpenCloseMinutes,
  getSlotStartsInRange,
  getTimePositionForGrid,
  isTimeRangeOutsideWorkingHours,
} from "../workingHours.ts";
import { getMinutesInTimezone, formatDateInTimezone, buildZonedDateFromDateKey } from "../timezone.ts";
import { isSlimAppointmentSchedulingLocked } from "../calendarScheduling.ts";
import {
  timeRangesOverlap,
  countSegmentsSameBookingGroup,
  isMultiSegmentGroupDrag,
  evaluateDayTimeSlotDrop,
  evaluateDayStaffColumnDrop,
  evaluateWeekTimeSlotDrop,
  isDayTimeSlotForbiddenForPreview,
  isDayStaffColumnDropDisabled,
  isWeekTimeSlotForbiddenForPreview,
} from "../dndDropEligibility.ts";
import { AppointmentBlock } from "./AppointmentBlock.tsx";
import { WeekDayStrip } from "./WeekDayStrip.tsx";
import { DraggableAppointmentBlock, DroppableSlot } from "./CalendarDnD.tsx";
import type { AppointmentDragData, TimeSlotDropData, StaffColumnDropData } from "./CalendarDnD.tsx";
import { formatTimeRange, getStaffDisplayNames, NO_CUSTOMER_DISPLAY_LABEL } from "./utils.tsx";
import { getCalendarBlockReasonLabel } from "./blockReasonMeta.ts";
import { BlockSummaryDialogShell, getBlockScopeLabel } from "./BlockSummaryPopoverPanel.tsx";
import { buildCalendarColorMap, getGroupDotColor } from "../colors.ts";
import { calendarPreferences } from "../calendarPreferences.ts";
import { Loader2, ShieldAlert } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "../../../shared/components/ui/popover.tsx";
import { Button } from "../../../shared/components/ui/button.tsx";
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from "../../../shared/components/ui/alert-dialog.tsx";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useSensors,
  useSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis, snapCenterToCursor } from "@dnd-kit/modifiers";
import { Label } from "../../../shared/components/ui/label.tsx";
import { Input } from "../../../shared/components/ui/input.tsx";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 80; // px per hour (legacy hour-based grid)
const GRID_HEIGHT_PER_HOUR = 100; // px per hour for 15-min slot grid (→ 25px per slot)
const GRID_START_HOUR = 6; // 6 AM
const GRID_END_HOUR = 22; // 10 PM
const GRID_HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i);
const GUTTER_WIDTH = 60; // px - slightly wider for cleaner look
/** Delay before opening reschedule confirm dialog so the card can settle after drop. */
const CONFIRM_MODAL_DELAY_MS = 320;

const EMPTY_FORBIDDEN_SLOT_SET: ReadonlySet<string> = new Set();

const formatHourLabel = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
};

/** Parse appointment id from dnd-kit active id (`appointment-{columnId}-{id}` or legacy `appointment-{id}`). */
function parseDraggableActiveAppointmentId(activeId: string): number | null {
  if (!activeId.startsWith("appointment-")) return null;
  const rest = activeId.slice("appointment-".length);
  const lastDash = rest.lastIndexOf("-");
  const idPart = lastDash === -1 ? rest : rest.slice(lastDash + 1);
  const n = parseInt(idPart, 10);
  return Number.isNaN(n) ? null : n;
}

/** Calculate top offset and height (px) for a time range on the grid */
const getTimePosition = (isoStart: string, isoEnd: string, timezone?: string) => {
  const startMinutes = timezone
    ? getMinutesInTimezone(isoStart, timezone)
    : (new Date(isoStart).getHours() * 60 + new Date(isoStart).getMinutes());
  const endMinutes = timezone
    ? getMinutesInTimezone(isoEnd, timezone)
    : (new Date(isoEnd).getHours() * 60 + new Date(isoEnd).getMinutes());
  const gridStartMinutes = GRID_START_HOUR * 60;

  const top = ((startMinutes - gridStartMinutes) / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 24);
  return { top, height };
};

/**
 * Assign lane index and total lanes for overlapping appointments so they can be shown side-by-side.
 * Returns for each appointment { laneIndex, totalLanes } (0-based lane, 1-based total).
 * totalLanes is the count of appointments that overlap this one's time range (so a standalone block gets full width).
 *
 * Uses real start/end instants — not {@link getTimePosition} pixels — because the grid applies a minimum
 * block height (px) that can extend past the true end time and would falsely treat back-to-back bookings as overlapping.
 */
function getOverlapLanes(appointments: SlimAppointment[]): Map<number, { laneIndex: number; totalLanes: number }> {
  const result = new Map<number, { laneIndex: number; totalLanes: number }>();
  if (appointments.length === 0) return result;

  const indexed = appointments
    .map((appt) => ({
      id: appt.id,
      startMs: new Date(appt.scheduledAt).getTime(),
      endMs: new Date(appt.endsAt).getTime(),
    }))
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);

  const laneEndsMs: number[] = [];

  for (const { id, startMs, endMs } of indexed) {
    let lane = 0;
    while (lane < laneEndsMs.length && laneEndsMs[lane] > startMs) lane++;
    if (lane === laneEndsMs.length) laneEndsMs.push(endMs);
    else laneEndsMs[lane] = endMs;
    result.set(id, { laneIndex: lane, totalLanes: 0 });
  }

  for (let i = 0; i < indexed.length; i++) {
    const { id, startMs, endMs } = indexed[i];
    let count = 0;
    for (let j = 0; j < indexed.length; j++) {
      const o = indexed[j];
      if (timeRangesOverlap(startMs, endMs, o.startMs, o.endMs)) count++;
    }
    const entry = result.get(id);
    if (entry) entry.totalLanes = count;
  }
  return result;
}

/** Group appointments by overlapping time (transitive). Each group has minStart/maxEnd for the span. */
export interface OverlapGroup {
  appointments: SlimAppointment[];
  minStartIso: string;
  maxEndIso: string;
}

function getOverlapGroups(appointments: SlimAppointment[]): OverlapGroup[] {
  if (appointments.length === 0) return [];
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );
  const groups: OverlapGroup[] = [];
  let current: { appointments: SlimAppointment[]; minStart: number; maxEnd: number } = {
    appointments: [sorted[0]],
    minStart: new Date(sorted[0].scheduledAt).getTime(),
    maxEnd: new Date(sorted[0].endsAt).getTime(),
  };
  for (let i = 1; i < sorted.length; i++) {
    const appt = sorted[i];
    const start = new Date(appt.scheduledAt).getTime();
    const end = new Date(appt.endsAt).getTime();
    if (timeRangesOverlap(current.minStart, current.maxEnd, start, end)) {
      current.appointments.push(appt);
      current.minStart = Math.min(current.minStart, start);
      current.maxEnd = Math.max(current.maxEnd, end);
    } else {
      groups.push({
        appointments: current.appointments,
        minStartIso: new Date(current.minStart).toISOString(),
        maxEndIso: new Date(current.maxEnd).toISOString(),
      });
      current = { appointments: [appt], minStart: start, maxEnd: end };
    }
  }
  groups.push({
    appointments: current.appointments,
    minStartIso: new Date(current.minStart).toISOString(),
    maxEndIso: new Date(current.maxEnd).toISOString(),
  });
  return groups;
}

// ─────────────────────────────────────────────────────────────
// Block detail dialog (centered, same as appointment summary)
// ─────────────────────────────────────────────────────────────

interface BlockDetailPopoverProps {
  block: CalendarBlockDto;
  staffName: string | null;
  locationStaff: CalendarStaffMember[];
  timezone?: string;
  children: React.ReactNode;
}

const BlockDetailPopover: FC<BlockDetailPopoverProps> = ({ block, staffName, locationStaff, timezone, children }) => {
  const dispatch = useDispatch();
  const isTeamMember = useSelector(selectIsTeamMember);
  const currentUserId = useSelector(selectCurrentUserId);
  const canDeleteBlock = !isTeamMember || (block.blockScope === 'staff' && block.userId != null && block.userId === currentUserId);
  const canEditBlock = canDeleteBlock;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [blockSummaryOpen, setBlockSummaryOpen] = useState(false);

  const handleEditBlock = useCallback(() => {
    dispatch(setBlockFormEditingAction(block));
    dispatch(toggleBlockFormAction(true));
  }, [dispatch, block]);

  const handleRequestDeleteBlock = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleDelete = useCallback(() => {
    dispatch(deleteCalendarBlock.request(block.id));
    setShowDeleteConfirm(false);
    setBlockSummaryOpen(false);
  }, [dispatch, block.id]);

  return (
    <>
      <BlockSummaryDialogShell
        open={blockSummaryOpen}
        onOpenChange={setBlockSummaryOpen}
        preventDismiss={showDeleteConfirm}
        trigger={children}
        block={block}
        staffName={staffName}
        locationStaff={locationStaff}
        timezone={timezone}
        canEditBlock={canEditBlock}
        canDeleteBlock={canDeleteBlock}
        onEditBlock={handleEditBlock}
        onRequestDeleteBlock={handleRequestDeleteBlock}
      />
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogPortal>
          <AlertDialogOverlay onClick={() => setShowDeleteConfirm(false)} />
          <AlertDialogPrimitive.Content className="fixed left-4 right-4 top-[50%] z-[100] grid translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:left-[50%] sm:right-auto sm:w-full sm:max-w-lg sm:translate-x-[-50%] rounded-xl">
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
          </AlertDialogPrimitive.Content>
        </AlertDialogPortal>
      </AlertDialog>
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Time Column — shared column renderer for both Day and Week views
// ─────────────────────────────────────────────────────────────

export type GridSlot = { hour: number; minute: number };

interface TimeColumnProps {
  appointments: SlimAppointment[];
  blocks: CalendarBlockDto[];
  locationStaff: CalendarStaffMember[];
  openHour: number;
  closeHour: number;
  open247: boolean;
  isToday: boolean;
  onSlotClick?: (hour: number, minute?: number) => void;
  enableDnd?: boolean;
  columnId?: number;
  dateKey?: string;
  /** When set, use interval-based slots (e.g. 15 min) and these grid params */
  gridSlotStarts?: GridSlot[];
  slotHeight?: number;
  gridStartMinutes?: number;
  intervalMinutes?: number;
  timezone?: string;
  /** Pre-built color map from the parent (all appointments for the day/week, not just this column). */
  colorMap?: Map<string, import("../colors.ts").AppointmentBlockColorPair> | null;
  /** Appointment ids that cannot be dragged (e.g. past / ended booking). */
  schedulingLockedAppointmentIds?: ReadonlySet<number>;
  /** While dragging, slot ids that must not accept drops (invalid targets). */
  forbiddenSlotIds?: ReadonlySet<string>;
  /** True while an appointment is being dragged on this grid (valid slots show muted info tint). */
  dndActive?: boolean;
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
  gridSlotStarts,
  slotHeight: slotHeightProp,
  gridStartMinutes,
  intervalMinutes,
  timezone,
  colorMap: appointmentColorMap,
  schedulingLockedAppointmentIds,
  forbiddenSlotIds,
  dndActive = false,
}) => {
  const useSlots = gridSlotStarts != null && gridSlotStarts.length > 0 && slotHeightProp != null && gridStartMinutes != null && intervalMinutes != null;
  const slotHeight = slotHeightProp ?? HOUR_HEIGHT;
  const gridHeight = useSlots ? gridSlotStarts!.length * slotHeight : GRID_HOURS.length * HOUR_HEIGHT;

  const slotRows = useSlots ? gridSlotStarts! : GRID_HOURS.map((hour) => ({ hour, minute: 0 }));

  const getPos = useCallback(
    (isoStart: string, isoEnd: string) => {
      if (useSlots) {
        return getTimePositionForGrid(isoStart, isoEnd, gridStartMinutes!, intervalMinutes!, slotHeight, timezone);
      }
      return getTimePosition(isoStart, isoEnd, timezone);
    },
    [useSlots, gridStartMinutes, intervalMinutes, slotHeight, timezone]
  );

  const nowTop =
    timezone
      ? (
        useSlots && gridStartMinutes != null && intervalMinutes != null
          ? ((getMinutesInTimezone(new Date().toISOString(), timezone) - gridStartMinutes) / intervalMinutes) * slotHeight
          : ((getMinutesInTimezone(new Date().toISOString(), timezone) - GRID_START_HOUR * 60) / 60) * HOUR_HEIGHT
      )
      :
      useSlots && gridStartMinutes != null && intervalMinutes != null
        ? ((new Date().getHours() * 60 + new Date().getMinutes() - gridStartMinutes) / intervalMinutes) * slotHeight
        : ((new Date().getHours() * 60 + new Date().getMinutes()) - GRID_START_HOUR * 60) / 60 * HOUR_HEIGHT;

  return (
    <div className="relative" style={{ height: gridHeight }}>
      {slotRows.map((slot) => {
        const isOutsideHours = !open247 && (slot.hour < openHour || (slot.hour === closeHour && slot.minute > 0) || slot.hour >= closeHour);
        const slotId = useSlots ? `slot-${columnId}-${dateKey}-${slot.hour}-${slot.minute}` : `slot-${columnId}-${dateKey}-${slot.hour}`;
        if (enableDnd && dateKey) {
          const dropDisabled = Boolean(forbiddenSlotIds?.has(slotId));
          return (
            <DroppableSlot
              key={slotId}
              id={slotId}
              columnId={columnId}
              dateKey={dateKey}
              hour={slot.hour}
              minute={slot.minute}
              isOutsideHours={isOutsideHours}
              slotHeight={slotHeight}
              dropDisabled={dropDisabled}
              dndActive={dndActive}
              onSlotClick={onSlotClick ? () => onSlotClick(slot.hour, slot.minute) : undefined}
            />
          );
        }
        return (
          <div
            key={slotId}
            className={`${slot.minute === 0 ? "border-b border-border" : "border-b border-dashed border-border/60"} ${isOutsideHours
              ? "bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
              : "cursor-pointer hover:bg-primary/5 transition-colors"
              }`}
            style={{ height: slotHeight }}
            onClick={onSlotClick ? () => onSlotClick(slot.hour, slot.minute) : undefined}
          />
        );
      })}

      {isToday && (
        <div
          className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
          style={{ top: nowTop }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 ring-2 ring-white dark:ring-neutral-900" />
          <div className="flex-1 h-[2px] bg-red-500" />
        </div>
      )}

      {blocks.map(block => {
        const staffName = block.blockScope === 'staff' && block.userId
          ? getStaffDisplayNames([block.userId], locationStaff)
          : null;

        if (block.isAllDay) {
          return (
            <BlockDetailPopover
              key={`block-${block.id}`}
              block={block}
              staffName={staffName}
              locationStaff={locationStaff}
              timezone={timezone}
            >
              <div
                className="absolute inset-x-0 bg-gray-100/80 dark:bg-gray-800/50 border-l-2 border-gray-300 dark:border-gray-600 z-[5] cursor-pointer hover:bg-gray-200/80 dark:hover:bg-gray-800/70 transition-colors"
                style={{ top: 0, height: gridHeight }}
                title={block.title || block.reason}
              />
            </BlockDetailPopover>
          );
        }
        const pos = getPos(block.startsAt, block.endsAt);
        return (
          <BlockDetailPopover
            key={`block-${block.id}`}
            block={block}
            staffName={staffName}
            locationStaff={locationStaff}
            timezone={timezone}
          >
            <div
              className="absolute inset-x-1 bg-gray-100/80 dark:bg-gray-800/50 border-l-2 border-gray-300 dark:border-gray-600 rounded-sm z-[5] cursor-pointer hover:bg-gray-200/80 dark:hover:bg-gray-800/70 transition-colors"
              style={{ top: pos.top, height: pos.height }}
              title={block.title || getCalendarBlockReasonLabel(block.reason)}
            >
              <span className="text-[10px] text-gray-600 dark:text-gray-400 px-1 truncate block">
                {block.title || getCalendarBlockReasonLabel(block.reason)}
              </span>
            </div>
          </BlockDetailPopover>
        );
      })}

      {(() => {
        const overlapLanes = getOverlapLanes(appointments);
        return appointments.map(appt => {
          const pos = getPos(appt.scheduledAt, appt.endsAt);
          const lanes = overlapLanes.get(appt.id);
          const totalLanes = lanes?.totalLanes ?? 1;
          const laneIndex = lanes?.laneIndex ?? 0;
          const leftPercent = totalLanes > 1 ? laneIndex * (100 / totalLanes) + 0.5 : 0;
          const widthPercent = totalLanes > 1 ? 100 / totalLanes - 1 : 100;
          if (enableDnd && dateKey) {
            return (
              <DraggableAppointmentBlock
                key={`appt-${columnId}-${appt.id}`}
                appointment={appt}
                columnId={columnId}
                dateKey={dateKey}
                leftPercent={totalLanes > 1 ? leftPercent : undefined}
                widthPercent={totalLanes > 1 ? widthPercent : undefined}
                gridStartMinutes={gridStartMinutes}
                intervalMinutes={intervalMinutes}
                slotHeight={useSlots ? slotHeight : undefined}
                timezone={timezone}
                colorMap={appointmentColorMap}
                disableDrag={schedulingLockedAppointmentIds?.has(appt.id) ?? false}
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
              colorMap={appointmentColorMap}
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
  dropDisabled?: boolean;
  dndActive?: boolean;
  /**
   * When true, valid-target tint comes only from per-slot droppables (TimeColumn); the column wrapper
   * does not add a second info background (avoids double tint + header tint). Column hover still shows a ring.
   */
  slotBasedDragHighlight?: boolean;
}> = ({ id, staffId, label, children, dropDisabled = false, dndActive = false, slotBasedDragHighlight = false }) => {
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
      className={`flex flex-1 min-w-[140px] flex-col border-l border-border transition-colors ${dragTintClass}`}
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

/** Convert a display block to SlimAppointment-like shape for grid layout and drag (uses first appointment id). */
function displayBlockToSlim(block: CalendarDisplayBlock): SlimAppointment {
  return {
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
    bookingGroupOrder: block.bookingGroupOrder ?? undefined,
    groupSize: block.groupSize,
    notes: block.notes ?? undefined,
  };
}

const DayGrid: FC = () => {
  const dispatch = useDispatch();
  const selectedDate = useSelector(getSelectedDate);
  const dayAppointments = useSelector(getDayAppointments);
  const dayDisplayBlocks = useSelector(getDayDisplayBlocks);
  const dayBlocks = useSelector(getDayBlocks);
  const hasActiveFilters = useSelector(getHasActiveCalendarFilters);
  const isLoading = useSelector(getDayDataLoading);
  const locationStaff = useSelector(getLocationStaff);
  const locationServices = useSelector(getLocationServices);
  const locationBundles = useSelector(getLocationBundles);
  const locationContext = useSelector(getLocationContext);
  const workingHours = useSelector(getLocationWorkingHours);
  const open247 = useSelector(getLocationOpen247);
  const staffFilter = useSelector(getEffectiveStaffFilterIds);
  const updateConflictOffer = useSelector(getUpdateConflictOffer);
  const pendingDrop = useSelector(getPendingDrop);
  const bookingSettings = useSelector(getBookingSettings);
  const calendarTimezone = useSelector(getCalendarTimezone);
  const bufferTimeMinutes = bookingSettings?.bufferTimeMinutes ?? 0;

  const [activeId, setActiveId] = useState<string | null>(null);
  /** Drag-start time + payload for forbidden-slot preview (`useMemo` reads ref; not listed as a dependency). */
  const dndDaySessionRef = useRef<{ nowMs: number; dragData: AppointmentDragData } | null>(null);
  const [dropConfirmInProgress, setDropConfirmInProgress] = useState(false);
  const [confirmModalDelayedOpen, setConfirmModalDelayedOpen] = useState(false);
  const [overrideReasonText, setOverrideReasonText] = useState("");
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [pendingReschedulePayload, setPendingReschedulePayload] = useState<{
    appointmentId: number;
    newScheduledAt: Date;
    newEndsAt: Date;
    staffUserIds?: number[];
    bookingGroupId?: string;
  } | null>(null);

  const dndSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const dayWorkingHours = getWorkingHoursForDate(selectedDate, workingHours, open247);
  const isOpen = open247 || (dayWorkingHours?.isOpen ?? false);
  const isToday = formatDateInTimezone(selectedDate, calendarTimezone) === formatDateInTimezone(new Date(), calendarTimezone);
  const { openHour, closeHour } = getDayOpenCloseHours(dayWorkingHours, open247, GRID_START_HOUR, GRID_END_HOUR);
  const dateKey = formatDateInTimezone(selectedDate, calendarTimezone);

  const slotIntervalMinutes = bookingSettings?.slotIntervalMinutes ?? 15;
  const dayBounds = getDayOpenCloseMinutes(dayWorkingHours, open247);
  const rangeStartMinutes = dayBounds ? dayBounds.start : openHour * 60;
  const rangeEndMinutes = dayBounds ? dayBounds.end : (open247 ? GRID_END_HOUR * 60 : closeHour * 60);
  const daySlotMinutes = getSlotStartsInRange(rangeStartMinutes, rangeEndMinutes, slotIntervalMinutes);
  const dayGridSlotStarts: GridSlot[] = daySlotMinutes.map((m) => ({
    hour: Math.floor(m / 60),
    minute: m % 60,
  }));
  const dayGridStartMinutes = daySlotMinutes[0] ?? 0;
  const daySlotHeight = daySlotMinutes.length > 0
    ? (GRID_HEIGHT_PER_HOUR / (60 / slotIntervalMinutes))
    : HOUR_HEIGHT;

  const showFilterEmptyBanner =
    !isLoading &&
    isOpen &&
    hasActiveFilters &&
    dayAppointments.length === 0 &&
    dayBlocks.length === 0;

  // Clear "confirm clicked" when drop is cleared or a new pending drop is set (new drag), so the delayed confirm modal can open again.
  useEffect(() => {
    setDropConfirmInProgress(false);
  }, [pendingDrop]);

  // Staff double-book conflict: do not allow override; clear pending drop and offer so card snaps back
  useEffect(() => {
    if (updateConflictOffer?.conflictType === 'staff_appointment') {
      dispatch(setCalendarPendingDrop(null));
      dispatch(setUpdateConflictOffer(null));
    }
  }, [updateConflictOffer?.conflictType, dispatch, updateConflictOffer]);

  // Short delay before showing confirm modal so the card can finish animating to its dropped position
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

    // When team members exist, never render an "Unassigned" lane.
    // In team-based mode all appointments must belong to a staff column.
    return visibleStaffCols;
  }, [locationStaff, staffFilter, locationContext]);

  // Group display blocks by column (one block per group or single appointment)
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

  // Slim-like list per column for rendering (positioning uses block start/end)
  const appointmentsByColumn = useMemo(() => {
    const map = new Map<number, SlimAppointment[]>();
    columns.forEach(col => {
      const blocks = displayBlocksByColumn.get(col.id) ?? [];
      map.set(col.id, blocks.map(displayBlockToSlim));
    });
    return map;
  }, [displayBlocksByColumn, columns]);

  // When a drop is pending, show the appointment(s) at the drop position until confirm/cancel
  const appointmentsByColumnWithPreview = useMemo(() => {
    const map = new Map<number, SlimAppointment[]>();
    columns.forEach(col => {
      const list = appointmentsByColumn.get(col.id) ?? [];
      map.set(col.id, [...list]);
    });

    const pd = pendingDrop;
    if (!pd) return map;

    // Group drop: remove all segments from their columns, add each segment at its preview position in its staff column
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
  }, [appointmentsByColumn, columns, pendingDrop, dayAppointments, calendarTimezone]);

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

  const daySlotRowsForForbidden = useMemo(
    () =>
      dayGridSlotStarts.length > 0
        ? dayGridSlotStarts
        : GRID_HOURS.map((hour) => ({ hour, minute: 0 as const })),
    [dayGridSlotStarts],
  );

  const dayForbiddenSlotIds = useMemo(() => {
    if (!activeId || !activeAppointment) return EMPTY_FORBIDDEN_SLOT_SET;
    if (activeAppointment.status === "cancelled") return EMPTY_FORBIDDEN_SLOT_SET;
    if (isSlimAppointmentSchedulingLocked(activeAppointment, dayAppointments)) {
      return EMPTY_FORBIDDEN_SLOT_SET;
    }
    const session = dndDaySessionRef.current;
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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const raw = event.active.data?.current as AppointmentDragData | undefined;
    if (raw?.type === "appointment") {
      dndDaySessionRef.current = { nowMs: Date.now(), dragData: raw };
    } else {
      dndDaySessionRef.current = null;
    }
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    dndDaySessionRef.current = null;
    setActiveId(null);
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
    // Group drop: use first-segment new start (newGroupStartIso); ignore columnId for staff
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
  }, [pendingDrop, dispatch, open247, dayWorkingHours, calendarTimezone]);

  const handleConfirmOverride = useCallback(() => {
    if (!pendingReschedulePayload) return;
    const reason = overrideReasonText.trim() || undefined;
    const overrideGroupPayload = {
      scheduledAt: pendingReschedulePayload.newScheduledAt.toISOString(),
      allowOutOfHours: true as const,
      overrideConflicts: true as const,
      overrideReason: reason,
    };
    if (pendingReschedulePayload.bookingGroupId) {
      const sid = pendingReschedulePayload.staffUserIds;
      if (sid != null && sid.length > 0) {
        dispatch(
          updateAppointment.request({
            appointmentId: pendingReschedulePayload.appointmentId,
            data: { staffUserIds: sid },
            bookingGroupId: pendingReschedulePayload.bookingGroupId,
            chainReschedule: {
              bookingGroupId: pendingReschedulePayload.bookingGroupId,
              payload: overrideGroupPayload,
            },
          }),
        );
      } else {
        dispatch(
          rescheduleAppointmentGroup.request({
            bookingGroupId: pendingReschedulePayload.bookingGroupId,
            payload: overrideGroupPayload,
          }),
        );
      }
    } else {
      const data: Record<string, unknown> = {
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
    }
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
    const dataWithOverride = {
      ...updateConflictOffer.data,
      overrideConflicts: true,
      overrideReason: reason,
    };
    if (updateConflictOffer.bookingGroupId && updateConflictOffer.data?.scheduledAt) {
      dispatch(
        rescheduleAppointmentGroup.request({
          bookingGroupId: updateConflictOffer.bookingGroupId,
          payload: {
            scheduledAt: String(updateConflictOffer.data.scheduledAt),
            overrideConflicts: true,
            allowOutOfHours: !!updateConflictOffer.data.allowOutOfHours,
            overrideReason: reason,
          },
        }),
      );
    } else {
      dispatch(
        updateAppointment.request({
          appointmentId: updateConflictOffer.appointmentId,
          data: dataWithOverride,
        }),
      );
    }
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

      {showFilterEmptyBanner && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-muted/40 border-b border-border">
          <span className="text-sm text-muted-foreground">
            No appointments match your filters for this day.
          </span>
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
              {dayGridSlotStarts.length > 0
                ? dayGridSlotStarts.map((slot) => (
                  <div key={`${slot.hour}-${slot.minute}`} className="text-[11px] text-muted-foreground flex items-start justify-end" style={{ height: daySlotHeight }}>
                    {slot.minute === 0 ? formatHourLabel(slot.hour) : null}
                  </div>
                ))
                : GRID_HOURS.map((hour) => (
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
                  gridSlotStarts={dayGridSlotStarts.length > 0 ? dayGridSlotStarts : undefined}
                  slotHeight={dayGridSlotStarts.length > 0 ? daySlotHeight : undefined}
                  gridStartMinutes={dayGridSlotStarts.length > 0 ? dayGridStartMinutes : undefined}
                  intervalMinutes={dayGridSlotStarts.length > 0 ? slotIntervalMinutes : undefined}
                  timezone={calendarTimezone}
                  colorMap={dayColorMap}
                  schedulingLockedAppointmentIds={schedulingLockedAppointmentIds}
                  forbiddenSlotIds={activeId ? dayForbiddenSlotIds : EMPTY_FORBIDDEN_SLOT_SET}
                  dndActive={!!activeId}
                  onSlotClick={(hour, minute) => {
                    const hh = String(hour).padStart(2, "0");
                    const mm = String(minute ?? 0).padStart(2, "0");
                    dispatch(
                      toggleAddForm({
                        open: true,
                        prefill: {
                          date: selectedDate,
                          time: `${hh}:${mm}`,
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
          <DragOverlay
            modifiers={
              activeDragIsGroupRestricted
                ? [snapCenterToCursor, restrictToVerticalAxis]
                : [snapCenterToCursor]
            }
          >
            {activeAppointment ? (
              <div className="rounded-xl px-3 py-2 shadow-lg border border-border bg-card cursor-grabbing">
                <div className="font-bold text-xs truncate">{activeAppointment.bookedItemName}</div>
                <div className="text-[10px] opacity-90 truncate mt-1">
                  {formatTimeRange(activeAppointment.scheduledAt, activeAppointment.endsAt, calendarTimezone)}
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
                const min = pendingDrop.minute ?? 0;
                const timeStr = `${pendingDrop.hour}:${String(min).padStart(2, "0")}`;
                const isGroup =
                  !!pendingDrop.appointment.bookingGroupId?.trim() &&
                  isMultiSegmentGroupDrag(
                    pendingDrop.appointment,
                    countSegmentsSameBookingGroup(dayAppointments, pendingDrop.appointment.bookingGroupId),
                  );
                if (isGroup) {
                  return (
                    <>
                      Move this booking (all items) to {pendingDrop.dateKey} at {timeStr}. Staff assignment will not change.
                    </>
                  );
                }
                const sourceCol = pendingDrop.appointment.staffUserIds.length === 0 ? 0 : pendingDrop.appointment.staffUserIds[0];
                const changingColumn = sourceCol !== pendingDrop.columnId;
                const staffLabel = columns.find(c => c.id === pendingDrop.columnId)?.label;
                if (changingColumn && staffLabel) {
                  return <>Assign &quot;{pendingDrop.appointment.bookedItemName}&quot; to {staffLabel} and move to {pendingDrop.dateKey} at {timeStr}?</>;
                }
                return <>Move &quot;{pendingDrop.appointment.bookedItemName}&quot; to {pendingDrop.dateKey} at {timeStr}?</>;
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
// Week day column (summary) — overlapping appointments as one card, no DnD
// ─────────────────────────────────────────────────────────────

interface WeekDayColumnSummaryProps {
  appointments: SlimAppointment[];
  blocks: CalendarBlockDto[];
  locationStaff: CalendarStaffMember[];
  openHour: number;
  closeHour: number;
  open247: boolean;
  isToday: boolean;
  day: Date;
  dateKey: string;
  calendarViewMode: AppointmentViewMode;
  onSlotClick?: (hour: number) => void;
  timezone?: string;
}

const WeekDayColumnSummary: FC<WeekDayColumnSummaryProps> = ({
  appointments,
  blocks,
  locationStaff,
  openHour,
  closeHour,
  open247,
  isToday,
  day,
  dateKey,
  calendarViewMode,
  onSlotClick,
  timezone,
}) => {
  const dispatch = useDispatch();
  const gridHeight = GRID_HOURS.length * HOUR_HEIGHT;
  const overlapGroups = useMemo(() => getOverlapGroups(appointments), [appointments]);

  const handleViewDay = useCallback(() => {
    dispatchSelectDateAndDayView(dispatch, day, calendarViewMode);
  }, [dispatch, day, calendarViewMode]);

  return (
    <div className="relative" style={{ height: gridHeight }}>
      {/* Hour grid: plain divs (no DnD), clickable for add */}
      {GRID_HOURS.map((hour) => {
        const isOutsideHours = !open247 && (hour < openHour || hour >= closeHour);
        return (
          <div
            key={hour}
            role="button"
            tabIndex={0}
            className={`border-b border-dashed border-border ${isOutsideHours
              ? "bg-muted/30 cursor-default"
              : "cursor-pointer hover:bg-primary/5 transition-colors"
              }`}
            style={{ height: HOUR_HEIGHT }}
            onClick={onSlotClick ? () => onSlotClick(hour) : undefined}
            onKeyDown={onSlotClick ? (e) => e.key === "Enter" && onSlotClick(hour) : undefined}
          />
        );
      })}

      {/* Current time indicator (only on today) */}
      {isToday && (
        <div
          className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
          style={{
            top:
              (((timezone ? getMinutesInTimezone(new Date().toISOString(), timezone) : (new Date().getHours() * 60 + new Date().getMinutes())) - GRID_START_HOUR * 60) / 60) *
              HOUR_HEIGHT,
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 ring-2 ring-white dark:ring-neutral-900" />
          <div className="flex-1 h-[2px] bg-red-500" />
        </div>
      )}

      {/* Block overlays (same as TimeColumn) */}
      {blocks.map((block) => {
        const staffName =
          block.blockScope === "staff" && block.userId
            ? getStaffDisplayNames([block.userId], locationStaff)
            : null;
        if (block.isAllDay) {
          return (
            <BlockDetailPopover
              key={`block-${block.id}`}
              block={block}
              staffName={staffName}
              locationStaff={locationStaff}
              timezone={timezone}
            >
              <div
                className="absolute inset-x-0 bg-gray-100/80 dark:bg-gray-800/50 border-l-2 border-gray-300 dark:border-gray-600 z-[5] cursor-pointer hover:bg-gray-200/80 dark:hover:bg-gray-800/70 transition-colors"
                style={{ top: 0, height: gridHeight }}
                title={block.title || block.reason}
              />
            </BlockDetailPopover>
          );
        }
        const pos = getTimePosition(block.startsAt, block.endsAt, timezone);
        return (
          <BlockDetailPopover
            key={`block-${block.id}`}
            block={block}
            staffName={staffName}
            locationStaff={locationStaff}
            timezone={timezone}
          >
            <div
              className="absolute inset-x-1 bg-gray-100/80 dark:bg-gray-800/50 border-l-2 border-gray-300 dark:border-gray-600 rounded-sm z-[5] cursor-pointer hover:bg-gray-200/80 dark:hover:bg-gray-800/70 transition-colors"
              style={{ top: pos.top, height: pos.height }}
              title={block.title || getCalendarBlockReasonLabel(block.reason)}
            >
              <span className="text-[10px] text-gray-600 dark:text-gray-400 px-1 truncate block">
                {block.title || getCalendarBlockReasonLabel(block.reason)}
              </span>
            </div>
          </BlockDetailPopover>
        );
      })}

      {/* Summary cards: one per overlap group */}
      {overlapGroups.map((group, groupIndex) => {
        const pos = getTimePosition(group.minStartIso, group.maxEndIso, timezone);
        const n = group.appointments.length;
        const timeRangeStr = formatTimeRange(group.minStartIso, group.maxEndIso, timezone);
        return (
          <Popover key={`summary-${dateKey}-${groupIndex}`}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="absolute inset-x-1 rounded-lg border border-border bg-muted/60 hover:bg-muted/80 dark:bg-muted/40 dark:hover:bg-muted/60 z-[6] cursor-pointer text-left shadow-sm transition-colors flex flex-col justify-center px-2 py-1"
                style={{ top: pos.top, height: Math.max(pos.height, 28) }}
              >
                <span className="text-xs font-medium text-foreground truncate">
                  {n} appointment{n !== 1 ? "s" : ""}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">{timeRangeStr}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-72 p-0">
              <div className="px-3 py-2 border-b border-border bg-muted/30">
                <div className="font-medium text-sm text-foreground">
                  {n} appointment{n !== 1 ? "s" : ""} · {timeRangeStr}
                </div>
              </div>
              <ul className="max-h-48 overflow-y-auto py-2">
                {group.appointments.map((appt) => (
                  <li
                    key={appt.id}
                    className="px-3 py-1.5 text-xs border-b border-border/50 last:border-b-0 flex flex-col gap-0.5"
                  >
                    <span className="font-medium text-foreground truncate">{appt.bookedItemName}</span>
                    <span className="text-muted-foreground flex items-center gap-1 flex-wrap">
                      <span>{formatTimeRange(appt.scheduledAt, appt.endsAt, timezone)}</span>
                      <span>· {appt.customerName ?? NO_CUSTOMER_DISPLAY_LABEL}</span>
                      {appt.bookingGroupId && (appt.groupSize ?? 1) > 1 && (
                        <span className="inline-flex items-center gap-0.5">
                          ·
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0 mx-0.5"
                            style={{ backgroundColor: getGroupDotColor(appt.bookingGroupId) }}
                          />
                          <span>{appt.bookingGroupOrder ?? 1}/{appt.groupSize}</span>
                        </span>
                      )}
                    </span>
                    <span className="text-muted-foreground">
                      {getStaffDisplayNames(appt.staffUserIds ?? [], locationStaff)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="px-3 py-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleViewDay}>
                  View day
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        );
      })}
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
  const locationServicesWeek = useSelector(getLocationServices);
  const workingHours = useSelector(getLocationWorkingHours);
  const open247 = useSelector(getLocationOpen247);
  const staffFilter = useSelector(getEffectiveStaffFilterIds);
  const optimisticBlocks = useSelector(getOptimisticBlocks);
  const pendingDrop = useSelector(getPendingDrop);
  const updateConflictOffer = useSelector(getUpdateConflictOffer);
  const bookingSettings = useSelector(getBookingSettings);
  const calendarTimezone = useSelector(getCalendarTimezone);
  const bufferTimeMinutes = bookingSettings?.bufferTimeMinutes ?? 0;

  const [activeId, setActiveId] = useState<string | null>(null);
  const dndWeekSessionRef = useRef<{ nowMs: number; dragData: AppointmentDragData } | null>(null);
  const [dropConfirmInProgress, setDropConfirmInProgress] = useState(false);
  const [confirmModalDelayedOpen, setConfirmModalDelayedOpen] = useState(false);
  const [overrideReasonText, setOverrideReasonText] = useState("");
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [pendingReschedulePayload, setPendingReschedulePayload] = useState<{
    appointmentId: number;
    newScheduledAt: Date;
    newEndsAt: Date;
    staffUserIds?: number[];
    bookingGroupId?: string;
  } | null>(null);

  useEffect(() => {
    setDropConfirmInProgress(false);
  }, [pendingDrop]);

  const dndSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const isSingleStaff = staffFilter.length === 1;
  const todayStr = formatDateInTimezone(new Date(), calendarTimezone);

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

  const weekSlotIntervalMinutes = bookingSettings?.slotIntervalMinutes ?? 15;
  const weekRangeStartMinutes = useMemo(
    () => Math.min(...dayWorkingHours.map((d) => d.openHour * 60)),
    [dayWorkingHours],
  );
  const weekRangeEndMinutes = useMemo(
    () => Math.max(...dayWorkingHours.map((d) => d.closeHour * 60)),
    [dayWorkingHours],
  );
  const weekSlotMinutes = useMemo(
    () => getSlotStartsInRange(weekRangeStartMinutes, weekRangeEndMinutes, weekSlotIntervalMinutes),
    [weekRangeStartMinutes, weekRangeEndMinutes, weekSlotIntervalMinutes],
  );
  const weekGridSlotStarts: GridSlot[] = useMemo(
    () => weekSlotMinutes.map((m) => ({ hour: Math.floor(m / 60), minute: m % 60 })),
    [weekSlotMinutes],
  );
  const weekGridStartMinutes = weekSlotMinutes[0] ?? 0;
  const weekSlotHeight =
    weekSlotMinutes.length > 0 ? GRID_HEIGHT_PER_HOUR / (60 / weekSlotIntervalMinutes) : HOUR_HEIGHT;

  // Get appointments and blocks for each day, filtered by staff (blocks include optimistic)
  const columnData = useMemo(() => {
    return weekDays.map(day => {
      const dateKey = formatDateInTimezone(day, calendarTimezone);
      const dayData: DayDataResponse | undefined = weekData?.[dateKey];

      let appointments = dayData?.appointments ?? [];
      const serverBlocks = dayData?.blocks ?? [];
      const forDay = optimisticBlocks.filter((b) => blockOverlapsDate(b, dateKey, calendarTimezone));
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
  }, [weekDays, weekData, staffFilter, optimisticBlocks, calendarTimezone]);

  // Map from dateKey to raw column data for per-segment block validation in week group drag
  const columnDataByDateKey = useMemo(() => {
    const map: Record<string, typeof columnData[number]> = {};
    weekDays.forEach((day, i) => {
      const dateKey = formatDateInTimezone(day, calendarTimezone);
      map[dateKey] = columnData[i];
    });
    return map;
  }, [weekDays, columnData, calendarTimezone]);

  // Convert each column's appointments to display blocks (grouped by bookingGroupId) then to SlimAppointment for rendering
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

  // Merge pending drop preview into column data for week DnD (remove from source so only one draggable id exists)
  const columnDataWithPreview = useMemo(() => {
    if (!pendingDrop || pendingDrop.type !== "reschedule") return columnDisplayData;
    const pd = pendingDrop;
    const appointment = pd.appointment;
    const appointmentId = appointment.id;
    const allDisplayAppointments = columnDisplayData.flatMap((col) => col.appointments);
    // Group drop: remove all segments from every day, add all at preview positions on target day
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

  const weekForbiddenSlotIds = useMemo(() => {
    if (!isSingleStaff || !activeId || !activeAppointment) return EMPTY_FORBIDDEN_SLOT_SET;
    if (activeAppointment.status === "cancelled") return EMPTY_FORBIDDEN_SLOT_SET;
    const weekFlatForLock = columnData.flatMap((c) => c.appointments);
    if (isSlimAppointmentSchedulingLocked(activeAppointment, weekFlatForLock)) {
      return EMPTY_FORBIDDEN_SLOT_SET;
    }
    const session = dndWeekSessionRef.current;
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
  ]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const raw = event.active.data?.current as AppointmentDragData | undefined;
    if (raw?.type === "appointment") {
      dndWeekSessionRef.current = { nowMs: Date.now(), dragData: raw };
    } else {
      dndWeekSessionRef.current = null;
    }
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    dndWeekSessionRef.current = null;
    setActiveId(null);
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
  }, [dispatch, columnDataWithPreview, columnData, calendarTimezone, bufferTimeMinutes]);

  const handleConfirmDrop = useCallback(() => {
    if (!pendingDrop || pendingDrop.type !== "reschedule") return;
    const toConfirm = pendingDrop;
    const { appointment, dateKey: dKey, hour } = toConfirm;
    const minute = toConfirm.minute ?? 0;
    // Week view group drop: use first-segment new start; check full group range for out-of-hours
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
  }, [pendingDrop, dispatch, open247, workingHours, weekDays, calendarTimezone]);

  const handleConfirmOverride = useCallback(() => {
    if (!pendingReschedulePayload) return;
    const reason = overrideReasonText.trim() || undefined;
    const overrideGroupPayload = {
      scheduledAt: pendingReschedulePayload.newScheduledAt.toISOString(),
      allowOutOfHours: true as const,
      overrideConflicts: true as const,
      overrideReason: reason,
    };
    if (pendingReschedulePayload.bookingGroupId) {
      const sid = pendingReschedulePayload.staffUserIds;
      if (sid != null && sid.length > 0) {
        dispatch(
          updateAppointment.request({
            appointmentId: pendingReschedulePayload.appointmentId,
            data: { staffUserIds: sid },
            bookingGroupId: pendingReschedulePayload.bookingGroupId,
            chainReschedule: {
              bookingGroupId: pendingReschedulePayload.bookingGroupId,
              payload: overrideGroupPayload,
            },
          }),
        );
      } else {
        dispatch(
          rescheduleAppointmentGroup.request({
            bookingGroupId: pendingReschedulePayload.bookingGroupId,
            payload: overrideGroupPayload,
          }),
        );
      }
    } else {
      const data: Record<string, unknown> = {
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
    }
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
    const dataWithOverride = {
      ...updateConflictOffer.data,
      overrideConflicts: true,
      overrideReason: reason,
    };
    if (updateConflictOffer.bookingGroupId && updateConflictOffer.data?.scheduledAt) {
      dispatch(
        rescheduleAppointmentGroup.request({
          bookingGroupId: updateConflictOffer.bookingGroupId,
          payload: {
            scheduledAt: String(updateConflictOffer.data.scheduledAt),
            overrideConflicts: true,
            allowOutOfHours: !!updateConflictOffer.data.allowOutOfHours,
            overrideReason: reason,
          },
        }),
      );
    } else {
      dispatch(
        updateAppointment.request({
          appointmentId: updateConflictOffer.appointmentId,
          data: dataWithOverride,
        }),
      );
    }
    dispatch(setUpdateConflictOffer(null));
    setOverrideReasonText("");
  }, [updateConflictOffer, overrideReasonText, dispatch]);

  const handleCancelConflictOverride = useCallback(() => {
    dispatch(setUpdateConflictOffer(null));
    setOverrideReasonText("");
  }, [dispatch]);

  useEffect(() => {
    if (!pendingDrop || dropConfirmInProgress) {
      setConfirmModalDelayedOpen(false);
      return;
    }
    const t = setTimeout(() => setConfirmModalDelayedOpen(true), CONFIRM_MODAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [pendingDrop, dropConfirmInProgress]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading week view...</span>
      </div>
    );
  }

  const gridContent = (
    <div className="overflow-x-auto">
      <div className="flex" style={{ minWidth: 7 * 100 + GUTTER_WIDTH }}>
        <div className="flex flex-col items-end pr-4 select-none flex-shrink-0" style={{ width: GUTTER_WIDTH }}>
          {weekGridSlotStarts.length > 0
            ? weekGridSlotStarts.map((slot) => (
              <div key={`${slot.hour}-${slot.minute}`} className="text-xs font-medium text-muted-foreground flex items-start justify-end" style={{ height: weekSlotHeight }}>
                {slot.minute === 0 ? formatHourLabel(slot.hour) : null}
              </div>
            ))
            : GRID_HOURS.map((hour) => (
              <div key={hour} className="text-xs font-medium text-muted-foreground flex items-start justify-end" style={{ height: HOUR_HEIGHT }}>
                {formatHourLabel(hour)}
              </div>
            ))}
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
                  dispatchSelectDateAndDayView(dispatch, day, AppointmentViewMode.WEEK);
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
                    onSlotClick={(hour, minute) => {
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
                    }}
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
                  dispatchSelectDateAndDayView(dispatch, day, AppointmentViewMode.WEEK);
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
    <div className="flex flex-col">
      <WeekDayStrip gutterWidth={GUTTER_WIDTH} />
      {isSingleStaff ? (
        <DndContext
          sensors={dndSensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
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
              {activeAppointment ? (
                <div className="rounded-xl px-3 py-2 shadow-lg border border-border bg-card cursor-grabbing">
                  <div className="font-bold text-xs truncate">{activeAppointment.bookedItemName}</div>
                  <div className="text-[10px] opacity-90 truncate mt-1">
                    {formatTimeRange(activeAppointment.scheduledAt, activeAppointment.endsAt, calendarTimezone)}
                  </div>
                </div>
              ) : null}
            </DragOverlay>,
            document.body,
          )}
        </DndContext>
      ) : (
        gridContent
      )}

      <AlertDialog open={!!pendingDrop && !overrideDialogOpen && !dropConfirmInProgress && confirmModalDelayedOpen} onOpenChange={(open) => !open && handleCancelDrop()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDrop?.type === "reschedule" && (() => {
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
                  return (
                    <>
                      Move this booking (all items) to {pendingDrop.dateKey} at {timeStr}. Staff assignment will not change.
                    </>
                  );
                }
                return <>Move &quot;{pendingDrop.appointment.bookedItemName}&quot; to {pendingDrop.dateKey} at {timeStr}?</>;
              })()}
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
            <Label htmlFor="week-dnd-override-reason" className="text-xs text-muted-foreground">Reason (optional)</Label>
            <Input
              id="week-dnd-override-reason"
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
