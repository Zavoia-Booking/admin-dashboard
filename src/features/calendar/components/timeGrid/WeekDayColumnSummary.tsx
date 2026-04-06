import { type FC, useCallback, useMemo } from "react";

import type {
  SlimAppointment,
  CalendarBlockDto,
  CalendarStaffMember,
} from "../../../../shared/types/calendar.ts";
import { AppointmentViewMode } from "../../types.ts";
import { getTimePositionForGrid } from "../../workingHours.ts";
import { getMinutesInTimezone, formatDateInTimezone } from "../../timezone.ts";
import { getCalendarBlockReasonIcon } from "../blockReasonMeta.ts";
import { formatTimeRange, getStaffDisplayNames } from "../utils.tsx";
import { AppointmentBlock } from "../AppointmentBlock.tsx";
import type { AppointmentBlockColorPair } from "../../colors.ts";
import { BlockDetailPopover } from "./BlockDetailPopover.tsx";
import { AppointmentGroupDialog } from "./AppointmentGroupDialog.tsx";
import { BlockGroupDialog } from "./BlockGroupDialog.tsx";
import { getOverlapGroups, getBlockOverlapGroups, getTimePosition } from "./overlapUtils.ts";
import {
  HOUR_HEIGHT,
  GRID_START_HOUR,
  GRID_HOURS,
  type GridSlot,
} from "./constants.ts";

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
  gridSlotStarts?: GridSlot[];
  slotHeight?: number;
  gridStartMinutes?: number;
  intervalMinutes?: number;
  colorMap?: Map<string, AppointmentBlockColorPair> | null;
}

export const WeekDayColumnSummary: FC<WeekDayColumnSummaryProps> = ({
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
  gridSlotStarts: gridSlotStartsProp,
  slotHeight: slotHeightProp,
  gridStartMinutes: gridStartMinutesProp,
  intervalMinutes: intervalMinutesProp,
  colorMap,
}) => {
  const useSlots = gridSlotStartsProp != null && gridSlotStartsProp.length > 0 && slotHeightProp != null && gridStartMinutesProp != null && intervalMinutesProp != null;
  const slotHeight = slotHeightProp ?? HOUR_HEIGHT;
  const gridHeight = useSlots ? gridSlotStartsProp!.length * slotHeight : GRID_HOURS.length * HOUR_HEIGHT;
  const slotRows = useSlots ? gridSlotStartsProp! : GRID_HOURS.map((hour) => ({ hour, minute: 0 }));
  const overlapGroups = useMemo(() => getOverlapGroups(appointments), [appointments]);
  const blockGroups = useMemo(() => {
    const timed = blocks.filter((b) => !b.isAllDay);
    return getBlockOverlapGroups(timed);
  }, [blocks]);

  const getPos = useCallback(
    (isoStart: string, isoEnd: string) => {
      if (useSlots) {
        return getTimePositionForGrid(isoStart, isoEnd, gridStartMinutesProp!, intervalMinutesProp!, slotHeight, timezone);
      }
      return getTimePosition(isoStart, isoEnd, timezone);
    },
    [useSlots, gridStartMinutesProp, intervalMinutesProp, slotHeight, timezone]
  );

  const nowMinutes = timezone
    ? getMinutesInTimezone(new Date().toISOString(), timezone)
    : new Date().getHours() * 60 + new Date().getMinutes();
  const nowTop = useSlots && gridStartMinutesProp != null && intervalMinutesProp != null
    ? ((nowMinutes - gridStartMinutesProp) / intervalMinutesProp) * slotHeight
    : ((nowMinutes - GRID_START_HOUR * 60) / 60) * HOUR_HEIGHT;

  const isDayInPast = !isToday && dateKey ? dateKey < (timezone ? formatDateInTimezone(new Date(), timezone) : new Date().toISOString().slice(0, 10)) : false;

  return (
    <div className="relative" style={{ height: gridHeight }}>
      {/* Slot grid: plain divs (no DnD), clickable for add */}
      {slotRows.map((slot) => {
        const isOutsideHours = !open247 && (slot.hour < openHour || (slot.hour === closeHour && slot.minute > 0) || slot.hour >= closeHour);
        const slotMinutes = slot.hour * 60 + (slot.minute ?? 0);
        const isPast = isDayInPast || (isToday && slotMinutes < nowMinutes);
        return (
          <div
            key={`${slot.hour}-${slot.minute}`}
            className={`${slot.minute !== 45 ? "border-b border-dashed border-border" : ""} ${isPast
              ? "bg-muted/20 cursor-default"
              : isOutsideHours
                ? "bg-muted/30 cursor-pointer hover:bg-primary/5"
                : "cursor-pointer hover:bg-primary/5"
              }`}
            style={{ height: slotHeight, ...(slot.minute === 0 ? { borderTop: '1px solid var(--border)' } : undefined) }}
            onClick={!isPast && onSlotClick ? () => onSlotClick(slot.hour) : undefined}
          />
        );
      })}

      {/* Working hours boundary markers */}
      {!open247 && useSlots && gridStartMinutesProp != null && intervalMinutesProp != null && (
        <>
          <div
            className="absolute left-0 right-0 h-px bg-border-strong/60 z-[3] pointer-events-none"
            style={{ top: ((openHour * 60 - gridStartMinutesProp) / intervalMinutesProp) * slotHeight }}
          />
          <div
            className="absolute left-0 right-0 h-px bg-border-strong/60 z-[3] pointer-events-none"
            style={{ top: ((closeHour * 60 - gridStartMinutesProp) / intervalMinutesProp) * slotHeight }}
          />
        </>
      )}

      {/* Current time indicator (only on today) */}
      {isToday && (
        <div
          className="absolute right-0 z-20 pointer-events-none"
          style={{ top: nowTop, left: -1 }}
        >
          <div className="h-[2px] bg-primary" />
        </div>
      )}

      {/* All-day block overlays */}
      {blocks.filter((b) => b.isAllDay).map((block) => {
        const staffName = block.blockScope === "staff" && block.userId
          ? getStaffDisplayNames([block.userId], locationStaff) : null;
        return (
          <BlockDetailPopover key={`block-${block.id}`} block={block} staffName={staffName} locationStaff={locationStaff} timezone={timezone}>
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

      {/* Timed block groups — single blocks render individually, 2+ merge into summary card */}
      {blockGroups.map((group, gi) => {
        if (group.blocks.length === 1) {
          const block = group.blocks[0];
          const staffName = block.blockScope === "staff" && block.userId
            ? getStaffDisplayNames([block.userId], locationStaff) : null;
          const pos = getPos(block.startsAt, block.endsAt);
          const ReasonIcon = getCalendarBlockReasonIcon(block.reason);
          return (
            <BlockDetailPopover key={`block-${block.id}`} block={block} staffName={staffName} locationStaff={locationStaff} timezone={timezone}>
              <div
                className="absolute inset-x-0 z-[7] cursor-pointer overflow-hidden
                  hover:opacity-80 transition-opacity border border-border-strong/40"
                style={{
                  top: pos.top,
                  height: pos.height,
                  backgroundImage: `repeating-linear-gradient(
                    -45deg,
                    var(--border-subtle),
                    var(--border-subtle) 3px,
                    var(--surface) 3px,
                    var(--surface) 7px
                  )`,
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

        /* Merged group: 2+ overlapping blocks → dialog */
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
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  var(--border-subtle),
                  var(--border-subtle) 3px,
                  var(--surface) 3px,
                  var(--surface) 7px
                )`,
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
      })}

      {/* Appointment cards: single appointments render as full cards, groups as summary */}
      {overlapGroups.map((group, groupIndex) => {
        const pos = getPos(group.minStartIso, group.maxEndIso);
        const n = group.appointments.length;

        if (n === 1) {
          const appt = group.appointments[0];
          return (
            <AppointmentBlock
              key={`appt-${dateKey}-${appt.id}`}
              appointment={appt}
              top={pos.top}
              height={pos.height}
              colorMap={colorMap}
            />
          );
        }

        const timeRangeStr = formatTimeRange(group.minStartIso, group.maxEndIso, timezone);
        const cardHeight = Math.max(pos.height - 12, 28);
        return (
          <AppointmentGroupDialog
            key={`summary-${dateKey}-${groupIndex}`}
            appointments={group.appointments}
            timeRangeStr={timeRangeStr}
            locationStaff={locationStaff}
            timezone={timezone}
            day={day}
            calendarViewMode={calendarViewMode}
          >
            <button
              type="button"
              className="absolute left-1 right-1 z-10 cursor-pointer overflow-hidden border-none outline-none
                rounded-xl bg-purple-50 dark:bg-purple-900/20
                hover:shadow-md hover:scale-[1.01] transition-[shadow,transform] duration-150 px-3 py-2
                flex flex-col items-start justify-center text-left
                focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0"
              style={{ top: pos.top + 6, height: cardHeight }}
            >
              <div className="flex items-center gap-1.5 min-w-0 w-full">
                <span className="font-bold text-xs leading-tight truncate min-w-0 text-foreground">
                  {n} appointments
                </span>
              </div>
              {cardHeight > 44 && (
                <span className="text-[10px] leading-none text-muted-foreground tabular-nums block mt-1.5">
                  {timeRangeStr}
                </span>
              )}
              {cardHeight > 56 && (
                <span className="text-[10px] leading-none text-muted-foreground/70 tabular-nums block mt-1.5">
                  {(() => {
                    const totalMin = Math.round((new Date(group.maxEndIso).getTime() - new Date(group.minStartIso).getTime()) / 60000);
                    return totalMin >= 60
                      ? `${Math.floor(totalMin / 60)}h${totalMin % 60 ? ` ${totalMin % 60}m` : ''}`
                      : `${totalMin}m`;
                  })()}
                </span>
              )}
            </button>
          </AppointmentGroupDialog>
        );
      })}
    </div>
  );
};
