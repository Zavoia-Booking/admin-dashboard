import { type FC, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectIsTeamMember, selectCurrentUserId } from "../../../auth/selectors";
import { deleteCalendarBlock, setBlockFormEditingAction, toggleBlockFormAction } from "../../actions.ts";
import type { CalendarBlockDto, CalendarStaffMember } from "../../../../shared/types/calendar.ts";
import { BlockSummaryDialogShell, getBlockScopeLabel } from "../BlockSummaryPopoverPanel.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from "../../../../shared/components/ui/alert-dialog.tsx";
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { getCalendarBlockReasonLabel } from "../blockReasonMeta.ts";

interface BlockDetailPopoverProps {
  block: CalendarBlockDto;
  staffName: string | null;
  locationStaff: CalendarStaffMember[];
  timezone?: string;
  children: React.ReactNode;
}

export const BlockDetailPopover: FC<BlockDetailPopoverProps> = ({ block, staffName, locationStaff, timezone, children }) => {
  const dispatch = useDispatch();
  const isTeamMember = useSelector(selectIsTeamMember);
  const currentUserId = useSelector(selectCurrentUserId);
  const canDeleteBlock = !isTeamMember || (block.blockScope === 'staff' && block.userId != null && block.userId === currentUserId);
  const canEditBlock = canDeleteBlock;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [blockSummaryOpen, setBlockSummaryOpen] = useState(false);

  const handleEditBlock = useCallback(() => {
    dispatch(setBlockFormEditingAction(block));
    dispatch(toggleBlockFormAction(true));
  }, [dispatch, block]);

  const handleRequestDeleteBlock = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

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
        trigger={children}
        block={block}
        staffName={staffName}
        locationStaff={locationStaff}
        timezone={timezone}
        canEditBlock={canEditBlock}
        canDeleteBlock={canDeleteBlock}
        onEditBlock={handleEditBlock}
        onRequestDeleteBlock={handleRequestDeleteBlock}
      />
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogPortal>
          <AlertDialogOverlay onClick={() => setShowDeleteConfirm(false)} />
          <AlertDialogPrimitive.Content className="fixed left-4 right-4 top-[50%] z-[100] grid translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:left-[50%] sm:right-auto sm:w-full sm:max-w-lg sm:translate-x-[-50%] rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete block?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the {getBlockScopeLabel(block.blockScope).toLowerCase()}
                {block.title ? ` "${block.title}"` : ''}.
                This action cannot be undone.
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
