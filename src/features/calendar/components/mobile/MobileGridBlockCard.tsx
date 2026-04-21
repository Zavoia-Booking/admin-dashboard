import { type FC } from "react";
import { useTranslation } from "react-i18next";
import type { CalendarBlockDto } from "../../../../shared/types/calendar";
import {
  getCalendarBlockReasonIcon,
  getCalendarBlockReasonLabel,
} from "../blockReasonMeta";
import { formatBlockTimeForDay } from "../blockDisplay";
import { BLOCK_STRIPE_ACCENT, BLOCK_STRIPE_GRID } from "../../blockStyles";

const BLOCK_HATCH_STYLE = { background: BLOCK_STRIPE_GRID } as const;

interface MobileGridBlockCardProps {
  block: CalendarBlockDto;
  top: number;
  height: number;
  /** Inset from the parent's left edge. Defaults tuned for wrapper-level rendering. */
  left?: number;
  right?: number;
  /** Displayed day key (YYYY-MM-DD in `timezone`). Used to render per-day-aware time label on multi-day blocks. */
  dateKey: string;
  timezone?: string;
  onTap: (block: CalendarBlockDto) => void;
}

/**
 * Single timed block card used by both the wrapper-level `BlocksLayer` (for
 * business/location blocks) and per-column inside `MobileDayColumn` (for
 * staff-scoped blocks). Positioning is `absolute` so the parent controls
 * the coord system.
 */
export const MobileGridBlockCard: FC<MobileGridBlockCardProps> = ({
  block,
  top,
  height,
  left = 2,
  right = 4,
  dateKey,
  timezone,
  onTap,
}) => {
  const { t } = useTranslation("calendar");
  const ReasonIcon = getCalendarBlockReasonIcon(block.reason);
  /* Show the icon chip only when the card has room for it — on a 15-min
   * block (~24 px) the 20 px circle + text wouldn't fit. */
  const showIconChip = height >= 40;
  return (
    <button
      type="button"
      onClick={() => onTap(block)}
      /* `z-[7]` — matches desktop `AppointmentBlock z-10` > block `z-[7]`
       * so overlapping appointments render above blocks. */
      className="absolute z-[7] rounded-md border-l-[3px] px-2 py-1 text-left overflow-hidden active:scale-[0.98] transition-transform duration-100 flex flex-col items-start justify-center gap-1"
      style={{
        top,
        height,
        left,
        right,
        borderLeftColor: BLOCK_STRIPE_ACCENT,
        ...BLOCK_HATCH_STYLE,
      }}
    >
      <span className="text-[10px] font-medium tabular-nums text-foreground-1 leading-tight truncate max-w-full">
        {formatBlockTimeForDay(block, dateKey, timezone, t)}
      </span>
      <div className="flex items-center gap-1.5 min-w-0 max-w-full">
        {showIconChip && (
          <span
            aria-hidden
            className="h-5 w-5 shrink-0 rounded-full border border-border bg-white/60 dark:bg-surface/40 flex items-center justify-center"
          >
            <ReasonIcon className="h-3 w-3 text-foreground-1" />
          </span>
        )}
        <span className="text-[11px] font-semibold text-foreground-1 leading-tight truncate">
          {block.title?.trim() || getCalendarBlockReasonLabel(block.reason, t)}
        </span>
      </div>
    </button>
  );
};
