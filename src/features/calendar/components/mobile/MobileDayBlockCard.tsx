import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Building2, MapPin, Repeat2, User } from "lucide-react";
import type { CalendarBlockDto, CalendarStaffMember } from "../../../../shared/types/calendar";
import { getBlockDisplayData } from "../blockDisplay";
import { StaffAvatarCluster } from "../SlimAppointmentCard";
import { cn } from "../../../../shared/lib/utils";

const BLOCK_ACCENT = "rgb(148 163 184)"; // slate-400 — same as desktop

interface MobileDayBlockCardProps {
  block: CalendarBlockDto;
  locationStaff: CalendarStaffMember[];
  timezone?: string;
  onClick: () => void;
}

export const MobileDayBlockCard: FC<MobileDayBlockCardProps> = ({
  block,
  locationStaff,
  timezone,
  onClick,
}) => {
  const { t } = useTranslation("calendar");

  const {
    ReasonIcon,
    reasonLabel,
    customTitle,
    notesTrimmed,
    timeDisplay,
    durationText,
    staffMember,
    scopeStaffLabel,
    scopeTierLabel,
  } = getBlockDisplayData(block, locationStaff, timezone, t);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border border-border bg-white dark:bg-neutral-900/30 dark:bg-card",
        "shadow-sm active:scale-[0.98] transition-all duration-150",
        "overflow-hidden",
      )}
      style={{
        borderLeftWidth: 4,
        borderLeftStyle: "solid",
        borderLeftColor: BLOCK_ACCENT,
      }}
    >
      <div className="flex flex-col gap-1.5 px-3 py-2.5">
        {/* Row 1: time + duration (left) · recurring pill (right) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="text-xs font-medium text-foreground-1 tabular-nums">{timeDisplay}</span>
            {durationText && (
              <span className="text-[11px] text-foreground-3 tabular-nums shrink-0">({durationText})</span>
            )}
          </div>
          {block.isRecurring && (
            <span
              className="inline-flex items-center gap-1 shrink-0 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-foreground-3"
              title={t("page.blocks.recurringBlock")}
            >
              <Repeat2 className="h-3 w-3 shrink-0 text-foreground-1" aria-hidden />
              <span className="truncate">{t("page.blocks.recurring")}</span>
            </span>
          )}
        </div>

        {/* Row 2: reason pill + title (+ notes below) */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="inline-flex items-center gap-1 shrink-0 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-foreground-3"
              title={reasonLabel}
            >
              <ReasonIcon className="h-3 w-3 shrink-0 text-foreground-1" aria-hidden />
              <span className="truncate">{reasonLabel}</span>
            </span>
            {customTitle && (
              <span
                className="min-w-0 truncate text-sm font-semibold leading-tight text-foreground-1"
                title={customTitle}
              >
                {customTitle}
              </span>
            )}
          </div>
          {notesTrimmed && (
            <span
              className="text-[11px] leading-snug text-muted-foreground truncate"
              title={notesTrimmed}
            >
              {notesTrimmed}
            </span>
          )}
        </div>

        {/* Row 3: scope icon + label (left) · scope tier (right) */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {block.blockScope === "staff" && staffMember ? (
              <StaffAvatarCluster staffIds={[block.userId!]} staff={locationStaff} maxVisible={1} />
            ) : block.blockScope === "staff" ? (
              <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            ) : block.blockScope === "location" ? (
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            ) : (
              <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span className="text-xs text-foreground-3 truncate min-w-0">{scopeStaffLabel}</span>
          </div>
          <span className="text-[11px] text-foreground-3 shrink-0 truncate max-w-[50%]">
            {scopeTierLabel}
          </span>
        </div>
      </div>
    </button>
  );
};
