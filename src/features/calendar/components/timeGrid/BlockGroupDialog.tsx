import { type FC, useCallback, useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
  Dialog,
  DialogPortal,
  DialogTrigger,
} from "../../../../shared/components/ui/dialog.tsx";
import { cn } from "../../../../shared/lib/utils.ts";
import { DashedDivider } from "../../../../shared/components/common/DashedDivider.tsx";
import { blockSummaryDialogContentClassName, getBlockScopeLabel } from "../BlockSummaryPopoverPanel.tsx";
import { BlockDetailPopover } from "./BlockDetailPopover.tsx";
import {
  getCalendarBlockReasonIcon,
  getCalendarBlockReasonLabel,
} from "../blockReasonMeta.ts";
import { formatTimeRange, getStaffDisplayNames } from "../utils.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../shared/components/ui/avatar.tsx";
import { getAvatarBgColor } from "../../../setupWizard/components/StepTeam";
import type {
  CalendarBlockDto,
  CalendarStaffMember,
} from "../../../../shared/types/calendar.ts";

interface BlockGroupDialogProps {
  blocks: CalendarBlockDto[];
  timeRangeStr: string;
  locationStaff: CalendarStaffMember[];
  timezone?: string;
  children: React.ReactNode;
}

export const BlockGroupDialog: FC<BlockGroupDialogProps> = ({
  blocks,
  timeRangeStr,
  locationStaff,
  timezone,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const count = blocks.length;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
  }, []);

  return (
    <Dialog open={open} modal={false} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogPortal>
        <div
          className="fixed inset-0 z-[70] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          data-state={open ? "open" : "closed"}
          onClick={() => setOpen(false)}
        />
        <DialogPrimitive.Content
          className={blockSummaryDialogContentClassName}
          onCloseAutoFocus={(e) => e.preventDefault()}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">
            {count} block{count !== 1 ? "s" : ""}
          </DialogPrimitive.Title>
          {/* Header */}
          <div className="relative shrink-0 px-5 pb-0 pt-5 md:px-6">
            <div className="flex items-center gap-4 pr-12">
              <div className="min-w-0 flex-1 space-y-1">
                <h2 className="min-w-0 truncate text-lg font-semibold leading-snug text-foreground-1">
                  {count} block{count !== 1 ? "s" : ""}
                </h2>
                <p className="text-xs text-foreground-3 tabular-nums">
                  {timeRangeStr}
                </p>
              </div>
            </div>
            <div className="absolute right-4 top-5">
              <button
                type="button"
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground opacity-70 transition-[opacity,color]",
                  "hover:opacity-100 hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                )}
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DashedDivider
              marginTop="mt-0"
              paddingTop="pt-3"
              className="mb-0"
              dashPattern="1 1"
            />
          </div>

          {/* Block list */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-4 py-3 scrollbar-hide dark:bg-background/50 md:px-6 md:py-4">
            <div className="space-y-2">
              {blocks.map((block) => {
                const staffName =
                  block.blockScope === "staff" && block.userId
                    ? getStaffDisplayNames([block.userId], locationStaff)
                    : null;
                const staffMember = block.blockScope === "staff" && block.userId
                  ? locationStaff.find((s) => s.id === block.userId) ?? null
                  : null;
                const ReasonIcon = getCalendarBlockReasonIcon(block.reason);
                const scopeLabel = getBlockScopeLabel(block.blockScope);
                const durationMin = Math.round(
                  (new Date(block.endsAt).getTime() - new Date(block.startsAt).getTime()) / 60000,
                );
                const durationStr = block.isAllDay
                  ? "All day"
                  : durationMin >= 60
                    ? `${Math.floor(durationMin / 60)}h${durationMin % 60 ? ` ${durationMin % 60}m` : ""}`
                    : `${durationMin}m`;
                return (
                  <BlockDetailPopover
                    key={block.id}
                    block={block}
                    staffName={staffName}
                    locationStaff={locationStaff}
                    timezone={timezone}
                  >
                    <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900/60 p-3 cursor-pointer hover:shadow-md transition-shadow border border-border">
                      {/* Row 1: Icon + title + scope pill */}
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-border/80">
                          <ReasonIcon className="h-3.5 w-3.5 text-foreground-1" />
                        </div>
                        <p className="text-sm font-bold text-foreground-1 truncate min-w-0 flex-1">
                          {block.title || getCalendarBlockReasonLabel(block.reason)}
                        </p>
                        <span className="shrink-0 rounded-full bg-muted/80 dark:bg-neutral-800 px-2 py-0.5 text-[9px] font-medium text-muted-foreground border border-border">
                          {scopeLabel}
                        </span>
                      </div>
                      {/* Row 2: Time + duration */}
                      <div className="flex items-center justify-between mt-1.5 pl-[42px]">
                        <span className="text-xs text-foreground-3 tabular-nums truncate">
                          {block.isAllDay
                            ? "All day"
                            : formatTimeRange(block.startsAt, block.endsAt, timezone)}
                        </span>
                        {!block.isAllDay && (
                          <span className="text-xs text-foreground-3 tabular-nums shrink-0 ml-auto">
                            {durationStr}
                          </span>
                        )}
                      </div>
                      {/* Row 3: Staff avatar + name */}
                      {staffMember && (
                        <div className="flex items-center gap-1.5 mt-1.5 pl-[42px]">
                          <Avatar className="size-5 shrink-0 border border-border">
                            {staffMember.profileImage ? (
                              <AvatarImage src={staffMember.profileImage} alt="" />
                            ) : null}
                            <AvatarFallback
                              className="text-[8px] font-semibold leading-none text-foreground-1"
                              style={{
                                backgroundColor: getAvatarBgColor(
                                  `${staffMember.id}-${staffMember.firstName ?? ""}-${staffMember.lastName ?? ""}`,
                                ),
                              }}
                            >
                              {((staffMember.firstName?.trim()?.[0] ?? "") + (staffMember.lastName?.trim()?.[0] ?? "")).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-foreground-3 truncate">{staffName}</span>
                        </div>
                      )}
                    </div>
                  </BlockDetailPopover>
                );
              })}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
