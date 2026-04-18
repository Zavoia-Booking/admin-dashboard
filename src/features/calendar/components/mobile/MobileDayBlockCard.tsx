import { type FC, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Building2, MapPin, Repeat2, User } from "lucide-react";
import type {
  CalendarBlockDto,
  CalendarStaffMember,
} from "../../../../shared/types/calendar";
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
} from "../../../../shared/components/ui/alert-dialog";
import {
  deleteCalendarBlock,
  setBlockFormEditingAction,
  toggleBlockFormAction,
} from "../../actions";
import { selectIsTeamMember, selectCurrentUserId } from "../../../auth/selectors";
import { getBlockDisplayData } from "../blockDisplay";
import {
  BlockSummaryDialogShell,
  getBlockScopeLabel,
} from "../BlockSummaryPopoverPanel";
import { StaffAvatarCluster } from "../SlimAppointmentCard";
import { cn } from "../../../../shared/lib/utils";

const BLOCK_ACCENT = "rgb(148 163 184)"; // slate-400 — same as desktop

interface MobileDayBlockCardProps {
  block: CalendarBlockDto;
  locationStaff: CalendarStaffMember[];
  timezone?: string;
}

/**
 * Mobile block list card — mirrors desktop `BlockCard` logic: tapping opens
 * `BlockSummaryDialogShell` (which renders as a bottom Drawer on mobile). The
 * summary's Edit button dispatches the form open; delete runs through an
 * AlertDialog confirm. No short-circuit directly to the edit form.
 */
export const MobileDayBlockCard: FC<MobileDayBlockCardProps> = ({
  block,
  locationStaff,
  timezone,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation("calendar");
  const isTeamMember = useSelector(selectIsTeamMember);
  const currentUserId = useSelector(selectCurrentUserId);
  const [blockSummaryOpen, setBlockSummaryOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    ReasonIcon,
    reasonLabel,
    customTitle,
    notesTrimmed,
    timeDisplay,
    durationText,
    staffMember,
    staffName,
    scopeStaffLabel,
    scopeTierLabel,
  } = getBlockDisplayData(block, locationStaff, timezone, t);

  const canEditBlock =
    !isTeamMember ||
    (block.blockScope === "staff" &&
      block.userId != null &&
      block.userId === currentUserId);
  const canDeleteBlock = canEditBlock;

  const scopeLabel = getBlockScopeLabel(block.blockScope, t);

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
              "w-full text-left rounded-xl border border-border bg-white dark:bg-neutral-900/30 dark:bg-card",
              "shadow-sm active:scale-[0.98] transition-all duration-150",
              "overflow-hidden cursor-pointer",
            )}
            style={{
              borderLeftWidth: 4,
              borderLeftStyle: "solid",
              borderLeftColor: BLOCK_ACCENT,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setBlockSummaryOpen((o) => !o);
              }
            }}
          >
            <div className="flex flex-col gap-1.5 px-3 py-2.5">
              {/* Row 1: time + duration (left) · reason pill + optional recurring icon (right) */}
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-baseline gap-1 min-w-0">
                  <span className="text-xs font-medium text-foreground-1 tabular-nums">
                    {timeDisplay}
                  </span>
                  {durationText && (
                    <span className="text-[11px] text-foreground-3 tabular-nums shrink-0">
                      ({durationText})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-foreground-3"
                    title={reasonLabel}
                  >
                    <ReasonIcon className="h-3 w-3 shrink-0 text-foreground-1" aria-hidden />
                    <span className="truncate">{reasonLabel}</span>
                  </span>
                  {block.isRecurring && (
                    <span
                      className="inline-flex shrink-0"
                      title={t("page.blocks.recurringBlock")}
                      aria-label={t("page.blocks.recurringBlock")}
                    >
                      <Repeat2 className="h-3.5 w-3.5 text-foreground-3" aria-hidden />
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: title (+ notes below) */}
              {(customTitle || notesTrimmed) && (
                <div className="flex flex-col gap-0.5 min-w-0">
                  {customTitle && (
                    <span
                      className="min-w-0 truncate text-sm font-semibold leading-tight text-foreground-1"
                      title={customTitle}
                    >
                      {customTitle}
                    </span>
                  )}
                  {notesTrimmed && (
                    <span
                      className="text-[11px] leading-snug text-muted-foreground truncate"
                      title={notesTrimmed}
                    >
                      {notesTrimmed}
                    </span>
                  )}
                </div>
              )}

              {/* Row 3: scope icon + label (left) · scope tier (right) */}
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  {block.blockScope === "staff" && staffMember ? (
                    <StaffAvatarCluster
                      staffIds={[block.userId!]}
                      staff={locationStaff}
                      maxVisible={1}
                    />
                  ) : block.blockScope === "staff" ? (
                    <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  ) : block.blockScope === "location" ? (
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  ) : (
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <span className="text-xs text-foreground-3 truncate min-w-0">
                    {scopeStaffLabel}
                  </span>
                </div>
                <span className="text-[11px] text-foreground-3 shrink-0 truncate max-w-[50%]">
                  {scopeTierLabel}
                </span>
              </div>
            </div>
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
              <AlertDialogTitle>{t("page.blocks.deleteBlock")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("page.blocks.deleteDescription", {
                  scopeLabel: scopeLabel.toLowerCase(),
                  titleSuffix: customTitle ? ` "${customTitle}"` : "",
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("page.blocks.cancelBtn")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t("page.blocks.deleteBtn")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogPrimitive.Content>
        </AlertDialogPortal>
      </AlertDialog>
    </>
  );
};
