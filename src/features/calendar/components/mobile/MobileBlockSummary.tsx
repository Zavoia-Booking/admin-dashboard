import { type FC, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
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

interface MobileBlockSummaryProps {
  /** Active block to show. `null` keeps the drawer closed. */
  block: CalendarBlockDto | null;
  onClose: () => void;
  locationStaff: CalendarStaffMember[];
  timezone?: string;
}

/**
 * Controlled "tap a block" drawer — used by both the mobile day list and
 * day grid views so the summary, edit path, and delete confirm behave
 * identically regardless of how the block was tapped.
 */
export const MobileBlockSummary: FC<MobileBlockSummaryProps> = ({
  block,
  onClose,
  locationStaff,
  timezone,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation("calendar");
  const isTeamMember = useSelector(selectIsTeamMember);
  const currentUserId = useSelector(selectCurrentUserId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEditBlock = useCallback(() => {
    if (!block) return;
    dispatch(setBlockFormEditingAction(block));
    dispatch(toggleBlockFormAction(true));
  }, [dispatch, block]);

  const handleDelete = useCallback(() => {
    if (!block) return;
    dispatch(deleteCalendarBlock.request(block.id));
    setShowDeleteConfirm(false);
    onClose();
  }, [dispatch, block, onClose]);

  if (!block) return null;

  const {
    customTitle,
    staffName,
  } = getBlockDisplayData(block, locationStaff, timezone, t);

  const canEditBlock =
    !isTeamMember ||
    (block.blockScope === "staff" &&
      block.userId != null &&
      block.userId === currentUserId);
  const canDeleteBlock = canEditBlock;

  const scopeLabel = getBlockScopeLabel(block.blockScope, t);

  return (
    <>
      <BlockSummaryDialogShell
        open
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        preventDismiss={showDeleteConfirm}
        /* Controlled externally — trigger is a no-op placeholder. */
        trigger={<span aria-hidden style={{ display: "none" }} />}
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
