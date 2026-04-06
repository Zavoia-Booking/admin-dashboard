import { type FC, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from "../../../shared/components/ui/alert-dialog.tsx";
import type { CalendarBlockDto, CalendarStaffMember } from "../../../shared/types/calendar.ts";
import { deleteCalendarBlock, setBlockFormEditingAction, toggleBlockFormAction } from "../actions.ts";
import { selectIsTeamMember, selectCurrentUserId } from "../../auth/selectors";
import { formatTimeRange, formatDurationHuman } from "./utils.tsx";
import { User, Building2, MapPin, Repeat2 } from "lucide-react";
import { cn } from "../../../shared/lib/utils";
import { StaffAvatarCluster } from "./SlimAppointmentCard.tsx";
import {
  getCalendarBlockReasonIcon,
  getCalendarBlockReasonLabel,
} from "./blockReasonMeta.ts";
import { BlockSummaryDialogShell, getBlockScopeLabel } from "./BlockSummaryPopoverPanel.tsx";

/** Re-export for callers that used the old name (labels match CreateBlockDrawer). */
export { getCalendarBlockReasonLabel as getBlockReasonLabel } from "./blockReasonMeta.ts";
export { getBlockScopeLabel } from "./BlockSummaryPopoverPanel.tsx";

/** Staff / location line (column aligned with appointment “who”). */
function blockStaffColumnLabel(
  scope: string,
  staffName: string | null,
  userId: number | null,
): string {
  switch (scope) {
    case "location":
      return "Entire location";
    case "business":
      return "All locations";
    case "staff":
      return staffName ?? (userId != null ? `Staff #${userId}` : "Unassigned");
    default:
      return scope;
  }
}

/**
 * Block list: reason | title + notes | time … | trailing (7 cols). Tracks from time match SlimAppointmentCard time→end.
 */
const BLOCK_LIST_ROW_GRID_TEMPLATE =
  "minmax(7.2rem, 3fr) minmax(6rem, 3fr) minmax(7rem, 3fr) minmax(7rem, 3fr) minmax(6.5rem, 2.5fr) minmax(6.75rem, 0.85fr) 1rem";

/** Left accent for list rows (blocks are neutral vs. appointment service/staff hues). */
const BLOCK_ROW_ACCENT = "rgb(148 163 184)"; // slate-400

// ─────────────────────────────────────────────────────────────
// BlockCard
// ─────────────────────────────────────────────────────────────

interface BlockCardProps {
  block: CalendarBlockDto;
  locationStaff: CalendarStaffMember[];
  timezone?: string;
}

export const BlockCard: FC<BlockCardProps> = ({ block, locationStaff, timezone }) => {
  const dispatch = useDispatch();
  const isTeamMember = useSelector(selectIsTeamMember);
  const currentUserId = useSelector(selectCurrentUserId);
  const [blockSummaryOpen, setBlockSummaryOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const staffMember =
    block.blockScope === "staff" && block.userId
      ? locationStaff.find((s) => s.id === block.userId)
      : null;
  const staffName = staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : null;

  const canEditBlock =
    !isTeamMember ||
    (block.blockScope === "staff" && block.userId != null && block.userId === currentUserId);
  const canDeleteBlock = canEditBlock;

  const timeDisplay = block.isAllDay ? "All day" : formatTimeRange(block.startsAt, block.endsAt, timezone);

  const reasonLabel = getCalendarBlockReasonLabel(block.reason);
  const ReasonIcon = getCalendarBlockReasonIcon(block.reason);
  const customTitle = block.title?.trim() ?? "";
  const scopeLabel = getBlockScopeLabel(block.blockScope);
  const staffColumnLabel = blockStaffColumnLabel(block.blockScope, staffName, block.userId);

  const scopePlainLabel =
    block.blockScope === "location"
      ? "Location-wide"
      : block.blockScope === "staff"
        ? "Staff member"
        : block.blockScope === "business"
          ? "Business-wide"
          : block.blockScope;

  const durationMinutes = block.isAllDay
    ? null
    : Math.max(
      0,
      Math.round(
        (new Date(block.endsAt).getTime() - new Date(block.startsAt).getTime()) / 60000,
      ),
    );
  const durationText = durationMinutes != null ? formatDurationHuman(durationMinutes) : null;
  const notesTrimmed = block.notes?.trim() ?? "";
  const hasTitleOrNotes = Boolean(customTitle || notesTrimmed);

  const handleEditBlock = useCallback(() => {
    dispatch(setBlockFormEditingAction(block));
    dispatch(toggleBlockFormAction(true));
  }, [dispatch, block]);

  const handleDelete = useCallback(() => {
    dispatch(deleteCalendarBlock.request(block.id));
    setShowDeleteConfirm(false);
    setBlockSummaryOpen(false);
  }, [dispatch, block.id]);

  return (
    <>
      <BlockSummaryDialogShell
        open={blockSummaryOpen}
        onOpenChange={setBlockSummaryOpen}
        preventDismiss={showDeleteConfirm}
        trigger={
          <div
            role="button"
            tabIndex={0}
            className={cn(
              "relative grid w-full min-w-0 cursor-pointer items-center gap-x-3 overflow-hidden rounded-xl border border-border bg-white py-2.5 pl-3 pr-3 shadow-sm",
              "transition-all duration-200 hover:border-border-strong hover:shadow-md",
              "dark:bg-neutral-900/30 dark:bg-card",
            )}
            style={{
              borderLeftWidth: 4,
              borderLeftStyle: "solid",
              borderLeftColor: BLOCK_ROW_ACCENT,
              gridTemplateColumns: BLOCK_LIST_ROW_GRID_TEMPLATE,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setBlockSummaryOpen((o) => !o);
              }
            }}
          >
            {/* 1 — Reason pill */}
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex max-w-full shrink-0 items-center gap-1 rounded-full border border-border",
                  "bg-muted/60 px-2 py-1 text-xs font-medium text-foreground-3",
                )}
                title={reasonLabel}
              >
                <ReasonIcon
                  className="h-3.5 w-3.5 shrink-0 text-foreground-1"
                  aria-hidden
                />
                <span className="min-w-0 truncate">{reasonLabel}</span>
              </span>
            </div>

            {/* 2 — Title + notes (notes below title; notes-only when no title; divider only if either is set) */}
            <div
              className={cn(
                "flex min-w-0 flex-col justify-center gap-0.5 py-0.5",
                hasTitleOrNotes && "border-l border-border pl-3",
              )}
            >
              {customTitle ? (
                <span
                  className="min-w-0 truncate text-sm font-semibold leading-tight text-foreground-1"
                  title={customTitle}
                >
                  {customTitle}
                </span>
              ) : null}
              {notesTrimmed ? (
                <span
                  className="min-w-0 truncate text-xs text-foreground-3"
                  title={notesTrimmed}
                >
                  {notesTrimmed}
                </span>
              ) : null}
            </div>

            {/* 3 — Time + duration (same as appointments) */}
            <div className="flex min-w-0 items-center gap-0.5 overflow-hidden border-l border-border pl-3 text-xs font-medium tabular-nums text-foreground-1">
              <span className="truncate">{timeDisplay}</span>
              {durationText ? (
                <span className="shrink-0 text-[11px] font-normal tabular-nums leading-none text-foreground-3">
                  ({durationText})
                </span>
              ) : null}
            </div>

            {/* 4 — Staff (avatar + label, same as appointments) */}
            <div className="flex min-w-0 items-center gap-2 border-l border-border pl-3">
              {block.blockScope === "staff" && block.userId ? (
                staffMember ? (
                  <StaffAvatarCluster
                    staffIds={[block.userId]}
                    staff={locationStaff}
                    maxVisible={2}
                  />
                ) : (
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                )
              ) : block.blockScope === "location" ? (
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className="min-w-0 truncate text-xs text-foreground-3">{staffColumnLabel}</span>
            </div>

            {/* 5 — Scope tier (same column as “Booked via”) */}
            <span className="min-w-0 overflow-hidden border-l border-border pl-3 text-xs text-foreground-3 text-ellipsis whitespace-nowrap">
              {scopePlainLabel}
            </span>

            {/* 6 — Status slot: recurring pill when applicable (appointments show status badge) */}
            <div className="flex min-w-0 justify-end border-l border-border pl-3">
              {block.isRecurring ? (
                <span
                  className={cn(
                    "inline-flex max-w-full min-w-24 justify-center shrink-0 items-center gap-1.5 rounded-full border border-border",
                    "bg-muted/60 px-2 py-1 text-xs font-medium text-foreground-3",
                  )}
                  title="Recurring block"
                >
                  <Repeat2 className="h-3.5 w-3.5 shrink-0 text-foreground-1" aria-hidden />
                  <span className="truncate">Recurring</span>
                </span>
              ) : null}
            </div>

            {/* 7 — Override column (empty for blocks) */}
            <div className="flex min-w-0 justify-center border-l border-border pl-2" />
          </div>
        }
        block={block}
        staffName={staffName}
        locationStaff={locationStaff}
        timezone={timezone}
        canEditBlock={canEditBlock}
        canDeleteBlock={canDeleteBlock}
        onEditBlock={handleEditBlock}
        onRequestDeleteBlock={() => setShowDeleteConfirm(true)}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogPortal>
          <AlertDialogOverlay onClick={() => setShowDeleteConfirm(false)} />
          <AlertDialogPrimitive.Content className="fixed left-4 right-4 top-[50%] z-[100] grid translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:left-[50%] sm:right-auto sm:w-full sm:max-w-lg sm:translate-x-[-50%] rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete block?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the {scopeLabel.toLowerCase()}
                {customTitle ? ` "${customTitle}"` : ""}. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogPrimitive.Content>
        </AlertDialogPortal>
      </AlertDialog>
    </>
  );
};
