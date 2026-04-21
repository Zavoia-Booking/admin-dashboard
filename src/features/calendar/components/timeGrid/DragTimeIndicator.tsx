import { memo, type FC } from "react";
import { formatNowLabel } from "./constants";

interface DragTimeIndicatorProps {
  /** Current DnD `overId` (slot id like `slot-<col>-<date>-<h>-<m>`). Null hides the pill. */
  overId: string | null;
  /** Grid-first-slot start in minutes (usually 0). */
  dayGridStartMinutes: number;
  /** Minutes per slot (commonly 15). */
  slotIntervalMinutes: number;
  /** Pixel height of one slot row. */
  daySlotHeight: number;
  /** Additional top offset (e.g. 32 for desktop's h-8 sticky column header). */
  headerOffset?: number;
  /** 24h vs 12h formatting from `calendarPreferences`. */
  is24h?: boolean;
}

const SLOT_ID_RE = /^slot-(-?\d+)-(.+)-(\d+)-(\d+)$/;

export const DragTimeIndicator: FC<DragTimeIndicatorProps> = memo(({
  overId,
  dayGridStartMinutes,
  slotIntervalMinutes,
  daySlotHeight,
  headerOffset = 0,
  is24h,
}) => {
  if (!overId || slotIntervalMinutes <= 0) return null;
  const match = overId.match(SLOT_ID_RE);
  if (!match) return null;
  const hour = parseInt(match[3], 10);
  const minute = parseInt(match[4], 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  const slotMinutes = hour * 60 + minute;
  const top =
    headerOffset + ((slotMinutes - dayGridStartMinutes) / slotIntervalMinutes) * daySlotHeight;
  return (
    <div
      className="absolute right-0 z-40 pointer-events-none -translate-y-1/2"
      style={{
        top,
        transition: "top 100ms ease-out",
        willChange: "transform",
      }}
      aria-hidden
    >
      <span className="bg-primary text-white text-[10px] font-semibold leading-none px-1.5 py-1 rounded-full tabular-nums whitespace-nowrap shadow-md">
        {formatNowLabel(slotMinutes, is24h)}
      </span>
    </div>
  );
});
DragTimeIndicator.displayName = "DragTimeIndicator";
