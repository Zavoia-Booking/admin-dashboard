import { memo, type FC, useMemo, type ReactNode } from "react";
import type {
  SlimAppointment,
  CalendarStaffMember,
  CalendarBlockDto,
} from "../../../../shared/types/calendar";
import type { AppointmentBlockColorPair } from "../../colors";
import { getOverlapGroups } from "../timeGrid/overlapUtils";
import { getTimePositionForGrid, clampBlockToViewDay } from "../../workingHours";
import { MobileTimelineApptCard } from "./MobileTimelineApptCard";
import { MobileDayColumnHeader } from "./MobileDayColumnHeader";
import { MobileGridBlockCard } from "./MobileGridBlockCard";
import { DroppableSlot } from "../CalendarDnD";
import { MOBILE_COLUMN_MIN_WIDTH, type GridSlot } from "../timeGrid/constants";
import { AppointmentGroupDialog } from "../timeGrid/AppointmentGroupDialog";
import { AppointmentViewMode } from "../../types";
import { formatTimeRange } from "../utils";

interface MobileDayColumnProps {
  /** Staff owner of this column. `null` when this column holds Unassigned appointments. */
  staff: CalendarStaffMember | null;
  isFiltered: boolean;
  appointments: SlimAppointment[];
  /** Timed blocks scoped to this column's staff. Only rendered when the
   *  column actually owns a staff member; location/business blocks are
   *  drawn at the wrapper level across every column. */
  blocks: CalendarBlockDto[];
  /** Grid math params — pass-through from `useDayTimelineData`. */
  dayGridStartMinutes: number;
  slotIntervalMinutes: number;
  daySlotHeight: number;
  /** Displayed day key (YYYY-MM-DD in `timezone`). Used to clip multi-day blocks per-day. */
  dateKey: string;
  /** Column id for DnD drop targets — staff.id or 0 for Unassigned. */
  columnId: number;
  timezone?: string;
  colorMap?: Map<string, AppointmentBlockColorPair> | null;
  staffColorMap?: Map<string, AppointmentBlockColorPair> | null;
  onFilter: () => void;
  onAppointmentTap: (appt: SlimAppointment) => void;
  onBlockTap: (block: CalendarBlockDto) => void;
  /** Optional header slot — when provided, replaces the default `MobileDayColumnHeader`. Useful for the shared gutter. */
  headerSlot?: ReactNode;
  /** Label for the Unassigned column fallback. */
  unassignedLabel: string;
  /** DnD props — when provided, per-slot drop targets render behind appointments. */
  gridSlotStarts?: GridSlot[];
  dndActive?: boolean;
  forbiddenSlotIds?: ReadonlySet<string>;
  durationHighlightSlotIds?: ReadonlySet<string>;
  schedulingLockedAppointmentIds?: ReadonlySet<number>;
  /** bookingGroupId of the group currently being dragged — sibling segments get ghost treatment. */
  draggingGroupId?: string | null;
  /** Working hours + today context for slot styling (past / outside-hours tint). */
  openHour?: number;
  closeHour?: number;
  open247?: boolean;
  isToday?: boolean;
  isDayInPast?: boolean;
  nowMinutes?: number;
  /** Day this column represents — used when overlapping appointments collapse into a summary dialog. */
  day: Date;
  /** All staff at the location — required when the summary dialog lists appointment details. */
  locationStaff: CalendarStaffMember[];
}

export const MobileDayColumn: FC<MobileDayColumnProps> = memo(({
  staff,
  isFiltered,
  appointments,
  blocks,
  dayGridStartMinutes,
  slotIntervalMinutes,
  daySlotHeight,
  dateKey,
  columnId,
  timezone,
  colorMap,
  staffColorMap,
  onFilter,
  onAppointmentTap,
  onBlockTap,
  headerSlot,
  unassignedLabel,
  gridSlotStarts,
  dndActive = false,
  forbiddenSlotIds,
  durationHighlightSlotIds,
  schedulingLockedAppointmentIds,
  draggingGroupId,
  openHour,
  closeHour,
  open247 = false,
  isToday = false,
  isDayInPast = false,
  nowMinutes = 0,
  day,
  locationStaff,
}) => {
  // Group overlapping appointments into a single summary card — mirrors week-view behavior.
  const overlapGroups = useMemo(() => getOverlapGroups(appointments), [appointments]);
  const enableDnd = !!gridSlotStarts && gridSlotStarts.length > 0;

  return (
    <div
      className="relative flex flex-col border-l border-border/60"
      style={{ minWidth: MOBILE_COLUMN_MIN_WIDTH, flex: `1 0 ${MOBILE_COLUMN_MIN_WIDTH}px` }}
    >
      {headerSlot ?? (
        <MobileDayColumnHeader
          staff={staff}
          isFiltered={isFiltered}
          onTap={onFilter}
          staffColorMap={staffColorMap}
          unassignedLabel={unassignedLabel}
        />
      )}
      <div className="relative flex-1">
        {enableDnd && gridSlotStarts!.map((slot) => {
          const slotId = `slot-${columnId}-${dateKey}-${slot.hour}-${slot.minute}`;
          const slotMinutes = slot.hour * 60 + slot.minute;
          const isOutsideHours =
            !open247 &&
            openHour != null &&
            closeHour != null &&
            (slot.hour < openHour ||
              (slot.hour === closeHour && slot.minute > 0) ||
              slot.hour >= closeHour);
          const isPast = isDayInPast || (isToday && slotMinutes < nowMinutes);
          return (
            <DroppableSlot
              key={slotId}
              id={slotId}
              columnId={columnId}
              dateKey={dateKey}
              hour={slot.hour}
              minute={slot.minute}
              isOutsideHours={!!isOutsideHours}
              slotHeight={daySlotHeight}
              dropDisabled={forbiddenSlotIds?.has(slotId) ?? false}
              dndActive={dndActive}
              isPast={isPast}
              inDurationRange={durationHighlightSlotIds?.has(slotId) ?? false}
            />
          );
        })}
        {blocks.map((block) => {
          const clipped = timezone
            ? clampBlockToViewDay(block.startsAt, block.endsAt, dateKey, timezone)
            : { startsAt: block.startsAt, endsAt: block.endsAt };
          const { top, height } = getTimePositionForGrid(
            clipped.startsAt,
            clipped.endsAt,
            dayGridStartMinutes,
            slotIntervalMinutes,
            daySlotHeight,
            timezone,
          );
          return (
            <MobileGridBlockCard
              key={`block-${block.id}`}
              block={block}
              top={top}
              height={height}
              left={2}
              right={2}
              dateKey={dateKey}
              timezone={timezone}
              onTap={onBlockTap}
            />
          );
        })}
        {overlapGroups.map((group, idx) => {
          if (group.appointments.length === 1) {
            const appt = group.appointments[0];
            const { top, height } = getTimePositionForGrid(
              appt.scheduledAt,
              appt.endsAt,
              dayGridStartMinutes,
              slotIntervalMinutes,
              daySlotHeight,
              timezone,
            );
            const isLocked = schedulingLockedAppointmentIds?.has(appt.id) ?? false;
            const isGroupDragging =
              !!draggingGroupId &&
              !!appt.bookingGroupId &&
              appt.bookingGroupId.trim() === draggingGroupId;
            return (
              <MobileTimelineApptCard
                key={`${staff?.id ?? 0}-${appt.id}`}
                appointment={appt}
                top={top}
                height={height}
                colorMap={colorMap}
                timezone={timezone}
                onTap={() => onAppointmentTap(appt)}
                columnId={enableDnd ? columnId : undefined}
                dateKey={enableDnd ? dateKey : undefined}
                disableDrag={isLocked}
                isGroupDragging={isGroupDragging}
              />
            );
          }
          // 2+ overlapping appointments → collapse to one summary card, matching week view.
          const { top, height } = getTimePositionForGrid(
            group.minStartIso,
            group.maxEndIso,
            dayGridStartMinutes,
            slotIntervalMinutes,
            daySlotHeight,
            timezone,
          );
          const timeRangeStr = formatTimeRange(group.minStartIso, group.maxEndIso, timezone);
          const cardHeight = Math.max(height - 8, 28);
          const n = group.appointments.length;
          return (
            <AppointmentGroupDialog
              key={`summary-${staff?.id ?? 0}-${idx}`}
              appointments={group.appointments}
              timeRangeStr={timeRangeStr}
              locationStaff={locationStaff}
              timezone={timezone}
              day={day}
              calendarViewMode={AppointmentViewMode.DAY}
            >
              <button
                type="button"
                className="absolute left-1 right-1 z-10 cursor-pointer overflow-hidden border-none outline-none
                  rounded-lg bg-purple-50 dark:bg-purple-900/20
                  active:scale-[0.98] transition-transform duration-150 px-2 py-1
                  flex flex-col items-start justify-center text-left"
                style={{ top: top + 4, height: cardHeight }}
              >
                <span className="font-bold text-[11px] leading-tight truncate min-w-0 text-foreground">
                  {n} appointments
                </span>
                {cardHeight > 36 && (
                  <span className="text-[10px] leading-none text-muted-foreground tabular-nums block mt-1">
                    {timeRangeStr}
                  </span>
                )}
              </button>
            </AppointmentGroupDialog>
          );
        })}
      </div>
    </div>
  );
});
MobileDayColumn.displayName = "MobileDayColumn";
