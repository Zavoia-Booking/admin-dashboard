import { memo, type FC, useCallback } from "react";
import type {
  SlimAppointment,
  CalendarBlockDto,
  CalendarStaffMember,
} from "../../../../shared/types/calendar.ts";
import { getTimePositionForGrid, clampBlockToViewDay } from "../../workingHours.ts";
import { getMinutesInTimezone, formatDateInTimezone } from "../../timezone.ts";
import { getCalendarBlockReasonIcon, getCalendarBlockReasonLabel } from "../blockReasonMeta.ts";
import { formatTimeRange, getStaffDisplayNames } from "../utils.tsx";
import { formatBlockTimeForDay } from "../blockDisplay";
import { BLOCK_STRIPE_ACCENT, BLOCK_STRIPE_GRID } from "../../blockStyles.ts";
import { useTranslation } from "react-i18next";
import { AppointmentBlock } from "../AppointmentBlock.tsx";
import { DraggableAppointmentBlock, DroppableSlot } from "../CalendarDnD.tsx";
import { BlockDetailPopover } from "./BlockDetailPopover.tsx";
import { getBlockOverlapGroups, getOverlapGroups, getTimePosition } from "./overlapUtils.ts";
import { BlockGroupDialog } from "./BlockGroupDialog.tsx";
import { AppointmentGroupDialog } from "./AppointmentGroupDialog.tsx";
import { AppointmentViewMode } from "../../types.ts";
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
  /** The day this column represents — passed to AppointmentGroupDialog when
   *  overlapping appointments collapse into a summary card. */
  day: Date;
  /** Current calendar view mode — controls the "View day" navigation target from the summary dialog. */
  calendarViewMode: AppointmentViewMode;
}

export const TimeColumn: FC<TimeColumnProps> = memo(({
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
  day,
  calendarViewMode,
}) => {
  const { t } = useTranslation("calendar");
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

      {/* All-day block overlays — compact banner at the top, not full-height */}
      {blocks.filter(b => b.isAllDay).map(block => {
        const staffName = block.blockScope === 'staff' && block.userId
          ? getStaffDisplayNames([block.userId], locationStaff, t)
          : null;
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
              className="absolute left-1 right-1 z-[7] cursor-pointer hover:opacity-80 transition-opacity rounded-md border-l-[3px] px-2 py-1.5 flex items-center gap-1.5 min-w-0"
              style={{
                top: 2,
                backgroundImage: BLOCK_STRIPE_GRID,
                borderLeftColor: BLOCK_STRIPE_ACCENT,
              }}
              title={block.title || block.reason}
            >
              <span className="flex items-center justify-center size-5 shrink-0 rounded-full border border-border-strong bg-white dark:bg-surface">
                <ReasonIcon className="size-3 text-muted-foreground" />
              </span>
              <span className="text-[11px] font-semibold text-foreground-1 leading-tight truncate min-w-0">
                {t("page.blocks.allDay")} · {block.title?.trim() || getCalendarBlockReasonLabel(block.reason, t)}
              </span>
            </div>
          </BlockDetailPopover>
        );
      })}

      {/* Timed blocks: group overlapping ones into merged summary cards */}
      {(() => {
        const timedBlocks = blocks.filter(b => !b.isAllDay);
        const blockGroups = getBlockOverlapGroups(timedBlocks);

        return blockGroups.map((group, gi) => {
          if (group.blocks.length === 1) {
            /* Single block — stripe background + corner icon badge, no text */
            const block = group.blocks[0];
            const staffName = block.blockScope === 'staff' && block.userId
              ? getStaffDisplayNames([block.userId], locationStaff, t) : null;
            const clipped = dateKey && timezone
              ? clampBlockToViewDay(block.startsAt, block.endsAt, dateKey, timezone)
              : { startsAt: block.startsAt, endsAt: block.endsAt };
            const pos = getPos(clipped.startsAt, clipped.endsAt);
            const ReasonIcon = getCalendarBlockReasonIcon(block.reason);
            const showIconChip = pos.height >= 48;
            const showTimeLabel = pos.height >= 48;
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
                    hover:opacity-80 transition-opacity border border-l-[3px] border-border-strong/40 rounded-md
                    px-2 py-1 text-left flex flex-col items-start justify-center gap-1"
                  style={{
                    top: pos.top,
                    height: pos.height,
                    backgroundImage: BLOCK_STRIPE_GRID,
                    borderLeftColor: BLOCK_STRIPE_ACCENT,
                  }}
                >
                  {showTimeLabel && (
                    <span className="text-[10px] font-medium tabular-nums text-foreground-1 leading-tight truncate max-w-full">
                      {formatBlockTimeForDay(block, dateKey, timezone, t)}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                    {showIconChip && (
                      <span
                        aria-hidden
                        className="flex items-center justify-center size-5 shrink-0 rounded-full border border-border-strong bg-white dark:bg-surface"
                      >
                        <ReasonIcon className="size-3 text-muted-foreground" />
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-foreground-1 leading-tight truncate">
                      {block.title?.trim() || getCalendarBlockReasonLabel(block.reason, t)}
                    </span>
                  </div>
                </div>
              </BlockDetailPopover>
            );
          }

          /* Merged group: 2+ overlapping blocks — stripe card with count badge + dialog */
          const clippedGroup = dateKey && timezone
            ? clampBlockToViewDay(group.minStartIso, group.maxEndIso, dateKey, timezone)
            : { startsAt: group.minStartIso, endsAt: group.maxEndIso };
          const pos = getPos(clippedGroup.startsAt, clippedGroup.endsAt);
          const count = group.blocks.length;
          const timeRangeStr = formatTimeRange(group.minStartIso, group.maxEndIso, timezone);
          const showGroupTimeLabel = pos.height >= 48;
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
                  hover:opacity-80 transition-opacity border border-l-[3px] border-border-strong/40 rounded-md
                  px-2 py-1 flex flex-col items-start justify-center gap-1
                  focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0"
                style={{
                  top: pos.top,
                  height: pos.height,
                  backgroundImage: BLOCK_STRIPE_GRID,
                  borderLeftColor: BLOCK_STRIPE_ACCENT,
                }}
              >
                {showGroupTimeLabel && (
                  <span className="text-[10px] font-medium tabular-nums text-foreground-1 leading-tight truncate max-w-full">
                    {timeRangeStr}
                  </span>
                )}
                <span className="flex items-center justify-center size-5 shrink-0 rounded-full border border-border-strong bg-white dark:bg-surface text-[9px] font-semibold text-foreground tabular-nums">
                  {count}
                </span>
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
        // Group overlapping appointments into a single summary card (mirrors week-view behavior).
        // Single-appointment groups render as a normal draggable card; multi-item groups collapse
        // into one "N appointments" card that opens AppointmentGroupDialog on click.
        const overlapGroups = getOverlapGroups(appointments);
        return overlapGroups.map((group, groupIdx) => {
          if (group.appointments.length === 1) {
            const appt = group.appointments[0];
            if (enableDnd && dateKey) {
              return (
                <DraggableAppointmentBlock
                  key={`appt-${columnId}-${appt.id}`}
                  appointment={appt}
                  columnId={columnId}
                  dateKey={dateKey}
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
            const pos = getPos(appt.scheduledAt, appt.endsAt);
            return (
              <AppointmentBlock
                key={`appt-${appt.id}`}
                appointment={appt}
                top={pos.top}
                height={pos.height}
                colorMap={appointmentColorMap}
              />
            );
          }
          // 2+ appointments sharing a time range → summary card.
          const pos = getPos(group.minStartIso, group.maxEndIso);
          const timeRangeStr = formatTimeRange(group.minStartIso, group.maxEndIso, timezone);
          const cardHeight = Math.max(pos.height - 12, 28);
          const n = group.appointments.length;
          return (
            <AppointmentGroupDialog
              key={`summary-${dateKey || columnId}-${groupIdx}`}
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
                  rounded-xl bg-purple-50
                  hover:shadow-md hover:scale-[1.01] transition-[shadow,transform] duration-150 px-3 py-2
                  flex flex-col items-start justify-center text-left
                  focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0"
                style={{ top: pos.top + 6, height: cardHeight }}
              >
                <div className="flex items-center gap-1.5 min-w-0 w-full">
                  <span className="font-bold text-xs leading-tight truncate min-w-0 text-foreground">
                    {t(n === 1 ? 'page.counts.appointmentOne' : 'page.counts.appointmentOther', { count: n })}
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
        });
      })()}
    </div>
  );
});
TimeColumn.displayName = "TimeColumn";
