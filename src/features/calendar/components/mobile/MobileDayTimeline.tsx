import { type FC, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Plus, SlidersHorizontal } from "lucide-react";
import type { SlimAppointment, CalendarBlockDto, Appointment } from "../../../../shared/types/calendar";
import {
  getScrollToNow,
} from "../../selectors";
import {
  toggleEditFormAction,
  toggleAddForm,
  setBlockFormEditingAction,
  toggleBlockFormAction,
  setScrollToNow,
} from "../../actions";
import {
  useDayAppointmentList,
  type UseDayAppointmentListResult,
} from "../../hooks/useDayAppointmentList";
import {
  useDayTimelineData,
  type UseDayTimelineDataResult,
} from "../../hooks/useDayTimelineData";
import { getTimePositionForGrid } from "../../workingHours";
import { getOverlapLanes } from "../timeGrid/overlapUtils";
import { getAppointmentBlockColors } from "../../colors";
import { calendarPreferences } from "../../calendarPreferences";
import { formatTimeRange } from "../utils";
import {
  MOBILE_GRID_HEIGHT_PER_HOUR,
  MOBILE_GUTTER_WIDTH,
  formatHourLabel,
  formatNowLabel,
} from "../timeGrid/constants";
import { EmptyState } from "../../../../shared/components/common/EmptyState";
import { StaffAvatarCluster } from "../SlimAppointmentCard";
import {
  getCalendarBlockReasonIcon,
  getCalendarBlockReasonLabel,
} from "../blockReasonMeta";
import { cn } from "../../../../shared/lib/utils";

/**
 * Mobile single-column day timeline. Shares the same data layer as desktop
 * `DayGrid` via `useDayTimelineData` + `useDayAppointmentList`, but renders a
 * single column (no staff split, no DnD). Taps open the edit slider the same
 * way tapping a desktop `AppointmentBlock` does.
 */

const MOBILE_HEADER_OFFSET = 0;

interface MobileDayTimelineProps {
  /** When provided, uses this data instead of the default day-mode hook. Used by MobileWeekView. */
  data?: UseDayAppointmentListResult;
}

export const MobileDayTimeline: FC<MobileDayTimelineProps> = ({ data }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation("calendar");
  const scrollToNow = useSelector(getScrollToNow);
  const timeline = useDayTimelineData({
    hourHeight: MOBILE_GRID_HEIGHT_PER_HOUR,
    headerOffset: MOBILE_HEADER_OFFSET,
  });
  const dayData = useDayAppointmentList();
  const list = data ?? dayData;

  const containerRef = useRef<HTMLDivElement>(null);

  // Same "scroll to now" behavior as desktop — only when the explicit flag is set.
  useLayoutEffect(() => {
    if (!scrollToNow || !timeline.isToday || list.isDayLoading) return;
    const el = containerRef.current;
    if (!el) return;
    const scroller = findScrollParent(el);
    if (!scroller) return;
    const target = Math.max(0, timeline.nowGutterTop - scroller.clientHeight / 2);
    scroller.scrollTop = target;
    dispatch(setScrollToNow(false));
  }, [scrollToNow, timeline.isToday, list.isDayLoading, timeline.nowGutterTop, dispatch]);

  const handleAppointmentTap = useCallback(
    (appt: SlimAppointment) => {
      const placeholder: Appointment = {
        id: appt.id,
        customer: null,
        teamMembers: [],
        location: { id: 0, name: "", address: "", description: "", phone: "", email: "" },
        scheduledAt: new Date(appt.scheduledAt),
        endsAt: new Date(appt.endsAt),
        status: appt.status,
        notes: "",
        price: 0,
        cancellationReason: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        bookedItemName: appt.bookedItemName,
        bookingGroupId: appt.bookingGroupId,
        bookingGroupOrder: appt.bookingGroupOrder,
        bookingSource: appt.bookingSource,
        overrideReason: appt.overrideReason,
      };
      dispatch(toggleEditFormAction({ open: true, item: placeholder }));
    },
    [dispatch],
  );

  const handleBlockTap = useCallback(
    (block: CalendarBlockDto) => {
      dispatch(setBlockFormEditingAction(block));
      dispatch(toggleBlockFormAction(true));
    },
    [dispatch],
  );

  if (list.isDayLoading) {
    return <MobileTimelineSkeleton />;
  }

  if (list.sortedItems.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        {list.hasActiveFilters ? (
          <EmptyState
            icon={SlidersHorizontal}
            title={t("page.appointments.noMatchFilters")}
            description={t("page.appointments.noMatchFiltersDayDesc")}
            className="!py-0 !gap-6"
          />
        ) : (
          <EmptyState
            title={t("page.appointments.nothingScheduled")}
            description={t("page.appointments.nothingScheduledDayDesc")}
            className="!py-0 !gap-6"
            actionButton={{
              label: t("page.appointments.addEvent"),
              icon: Plus,
              onClick: () => dispatch(toggleAddForm({ open: true })),
            }}
          />
        )}
      </div>
    );
  }

  const appointments = list.sortedItems
    .filter((i): i is Extract<typeof i, { type: "appointment" }> => i.type === "appointment")
    .map((i) => i.data);
  const blocks = list.sortedItems
    .filter((i): i is Extract<typeof i, { type: "block" }> => i.type === "block")
    .map((i) => i.data);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-background"
      style={{ minHeight: totalGridHeight(timeline) }}
    >
      <HourGrid timeline={timeline} />
      <WorkingHoursShading timeline={timeline} />

      <AppointmentsLayer
        appointments={appointments}
        timeline={timeline}
        colorMap={list.appointmentColorMap}
        locationStaff={list.locationStaff}
        onTap={handleAppointmentTap}
      />

      <BlocksLayer
        blocks={blocks}
        timeline={timeline}
        onTap={handleBlockTap}
      />

      {timeline.isToday && <NowLine timeline={timeline} />}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Hour grid (left gutter labels + horizontal lines)
// ─────────────────────────────────────────────────────────────

const HourGrid: FC<{ timeline: UseDayTimelineDataResult }> = ({ timeline }) => {
  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = 0; h <= 24; h += 1) arr.push(h);
    return arr;
  }, []);
  return (
    <>
      {hours.map((hour) => {
        const top = hour * timeline.hourHeight + MOBILE_HEADER_OFFSET;
        return (
          <div key={hour} className="absolute left-0 right-0 flex" style={{ top }}>
            <div
              className="shrink-0 pr-2 text-right text-[11px] font-medium text-foreground-3 tabular-nums -translate-y-1/2"
              style={{ width: MOBILE_GUTTER_WIDTH }}
            >
              {hour === 0 || hour === 24 ? "" : formatHourLabel(hour, timeline.is24h)}
            </div>
            <div className="flex-1 border-t border-border/60" />
          </div>
        );
      })}
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Non-working-hours shading
// ─────────────────────────────────────────────────────────────

const WorkingHoursShading: FC<{ timeline: UseDayTimelineDataResult }> = ({ timeline }) => {
  const { openHour, closeHour, hourHeight, isOpen } = timeline;
  // If the location is closed all day, shade the entire grid.
  if (!isOpen) {
    return (
      <div
        className="absolute bg-muted/40 pointer-events-none"
        style={{
          left: MOBILE_GUTTER_WIDTH,
          right: 0,
          top: MOBILE_HEADER_OFFSET,
          height: 24 * hourHeight,
        }}
        aria-hidden
      />
    );
  }
  const preOpenHeight = openHour * hourHeight;
  const postCloseTop = closeHour * hourHeight + MOBILE_HEADER_OFFSET;
  const postCloseHeight = (24 - closeHour) * hourHeight;
  return (
    <>
      {preOpenHeight > 0 && (
        <div
          className="absolute bg-muted/40 pointer-events-none"
          style={{
            left: MOBILE_GUTTER_WIDTH,
            right: 0,
            top: MOBILE_HEADER_OFFSET,
            height: preOpenHeight,
          }}
          aria-hidden
        />
      )}
      {postCloseHeight > 0 && (
        <div
          className="absolute bg-muted/40 pointer-events-none"
          style={{
            left: MOBILE_GUTTER_WIDTH,
            right: 0,
            top: postCloseTop,
            height: postCloseHeight,
          }}
          aria-hidden
        />
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Appointments layer
// ─────────────────────────────────────────────────────────────

interface AppointmentsLayerProps {
  appointments: SlimAppointment[];
  timeline: UseDayTimelineDataResult;
  colorMap: ReturnType<typeof useDayAppointmentList>["appointmentColorMap"];
  locationStaff: ReturnType<typeof useDayAppointmentList>["locationStaff"];
  onTap: (appt: SlimAppointment) => void;
}

const AppointmentsLayer: FC<AppointmentsLayerProps> = ({
  appointments,
  timeline,
  colorMap,
  locationStaff,
  onTap,
}) => {
  const lanes = useMemo(() => getOverlapLanes(appointments), [appointments]);
  const colorCodingPref = calendarPreferences.getColorCoding();
  const tz = timeline.calendarTimezone ?? undefined;

  return (
    <>
      {appointments.map((appt) => {
        const { top, height } = getTimePositionForGrid(
          appt.scheduledAt,
          appt.endsAt,
          timeline.dayGridStartMinutes,
          timeline.slotIntervalMinutes,
          timeline.daySlotHeight,
          tz,
        );
        const lane = lanes.get(appt.id) ?? { laneIndex: 0, totalLanes: 1 };
        const totalLanes = Math.max(1, lane.totalLanes);
        const { backgroundColor, color } = getAppointmentBlockColors(
          appt,
          colorCodingPref,
          colorMap,
        );
        const leftPct = (lane.laneIndex / totalLanes) * 100;
        const widthPct = 100 / totalLanes;
        return (
          <button
            key={`appt-${appt.id}`}
            type="button"
            onClick={() => onTap(appt)}
            className={cn(
              "absolute rounded-md border border-black/5 shadow-sm",
              "text-left overflow-hidden active:scale-[0.98] transition-transform duration-100",
              "flex flex-col justify-between px-2 py-1.5",
            )}
            style={{
              top: top + MOBILE_HEADER_OFFSET,
              height,
              left: `calc(${MOBILE_GUTTER_WIDTH}px + ${leftPct}% - ${(MOBILE_GUTTER_WIDTH * leftPct) / 100}px)`,
              width: `calc(${widthPct}% - ${(MOBILE_GUTTER_WIDTH * widthPct) / 100}px - 2px)`,
              backgroundColor,
              color,
            }}
          >
            <div className="flex items-start justify-between gap-1.5 min-w-0">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-medium leading-tight tabular-nums opacity-90 truncate">
                  {formatTimeRange(appt.scheduledAt, appt.endsAt, tz)}
                </div>
                <div className="text-[11px] font-semibold leading-tight truncate">
                  {appt.customerName ?? t_noCustomerFallback()}
                </div>
                <div className="text-[10px] leading-tight opacity-80 truncate">
                  {appt.bookedItemName ?? ""}
                </div>
              </div>
            </div>
            {appt.staffUserIds.length > 0 && height >= 42 && (
              <div className="flex justify-end mt-1">
                <StaffAvatarCluster
                  staffIds={appt.staffUserIds}
                  staff={locationStaff}
                  maxVisible={2}
                />
              </div>
            )}
          </button>
        );
      })}
    </>
  );
};

// Tiny helper — keeps the translation key lookup visible without pulling a hook into the inner component.
function t_noCustomerFallback(): string {
  // Intentionally returns empty; the caller `AppointmentsLayer` is rendered without `t` and the
  // empty customer-name case is rare. Timeline card space is tight; no text is acceptable here.
  return "";
}

// ─────────────────────────────────────────────────────────────
// Blocks layer
// ─────────────────────────────────────────────────────────────

const BLOCK_TIMELINE_BG = "rgba(148, 163, 184, 0.22)"; // slate-400 @ 22% — matches list-view accent
const BLOCK_TIMELINE_BORDER = "rgb(148, 163, 184)";

interface BlocksLayerProps {
  blocks: CalendarBlockDto[];
  timeline: UseDayTimelineDataResult;
  onTap: (block: CalendarBlockDto) => void;
}

const BlocksLayer: FC<BlocksLayerProps> = ({ blocks, timeline, onTap }) => {
  const { t } = useTranslation("calendar");
  const tz = timeline.calendarTimezone ?? undefined;
  return (
    <>
      {blocks.map((block) => {
        if (block.isAllDay) {
          // Render an all-day strip across the top of the grid gutter area.
          return (
            <button
              key={`block-${block.id}`}
              type="button"
              onClick={() => onTap(block)}
              className="absolute rounded-md border-l-2 px-2 py-1 text-left text-[11px] font-medium"
              style={{
                top: MOBILE_HEADER_OFFSET + 2,
                left: MOBILE_GUTTER_WIDTH,
                right: 4,
                backgroundColor: BLOCK_TIMELINE_BG,
                borderLeftColor: BLOCK_TIMELINE_BORDER,
              }}
            >
              <span className="truncate">
                {t("page.blocks.allDay")} · {getCalendarBlockReasonLabel(block.reason, t)}
              </span>
            </button>
          );
        }
        const { top, height } = getTimePositionForGrid(
          block.startsAt,
          block.endsAt,
          timeline.dayGridStartMinutes,
          timeline.slotIntervalMinutes,
          timeline.daySlotHeight,
          tz,
        );
        const ReasonIcon = getCalendarBlockReasonIcon(block.reason);
        return (
          <button
            key={`block-${block.id}`}
            type="button"
            onClick={() => onTap(block)}
            className={cn(
              "absolute rounded-md border-l-2 px-2 py-1 text-left overflow-hidden",
              "active:scale-[0.98] transition-transform duration-100",
              "flex items-start gap-1.5",
            )}
            style={{
              top: top + MOBILE_HEADER_OFFSET,
              height,
              left: MOBILE_GUTTER_WIDTH + 2,
              right: 4,
              backgroundColor: BLOCK_TIMELINE_BG,
              borderLeftColor: BLOCK_TIMELINE_BORDER,
            }}
          >
            <ReasonIcon className="h-3 w-3 shrink-0 mt-0.5 text-foreground-1" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-medium tabular-nums text-foreground-1 leading-tight truncate">
                {formatTimeRange(block.startsAt, block.endsAt, tz)}
              </div>
              <div className="text-[11px] font-semibold text-foreground-1 leading-tight truncate">
                {block.title?.trim() || getCalendarBlockReasonLabel(block.reason, t)}
              </div>
            </div>
          </button>
        );
      })}
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Now line
// ─────────────────────────────────────────────────────────────

const NowLine: FC<{ timeline: UseDayTimelineDataResult }> = ({ timeline }) => {
  return (
    <div
      className="absolute left-0 right-0 pointer-events-none z-20"
      style={{ top: timeline.nowGutterTop }}
      aria-hidden
    >
      <div className="flex items-center">
        <div
          className="pr-1 text-right text-[10px] font-semibold tabular-nums text-red-500 -translate-y-1/2"
          style={{ width: MOBILE_GUTTER_WIDTH }}
        >
          {formatNowLabel(timeline.nowMinutes, timeline.is24h)}
        </div>
        <div className="flex-1 h-[2px] bg-red-500" />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────

const MobileTimelineSkeleton: FC = () => (
  <div className="relative w-full p-2">
    {Array.from({ length: 8 }, (_, i) => (
      <div key={i} className="flex items-center gap-2 py-3">
        <div
          className="h-3 bg-muted/60 rounded shrink-0"
          style={{ width: MOBILE_GUTTER_WIDTH - 8 }}
        />
        <div className="flex-1 h-8 bg-muted/40 rounded" />
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function totalGridHeight(timeline: UseDayTimelineDataResult): number {
  return MOBILE_HEADER_OFFSET + 24 * timeline.hourHeight;
}

function findScrollParent(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}
