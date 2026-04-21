import { type FC, memo, useCallback } from "react";
import { useDispatch } from "react-redux";
import type { SlimAppointment, Appointment } from "../../../shared/types/calendar.ts";
import { toggleEditFormAction } from "../actions.ts";
import { formatTimeRange } from "./utils.tsx";
import { ShieldAlert } from "lucide-react";
import { calendarPreferences } from "../calendarPreferences.ts";
import {
  getAppointmentBlockColors,
  getGroupDotColor,
  type AppointmentBlockColorPair,
} from "../colors.ts";

// ─────────────────────────────────────────────────────────────
// AppointmentBlock
// ─────────────────────────────────────────────────────────────

interface AppointmentBlockProps {
  appointment: SlimAppointment;
  /** Pixel height of this block in the grid */
  height: number;
  /** Pixel top offset in the grid */
  top: number;
  /** When set, position side-by-side with other overlapping appointments (0 = left) */
  leftPercent?: number;
  /** Width as percentage when side-by-side (otherwise full width) */
  widthPercent?: number;
  /** When provided, call on click instead of fetching and opening (used by DraggableAppointmentBlock to avoid duplicate fetch). */
  onOpenDetail?: () => void;
  /** From {@link buildCalendarColorMap} for this column/day's appointments (service/staff coding). */
  colorMap?: Map<string, AppointmentBlockColorPair> | null;
}

/**
 * AppointmentBlock — pastel-colored card rendered in the time grid.
 *
 * Content adapts based on the available height:
 * - Always: service name (bold, truncated)
 * - >40px: time range
 */
export const AppointmentBlock: FC<AppointmentBlockProps> = memo(({
  appointment,
  height,
  top,
  leftPercent,
  widthPercent,
  onOpenDetail,
  colorMap,
}) => {
  const dispatch = useDispatch();
  const colorCoding = calendarPreferences.getColorCoding();
  const { backgroundColor, color } = getAppointmentBlockColors(appointment, colorCoding, colorMap);

  const handleClick = useCallback(() => {
    if (onOpenDetail) {
      onOpenDetail();
      return;
    }
    // Open dialog immediately with slim data — full details fetched inside the slider
    const slim = appointment as SlimAppointment;
    const placeholder: Appointment = {
      id: slim.id,
      customer: null,
      teamMembers: [],
      location: { id: 0, name: '', address: '', description: '', phone: '', email: '' },
      scheduledAt: new Date(slim.scheduledAt),
      endsAt: new Date(slim.endsAt),
      status: slim.status,
      notes: '',
      price: 0,
      cancellationReason: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      bookedItemName: slim.bookedItemName,
      bookingGroupId: slim.bookingGroupId,
      bookingGroupOrder: slim.bookingGroupOrder,
      bookingSource: slim.bookingSource,
      overrideReason: slim.overrideReason,
    };
    dispatch(toggleEditFormAction({ open: true, item: placeholder }));
  }, [dispatch, appointment, onOpenDetail]);

  const compact = height <= 36;
  const inset = compact ? 2 : 3;
  const isGroup = !!appointment.bookingGroupId && (appointment.groupSize ?? 1) > 1;
  const isCancelled = appointment.status === "cancelled";
  const style: React.CSSProperties = { top: top + inset, height: height - inset * 2, backgroundColor, color };
  if (leftPercent != null && widthPercent != null) {
    style.left = `${leftPercent}%`;
    style.width = `${widthPercent}%`;
    style.right = 'auto';
  }
  if (isCancelled) style.opacity = 0.6;

  const serviceNameClass = isCancelled ? "line-through decoration-[1.5px]" : "";

  return (
    <div
      className={`absolute z-10 cursor-pointer overflow-hidden border-none
        hover:shadow-md hover:scale-[1.01] transition-[shadow,transform] duration-150
        ${compact ? 'rounded-lg px-2 py-0.5' : 'rounded-xl px-3 py-1.5'}
        ${leftPercent == null ? 'left-1 right-1' : ''}`}
      style={style}
      onClick={handleClick}
    >
      {compact ? (
        /* Compact single-line layout for short appointments */
        <div className="flex items-center gap-1.5 h-full min-w-0">
          {isGroup && (
            <span
              className="h-2 w-2 rounded-full shrink-0 opacity-90"
              style={{ backgroundColor: getGroupDotColor(appointment.bookingGroupId!) }}
            />
          )}
          <span className={`font-semibold text-[11px] leading-none truncate min-w-0 ${serviceNameClass}`}>
            {appointment.bookedItemName}
          </span>
        </div>
      ) : (
        <>
          {isCancelled && (
            <div className="mb-0.5">
              <span className="inline-block text-[9px] font-bold uppercase tracking-wide px-1 py-px rounded bg-destructive/20 text-destructive">
                Cancelled
              </span>
            </div>
          )}
          {/* Row: Group dot + Service name */}
          <div className="flex items-center gap-1.5 min-w-0">
            {isGroup && (
              <span
                className="h-2 w-2 rounded-full shrink-0 opacity-90"
                style={{ backgroundColor: getGroupDotColor(appointment.bookingGroupId!) }}
              />
            )}
            <span className={`font-bold text-xs leading-tight truncate min-w-0 ${serviceNameClass}`}>
              {appointment.bookedItemName}
            </span>
          </div>

          {/* Row 2: Time range */}
          {height > 44 && (
            <span className="text-[10px] leading-none opacity-80 tabular-nums block mt-1.5">
              {formatTimeRange(appointment.scheduledAt, appointment.endsAt)}
            </span>
          )}

          {/* Row 3: Duration */}
          {height > 56 && (
            <span className="text-[10px] leading-none opacity-65 tabular-nums block mt-1.5">
              {appointment.duration >= 60
                ? `${Math.floor(appointment.duration / 60)}h${appointment.duration % 60 ? ` ${appointment.duration % 60}m` : ''}`
                : `${appointment.duration}m`}
            </span>
          )}

          {/* Row 4: Customer name (left) + Override icon (right) */}
          {height > 68 && (
            <div className="flex items-center gap-1.5 mt-1.5 min-w-0">
              {appointment.customerName && (
                <span className="truncate text-[10px] leading-tight opacity-75 font-medium min-w-0 flex-1">
                  {appointment.customerName}
                </span>
              )}
              {appointment.overrideReason && (
                <span className="shrink-0 ml-auto">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400 opacity-90" />
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
});
AppointmentBlock.displayName = "AppointmentBlock";
