import { type FC, useCallback } from "react";
import type {
  SlimAppointment,
  CalendarBlockDto,
  CalendarStaffMember,
} from "../../../../shared/types/calendar.ts";
import { getTimePositionForGrid } from "../../workingHours.ts";
import { getMinutesInTimezone, formatDateInTimezone } from "../../timezone.ts";
import { getCalendarBlockReasonIcon } from "../blockReasonMeta.ts";
import { formatTimeRange, getStaffDisplayNames } from "../utils.tsx";
import { AppointmentBlock } from "../AppointmentBlock.tsx";
import { DraggableAppointmentBlock, DroppableSlot } from "../CalendarDnD.tsx";
import { BlockDetailPopover } from "./BlockDetailPopover.tsx";
import { getOverlapLanes, getBlockOverlapGroups, getTimePosition } from "./overlapUtils.ts";
import { BlockGroupDialog } from "./BlockGroupDialog.tsx";
import {
  HOUR_HEIGHT,
  GRID_START_HOUR,
  GRID_HOURS,
  type GridSlot,
} from "./constants.ts";

interface TimeColumnProps {
  appointments: SlimAppointment[];
  blocks: CalendarBlockDto[];
  locationStaff: CalendarStaffMember[];
  openHour: number;
  closeHour: number;
  open247: boolean;
  isToday: boolean;
  onSlotClick?: (hour: number, minute?: number, columnId?: number) => void;
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
  colorMap?: Map<string, import("../../colors.ts").AppointmentBlockColorPair> | null;
  /** Appointment ids that cannot be dragged (e.g. past / ended booking). */
  schedulingLockedAppointmentIds?: ReadonlySet<number>;
  /** While dragging, slot ids that must not accept drops (invalid targets). */
  forbiddenSlotIds?: ReadonlySet<string>;
  /** True while an appointment is being dragged on this grid (valid slots show muted info tint). */
  dndActive?: boolean;
  /** Slot ids that fall within the dragged appointment's duration range (multi-slot highlight). */
  durationHighlightSlotIds?: ReadonlySet<string>;
  /** When a group is being dragged, the bookingGroupId of the active group (sibling segments show ghost). */
  draggingGroupId?: string | null;
}

export const TimeColumn: FC<TimeColumnProps> = ({
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
  durationHighlightSlotIds,
  draggingGroupId,
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

  const nowMinutes = timezone
    ? getMinutesInTimezone(new Date().toISOString(), timezone)
    : new Date().getHours() * 60 + new Date().getMinutes();

  const isDayInPast = !isToday && dateKey ? dateKey < (timezone ? formatDateInTimezone(new Date(), timezone) : new Date().toISOString().slice(0, 10)) : false;

  const nowTop =
    timezone
      ? (
        useSlots && gridStartMinutes != null && intervalMinutes != null
          ? ((nowMinutes - gridStartMinutes) / intervalMinutes) * slotHeight
          : ((nowMinutes - GRID_START_HOUR * 60) / 60) * HOUR_HEIGHT
      )
      :
      useSlots && gridStartMinutes != null && intervalMinutes != null
        ? ((nowMinutes - gridStartMinutes) / intervalMinutes) * slotHeight
        : ((nowMinutes) - GRID_START_HOUR * 60) / 60 * HOUR_HEIGHT;

  return (
    <div className="relative" style={{ height: gridHeight }}>
      {slotRows.map((slot) => {
        const isOutsideHours = !open247 && (slot.hour < openHour || (slot.hour === closeHour && slot.minute > 0) || slot.hour >= closeHour);
        const slotMinutes = slot.hour * 60 + (slot.minute ?? 0);
        const isPast = isDayInPast || (isToday && slotMinutes < nowMinutes);
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
              isPast={isPast}
              inDurationRange={durationHighlightSlotIds?.has(slotId)}
              onSlotClick={onSlotClick}
            />
          );
        }
        return (
          <div
            key={slotId}
            className={`${slot.minute !== 45 ? "border-b border-dashed border-border" : ""} ${isPast
              ? "bg-muted/20 cursor-default"
              : isOutsideHours
                ? "bg-muted/30 cursor-pointer hover:bg-primary/5"
                : "cursor-pointer hover:bg-primary/5"
              }`}
            style={{ height: slotHeight, ...(slot.minute === 0 ? { borderTop: '1px solid var(--border)' } : undefined) }}
            onClick={!isPast && onSlotClick ? () => onSlotClick(slot.hour, slot.minute, columnId) : undefined}
          />
        );
      })}

      {/* Working hours boundary markers */}
      {!open247 && useSlots && gridStartMinutes != null && intervalMinutes != null && (
        <>
          <div
            className="absolute left-0 right-0 h-px bg-border-strong/60 z-[3] pointer-events-none"
            style={{ top: ((openHour * 60 - gridStartMinutes) / intervalMinutes) * slotHeight }}
          />
          <div
            className="absolute left-0 right-0 h-px bg-border-strong/60 z-[3] pointer-events-none"
            style={{ top: ((closeHour * 60 - gridStartMinutes) / intervalMinutes) * slotHeight }}
          />
        </>
      )}

      {isToday && (
        <div
          className="absolute right-0 z-[25] pointer-events-none"
          style={{ top: nowTop, left: -1 }}
        >
          <div className="h-[2px] bg-primary" />
        </div>
      )}

      {/* All-day block overlays */}
      {blocks.filter(b => b.isAllDay).map(block => {
        const staffName = block.blockScope === 'staff' && block.userId
          ? getStaffDisplayNames([block.userId], locationStaff)
          : null;
        return (
          <BlockDetailPopover
            key={`block-${block.id}`}
            block={block}
            staffName={staffName}
            locationStaff={locationStaff}
            timezone={timezone}
          >
            <div
              className="absolute inset-x-0 z-[7] cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                top: 0,
                height: gridHeight,
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  var(--border-subtle),
                  var(--border-subtle) 3px,
                  var(--surface) 3px,
                  var(--surface) 7px
                )`,
              }}
              title={block.title || block.reason}
            />
          </BlockDetailPopover>
        );
      })}

      {/* Timed blocks: group overlapping ones into merged summary cards */}
      {(() => {
        const timedBlocks = blocks.filter(b => !b.isAllDay);
        const blockGroups = getBlockOverlapGroups(timedBlocks);
        const BLOCK_STRIPE_BG = `repeating-linear-gradient(
          -45deg,
          var(--border-subtle),
          var(--border-subtle) 3px,
          var(--surface) 3px,
          var(--surface) 7px
        )`;

        return blockGroups.map((group, gi) => {
          if (group.blocks.length === 1) {
            /* Single block — stripe background + corner icon badge, no text */
            const block = group.blocks[0];
            const staffName = block.blockScope === 'staff' && block.userId
              ? getStaffDisplayNames([block.userId], locationStaff) : null;
            const pos = getPos(block.startsAt, block.endsAt);
            const ReasonIcon = getCalendarBlockReasonIcon(block.reason);
            return (
              <BlockDetailPopover
                key={`block-${block.id}`}
                block={block}
                staffName={staffName}
                locationStaff={locationStaff}
                timezone={timezone}
              >
                <div
                  className="absolute inset-x-0 z-[7] cursor-pointer overflow-hidden
                    hover:opacity-80 transition-opacity border border-border-strong/40"
                  style={{
                    top: pos.top,
                    height: pos.height,
                    backgroundImage: BLOCK_STRIPE_BG,
                  }}
                >
                  <div className="absolute top-1 left-1.5">
                    <span className="flex items-center justify-center size-5 rounded-full border border-border-strong bg-white dark:bg-surface">
                      <ReasonIcon className="size-3 text-muted-foreground" />
                    </span>
                  </div>
                </div>
              </BlockDetailPopover>
            );
          }

          /* Merged group: 2+ overlapping blocks — stripe card with count badge + dialog */
          const pos = getPos(group.minStartIso, group.maxEndIso);
          const count = group.blocks.length;
          const timeRangeStr = formatTimeRange(group.minStartIso, group.maxEndIso, timezone);
          return (
            <BlockGroupDialog
              key={`block-group-${gi}`}
              blocks={group.blocks}
              timeRangeStr={timeRangeStr}
              locationStaff={locationStaff}
              timezone={timezone}
            >
              <button
                type="button"
                className="absolute inset-x-0 z-[7] cursor-pointer text-left overflow-hidden outline-none
                  hover:opacity-80 transition-opacity border border-border-strong/40
                  focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0"
                style={{
                  top: pos.top,
                  height: pos.height,
                  backgroundImage: BLOCK_STRIPE_BG,
                }}
              >
                <div className="absolute top-1 left-1.5">
                  <span className="flex items-center justify-center size-5 rounded-full border border-border-strong bg-white dark:bg-surface text-[9px] font-semibold text-foreground tabular-nums">
                    {count}
                  </span>
                </div>
              </button>
            </BlockGroupDialog>
          );
        });
      })()}

      {/* Duration highlight border overlay — single border around each contiguous highlighted range */}
      {durationHighlightSlotIds && durationHighlightSlotIds.size > 0 && (() => {
        const prefix = `slot-${columnId}-${dateKey}-`;
        const highlightMinutes: number[] = [];
        for (const slotId of durationHighlightSlotIds) {
          if (!slotId.startsWith(prefix)) continue;
          const rest = slotId.slice(prefix.length);
          const parts = rest.split('-');
          if (parts.length < 2) continue;
          highlightMinutes.push(parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10));
        }
        if (highlightMinutes.length === 0) return null;
        highlightMinutes.sort((a, b) => a - b);

        const intv = intervalMinutes ?? 60;
        const gStart = gridStartMinutes ?? GRID_START_HOUR * 60;
        const ranges: { startMin: number; endMin: number }[] = [];
        let rStart = highlightMinutes[0];
        let rLast = highlightMinutes[0];
        for (let i = 1; i < highlightMinutes.length; i++) {
          if (highlightMinutes[i] <= rLast + intv) {
            rLast = highlightMinutes[i];
          } else {
            ranges.push({ startMin: rStart, endMin: rLast + intv });
            rStart = highlightMinutes[i];
            rLast = highlightMinutes[i];
          }
        }
        ranges.push({ startMin: rStart, endMin: rLast + intv });

        return ranges.map((range, i) => {
          const top = ((range.startMin - gStart) / intv) * slotHeight;
          const height = ((range.endMin - range.startMin) / intv) * slotHeight;
          return (
            <div
              key={`hl-border-${i}`}
              className="absolute inset-x-0 border-2 border-primary/40 rounded-sm pointer-events-none z-[8]"
              style={{ top, height }}
            />
          );
        });
      })()}

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
                isGroupDragging={!!draggingGroupId && !!appt.bookingGroupId && appt.bookingGroupId.trim() === draggingGroupId}
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
