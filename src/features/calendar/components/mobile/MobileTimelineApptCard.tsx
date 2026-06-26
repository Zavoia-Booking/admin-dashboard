import { memo, type CSSProperties, type FC } from "react";
import { useTranslation } from "react-i18next";
import { useDraggable } from "@dnd-kit/core";
import type { SlimAppointment } from "../../../../shared/types/calendar";
import {
  getAppointmentBlockColors,
  type AppointmentBlockColorPair,
} from "../../colors";
import { calendarPreferences } from "../../calendarPreferences";
import { formatTimeRange } from "../utils";
import type { AppointmentDragData } from "../CalendarDnD";

interface MobileTimelineApptCardProps {
  appointment: SlimAppointment;
  /** Pixel-precise position inside the absolute-positioned column. */
  top: number;
  height: number;
  /** Side-by-side lane for same-column double-bookings (rare). `[0,1]` = 2 lanes, index 0 renders on the left. */
  laneIndex?: number;
  totalLanes?: number;
  colorMap?: Map<string, AppointmentBlockColorPair> | null;
  timezone?: string;
  onTap: () => void;
  /** Enables DnD. Omit for plain render (e.g. DragOverlay preview). */
  columnId?: number;
  dateKey?: string;
  /** Past / ended / cancelled — drag disabled; tap still opens details. */
  disableDrag?: boolean;
}

// Stable module-level constant so the inline style object's `transition` slot
// reuses the same string reference across renders — React's style-diff short-
// circuits on identity, skipping DOM attribute writes on every re-render.
// Opacity 150ms covers cancel/reject flows: card eases 0.3 → 1.0 when the
// dragged item returns to rest, instead of snapping.
const POSITION_TRANSITION =
  "top 180ms cubic-bezier(0.2, 0, 0, 1), " +
  "height 180ms cubic-bezier(0.2, 0, 0, 1), " +
  "opacity 150ms ease-out";

/**
 * Appointment card for the mobile timeline. Mirrors the desktop
 * {@link AppointmentBlock} color + content logic:
 *   - pastel fill + text color from `getAppointmentBlockColors`
 *   - no status dot (status conveyed via fill when coloring by status)
 *   - no left stripe / border — flat pastel card
 *   - optional group dot (when booking group present)
 *   - service name first; time range + customer appended as height allows
 *
 * Sizing is tightened for the mobile grid (96 px/hr instead of 160).
 */
export const MobileTimelineApptCard: FC<MobileTimelineApptCardProps> = memo(({
  appointment,
  top,
  height,
  laneIndex = 0,
  totalLanes = 1,
  colorMap,
  timezone,
  onTap,
  columnId,
  dateKey,
  disableDrag = false,
}) => {
  const { t } = useTranslation("calendar");
  const colorCoding = calendarPreferences.getColorCoding();
  const { backgroundColor, color, stripeColor } = getAppointmentBlockColors(appointment, colorCoding, colorMap);

  const widthPct = 100 / Math.max(1, totalLanes);
  const leftPct = laneIndex * widthPct;

  const compact = height <= 28;
  const inset = compact ? 1 : 2;
  const isCancelled = appointment.status === "cancelled";
  const serviceNameClass = isCancelled ? "line-through decoration-[1.5px]" : "";

  // DnD wiring. `columnId` + `dateKey` opt-in: callers that render a preview
  // (DragOverlay) omit them to get a plain, non-draggable card.
  const dndEnabled = columnId != null && dateKey != null;
  const dragDisabled = !dndEnabled || disableDrag || appointment.status === "cancelled";
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `appointment-${columnId ?? "preview"}-${appointment.id}`,
    disabled: dragDisabled,
    data: dndEnabled
      ? ({
          type: "appointment",
          appointment,
          columnId: columnId!,
          dateKey: dateKey!,
        } satisfies AppointmentDragData)
      : undefined,
  });

  // Press-in scale grows over 240ms while the finger is held — lines up with
  // dnd-kit's 250ms TouchSensor delay so the card visually "primes" during
  // the long-press window. At activation, `isDragging` flips and POSITION_
  // TRANSITION + the overlay take over.
  //
  // CRITICAL: DO NOT apply `active:scale-[1.02]` when this card is a
  // `DragOverlay` preview clone (`!dndEnabled`). The clone sits directly
  // under the finger via snapCenterToCursor, so the browser's `:active`
  // pseudo-class fires on it for the entire drag, compounding scale
  // transforms and making the overlay visually "grow out of the viewport."
  const dragStateClass = isDragging
    ? "opacity-30 pointer-events-none"
    : dndEnabled
      ? "active:scale-[1.02]"
      : "";

  return (
    <button
      type="button"
      data-slot="calendar-card"
      ref={dndEnabled ? setNodeRef : undefined}
      {...(dndEnabled ? listeners : {})}
      {...(dndEnabled ? attributes : {})}
      onClick={onTap}
      aria-label={`${appointment.bookedItemName ?? t('page.aria.appointmentFallback')}`}
      className={`absolute z-10 overflow-hidden border-none text-left transition-transform duration-[240ms] ease-out
        ${dragStateClass}
        ${compact ? "rounded-md pl-[9px] pr-1.5 py-0.5" : "rounded-lg pl-[11px] pr-2 py-1"}`}
      style={{
        top: top + inset,
        height: height - inset * 2,
        left: `calc(${leftPct}% + 1px)`,
        width: `calc(${widthPct}% - 2px)`,
        backgroundColor,
        color,
        opacity: isCancelled ? 0.6 : undefined,
        transition: isDragging ? "none" : POSITION_TRANSITION,
        // Suppress native long-press behaviors (text selection, callout popup,
        // drag-image). On MIUI/Android WebView the 88x44 selection popup was
        // stealing the touch stream after dnd-kit activated, freezing the drag.
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitUserDrag: "none",
        // dnd-kit docs recommend `manipulation` over `none` for TouchSensor —
        // the browser can fast-path taps (removes ~300ms click delay) while
        // we still own long-press drags via the 250ms TouchSensor delay.
        ...(dndEnabled && !dragDisabled ? { touchAction: "manipulation" as const } : {}),
      } as CSSProperties}
    >
      {/* Left stripe — vivid identity color that shares the card's hue.
       *  Computed by `getAppointmentBlockColors`: status modes map to the
       *  semantic `--info`/`--success`/etc tokens; service/staff modes use
       *  the same hue as the pastel fill at higher saturation + mid lightness. */}
      <span
        aria-hidden
        className="absolute top-0 bottom-0 left-0 w-[3px]"
        style={{ backgroundColor: stripeColor }}
      />
      {compact ? (
        <div className="flex items-center gap-1 h-full min-w-0">
          <span className={`font-semibold text-[10px] leading-none truncate min-w-0 ${serviceNameClass}`}>
            {appointment.bookedItemName}
          </span>
        </div>
      ) : (
        <>
          {isCancelled && (
            <div className="mb-0.5">
              <span className="inline-block text-[8px] font-bold uppercase tracking-wide px-1 py-px rounded bg-destructive/20 text-destructive">
                Cancelled
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 min-w-0">
            <span className={`font-bold text-[11px] leading-tight truncate min-w-0 ${serviceNameClass}`}>
              {appointment.bookedItemName}
            </span>
          </div>

          {height > 36 && (
            <span className="text-[10px] leading-none opacity-80 tabular-nums block mt-1">
              {formatTimeRange(appointment.scheduledAt, appointment.endsAt, timezone)}
            </span>
          )}

          {height > 60 && appointment.customerName && (
            <span className="block mt-1 truncate text-[10px] leading-tight opacity-75 font-medium">
              {appointment.customerName}
            </span>
          )}
        </>
      )}
    </button>
  );
});
MobileTimelineApptCard.displayName = "MobileTimelineApptCard";
