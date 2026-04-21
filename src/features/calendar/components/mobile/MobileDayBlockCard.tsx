import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Repeat2 } from "lucide-react";
import type {
  CalendarBlockDto,
  CalendarStaffMember,
} from "../../../../shared/types/calendar";
import { getBlockDisplayData } from "../blockDisplay";
import { StaffAvatarCluster } from "../SlimAppointmentCard";
import { BLOCK_STRIPE_LIST } from "../../blockStyles";
import { cn } from "../../../../shared/lib/utils";

const BLOCK_HATCH_STYLE = { background: BLOCK_STRIPE_LIST } as const;

interface MobileDayBlockCardProps {
  block: CalendarBlockDto;
  locationStaff: CalendarStaffMember[];
  timezone?: string;
  onTap: (block: CalendarBlockDto) => void;
}

/**
 * Mobile block list card — renders the hatched row and emits `onTap` so the
 * parent can show the shared {@link MobileBlockSummary} drawer.
 */
export const MobileDayBlockCard: FC<MobileDayBlockCardProps> = ({
  block,
  locationStaff,
  timezone,
  onTap,
}) => {
  const { t } = useTranslation("calendar");

  const {
    ReasonIcon,
    reasonLabel,
    customTitle,
    timeDisplay,
    staffMember,
    staffName,
  } = getBlockDisplayData(block, locationStaff, timezone, t);

  const showStaffRow = block.blockScope === "staff" && !!staffMember;

  return (
    <button
      type="button"
      onClick={() => onTap(block)}
      className={cn(
        "w-full text-left rounded-xl border border-border",
        "active:scale-[0.98] transition-transform duration-150",
        "overflow-hidden cursor-pointer",
      )}
      style={BLOCK_HATCH_STYLE}
    >
      <div className="flex flex-col gap-2 px-3 py-2.5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-9 w-9 shrink-0 rounded-full border border-border bg-white/60 dark:bg-surface/40 flex items-center justify-center"
          >
            <ReasonIcon className="h-4 w-4 text-foreground-1" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-foreground-3 tabular-nums leading-tight">
              {timeDisplay}
            </div>
            <div
              className="text-sm font-semibold leading-snug text-foreground-1 truncate"
              title={customTitle || reasonLabel}
            >
              {customTitle || reasonLabel}
            </div>
          </div>
          {block.isRecurring && (
            <Repeat2
              className="h-4 w-4 shrink-0 text-foreground-3"
              aria-label={t("page.blocks.recurringBlock")}
            />
          )}
        </div>
        {showStaffRow && (
          <div className="flex items-center gap-1.5 min-w-0 pl-[48px]">
            <StaffAvatarCluster
              staffIds={[block.userId!]}
              staff={locationStaff}
              maxVisible={1}
            />
            <span className="text-xs text-foreground-3 truncate min-w-0">
              {staffName}
            </span>
          </div>
        )}
      </div>
    </button>
  );
};
