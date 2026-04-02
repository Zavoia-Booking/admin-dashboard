import { type FC, type ReactNode, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, User, Pencil, Trash2, Repeat2 } from "lucide-react";
import { Button } from "../../../shared/components/ui/button.tsx";
import { Label } from "../../../shared/components/ui/label.tsx";
import { DashedDivider } from "../../../shared/components/common/DashedDivider.tsx";
import {
  Dialog,
  DialogPortal,
  DialogTrigger,
} from "../../../shared/components/ui/dialog.tsx";
import { cn } from "../../../shared/lib/utils.ts";
import type { CalendarBlockDto, CalendarStaffMember } from "../../../shared/types/calendar.ts";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/components/ui/avatar.tsx";
import { getAvatarBgColor } from "../../setupWizard/components/StepTeam";
import { formatTimeRange, formatDurationHuman } from "./utils.tsx";
import {
  getCalendarBlockReasonIcon,
  getCalendarBlockReasonLabel,
} from "./blockReasonMeta.ts";
import { getBlockFormOpen } from "../selectors.ts";

/** Matches EditAppointmentSlider detail surfaces: default cursor, pointer on controls. */
const BLOCK_SUMMARY_PANEL_CURSOR =
  "cursor-default [&_button:not(:disabled)]:cursor-pointer [&_button:disabled]:cursor-not-allowed";

export function getBlockScopeLabel(scope: string): string {
  switch (scope) {
    case "location":
      return "Location Block";
    case "staff":
      return "Staff Time Off";
    case "business":
      return "Business Block";
    default:
      return scope;
  }
}

function staffAppliesLine(block: CalendarBlockDto, staffName: string | null): string {
  switch (block.blockScope) {
    case "location":
      return "Entire location";
    case "business":
      return "All locations";
    case "staff":
      return staffName ?? (block.userId != null ? `Staff #${block.userId}` : "Unassigned");
    default:
      return block.blockScope;
  }
}

/** Same centered shell as {@link EditAppointmentSlider} (`DialogPrimitive.Content`). */
export const blockSummaryDialogContentClassName = cn(
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200",
  "fixed left-[50%] top-[50%] z-[70] flex w-[calc(100%-2rem)] max-w-lg max-h-[90vh] translate-x-[-50%] translate-y-[-50%]",
  "flex-col overflow-hidden rounded-2xl border border-border bg-white p-0 shadow-lg dark:bg-surface",
  "focus:outline-none focus-visible:outline-none",
  BLOCK_SUMMARY_PANEL_CURSOR,
);

export type BlockSummaryPopoverPanelProps = {
  block: CalendarBlockDto;
  staffName: string | null;
  /** Resolve avatars for staff-scoped blocks (same source as list/grid). */
  locationStaff: CalendarStaffMember[];
  timezone?: string;
  canEditBlock: boolean;
  canDeleteBlock: boolean;
  onEditBlock: () => void;
  onRequestDeleteBlock: () => void;
};

export type BlockSummaryDialogShellProps = BlockSummaryPopoverPanelProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  /** When true, prevents the dialog from being dismissed by outside clicks / Escape. */
  preventDismiss?: boolean;
};

/**
 * Block “summary” body styled to mirror {@link EditAppointmentSlider}: header band + dashed rule,
 * muted scroll region, bordered detail card(s), pill-shaped actions.
 */
export const BlockSummaryPopoverPanel: FC<BlockSummaryPopoverPanelProps> = ({
  block,
  staffName,
  locationStaff,
  timezone,
  canEditBlock,
  canDeleteBlock,
  onEditBlock,
  onRequestDeleteBlock,
}) => {
  const reasonLabel = getCalendarBlockReasonLabel(block.reason);
  const ReasonIcon = getCalendarBlockReasonIcon(block.reason);
  const customTitle = block.title?.trim() ?? "";
  const appliesLine = staffAppliesLine(block, staffName);
  const timeDisplay = block.isAllDay ? "All day" : formatTimeRange(block.startsAt, block.endsAt, timezone);
  const durationMinutes = block.isAllDay
    ? null
    : Math.max(
        0,
        Math.round((new Date(block.endsAt).getTime() - new Date(block.startsAt).getTime()) / 60000),
      );
  const durationText = durationMinutes != null ? formatDurationHuman(durationMinutes) : null;
  const notesTrimmed = block.notes?.trim() ?? "";

  const headerMetaLine = `${timeDisplay}${durationText ? ` · ${durationText}` : ""} · ${appliesLine}`;
  const headerTitle = customTitle || "Block details";

  /** Same resolution as {@link BlockCard} “who” column for staff blocks. */
  const staffMember =
    block.blockScope === "staff" && block.userId != null
      ? locationStaff.find((s) => s.id === block.userId) ?? null
      : null;

  const appliesRowLabel =
    block.blockScope === "staff"
      ? "Assigned staff"
      : block.blockScope === "location"
        ? "Location"
        : block.blockScope === "business"
          ? "Business"
          : "Applies to";

  return (
    <>
      <div className="relative shrink-0 px-5 pb-0 pt-5 md:px-6">
        <div className="flex items-center gap-4 pr-12">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/50 dark:bg-muted/30"
            aria-hidden
          >
            <ReasonIcon className="h-6 w-6 text-foreground-1" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="min-w-0 truncate text-lg font-semibold leading-snug text-foreground-1" title={headerTitle}>
              {headerTitle}
            </h2>
            <div className="min-w-0 space-y-0.5 text-xs leading-relaxed text-foreground-3 dark:text-foreground-2">
              <p className="truncate" title={headerMetaLine}>
                {headerMetaLine}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute right-4 top-5">
          <DialogPrimitive.Close
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground opacity-70 transition-[opacity,color]",
              "hover:opacity-100 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            )}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>
        </div>
        <DashedDivider marginTop="mt-0" paddingTop="pt-3" className="mb-4" dashPattern="1 1" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-4 py-3 scrollbar-hide dark:bg-background/50 md:px-6 md:py-4">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-white p-3 shadow-sm dark:bg-card md:p-5">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <Label className="text-sm font-semibold text-foreground-1">Details</Label>
              {block.isRecurring ? (
                <span
                  className={cn(
                    "inline-flex max-w-full min-w-24 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border",
                    "bg-muted/60 px-2 py-1 text-xs font-medium text-foreground-3",
                  )}
                  title="Recurring block"
                >
                  <Repeat2 className="h-3.5 w-3.5 shrink-0 text-foreground-1" aria-hidden />
                  <span className="truncate">Recurring</span>
                </span>
              ) : null}
            </div>
            <dl className="mt-3 divide-y divide-border-subtle text-sm">
              <div className="grid grid-cols-[minmax(6.5rem,7.5rem)_minmax(0,1fr)] items-start gap-x-6 gap-y-1 py-3.5">
                <dt className="pt-0.5 font-medium text-foreground-3">Reason</dt>
                <dd className="min-w-0 font-semibold text-foreground-1">{reasonLabel}</dd>
              </div>
              <div className="grid grid-cols-[minmax(6.5rem,7.5rem)_minmax(0,1fr)] items-start gap-x-6 gap-y-1 py-3.5">
                <dt className="pt-0.5 font-medium text-foreground-3">Time</dt>
                <dd className="min-w-0 font-semibold tabular-nums text-foreground-1">
                  {timeDisplay}
                  {durationText ? (
                    <span className="font-normal text-foreground-3"> ({durationText})</span>
                  ) : null}
                </dd>
              </div>
              <div className="grid grid-cols-[minmax(6.5rem,7.5rem)_minmax(0,1fr)] items-start gap-x-6 gap-y-0 py-3.5">
                <dt className="pt-1 font-medium text-foreground-3">{appliesRowLabel}</dt>
                <dd className="min-w-0">
                  {block.blockScope === "staff" && block.userId ? (
                    <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                      {staffMember ? (
                        <>
                          <Avatar
                            className="h-9 w-9 shrink-0 ring-1 ring-border-subtle"
                            title={`${staffMember.firstName} ${staffMember.lastName}`}
                          >
                            {staffMember.profileImage ? (
                              <AvatarImage src={staffMember.profileImage} alt="" className="object-cover" />
                            ) : null}
                            <AvatarFallback
                              className="text-[10px] font-semibold text-foreground-1"
                              style={{
                                backgroundColor: getAvatarBgColor(
                                  `${staffMember.id}-${staffMember.firstName ?? ""}-${staffMember.lastName ?? ""}`,
                                ),
                              }}
                            >
                              {`${staffMember.firstName?.[0] ?? ""}${staffMember.lastName?.[0] ?? ""}`.toUpperCase() ||
                                "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 truncate font-semibold text-foreground-1">{appliesLine}</span>
                        </>
                      ) : (
                        <>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/50 ring-1 ring-border-subtle">
                            <User className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                          </div>
                          <span className="min-w-0 truncate font-semibold text-foreground-1">{appliesLine}</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="font-semibold text-foreground-1">{appliesLine}</span>
                  )}
                </dd>
              </div>
              {notesTrimmed ? (
                <div className="grid grid-cols-[minmax(6.5rem,7.5rem)_minmax(0,1fr)] items-start gap-x-6 gap-y-1 py-3.5">
                  <dt className="pt-0.5 font-medium text-foreground-3">Notes</dt>
                  <dd className="min-w-0 whitespace-pre-wrap break-words leading-relaxed text-foreground-2">
                    {notesTrimmed}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          {(canEditBlock || canDeleteBlock) && (
            <div className="rounded-2xl border border-border bg-white p-3 shadow-sm dark:bg-card md:p-5">
              <Label className="text-sm font-semibold text-foreground-1">Actions</Label>
              <div
                className={cn(
                  "mt-3 flex w-full min-w-0 flex-wrap items-center gap-2",
                  canEditBlock && canDeleteBlock && "justify-between",
                  canEditBlock && !canDeleteBlock && "justify-start",
                  !canEditBlock && canDeleteBlock && "justify-end",
                )}
              >
                {canEditBlock && (
                  <Button
                    variant="outline"
                    size="sm"
                    rounded="full"
                    onClick={onEditBlock}
                    className="group inline-flex !h-8 !min-h-8 shrink-0 items-center gap-1.5 px-3.5 text-xs font-medium"
                  >
                    <Pencil
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors duration-200 group-hover:text-primary group-active:text-primary"
                      aria-hidden
                    />
                    Edit block
                  </Button>
                )}
                {canDeleteBlock && (
                  <Button
                    variant="ghost"
                    size="sm"
                    rounded="full"
                    onClick={onRequestDeleteBlock}
                    className="inline-flex !h-8 !min-h-8 shrink-0 items-center gap-1.5 px-3.5 text-xs font-medium text-destructive hover:bg-destructive/10 focus-visible:ring-focus/60"
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Delete block
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/**
 * Centered modal for block details — same interaction model as the appointment summary dialog.
 */
export const BlockSummaryDialogShell: FC<BlockSummaryDialogShellProps> = ({
  open,
  onOpenChange,
  trigger,
  preventDismiss,
  ...panelProps
}) => {
  const blockFormOpen = useSelector(getBlockFormOpen);
  const locked = blockFormOpen || !!preventDismiss;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next && locked) return;
      onOpenChange(next);
    },
    [onOpenChange, locked],
  );

  const preventWhenLocked = useCallback(
    (e: Event) => { if (locked) e.preventDefault(); },
    [locked],
  );

  return (
    <Dialog open={open} modal={false} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogPortal>
        <div
          className="fixed inset-0 z-[70] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          data-state={open ? "open" : "closed"}
          onClick={() => { if (!locked) onOpenChange(false); }}
        />
        <DialogPrimitive.Content
          onPointerDownOutside={preventWhenLocked}
          onInteractOutside={preventWhenLocked}
          onEscapeKeyDown={preventWhenLocked}
          className={blockSummaryDialogContentClassName}
        >
          <BlockSummaryPopoverPanel {...panelProps} />
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
