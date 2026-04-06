import type { FC } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../shared/components/ui/alert-dialog.tsx";
import { Label } from "../../../../shared/components/ui/label.tsx";
import { Input } from "../../../../shared/components/ui/input.tsx";

interface OverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** True when the dialog is for a server-side 409 conflict; false for client-side out-of-hours. */
  isConflictOverride: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  reasonText: string;
  onReasonChange: (text: string) => void;
  /** Unique input id to avoid DOM id collisions when both Day and Week grids exist. */
  inputId: string;
}

export const OverrideDialog: FC<OverrideDialogProps> = ({
  open,
  onOpenChange,
  isConflictOverride,
  onConfirm,
  onCancel,
  reasonText,
  onReasonChange,
  inputId,
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {isConflictOverride ? "Confirm reschedule" : "Outside business hours"}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {isConflictOverride
            ? "This time has a scheduling conflict. Do you want to reschedule anyway? You can add an optional reason below."
            : "This time is outside business hours. Are you sure you want to reschedule? You can add an optional reason below."}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="py-2">
        <Label htmlFor={inputId} className="text-xs text-muted-foreground">Reason (optional)</Label>
        <Input
          id={inputId}
          placeholder="e.g. Customer request"
          value={reasonText}
          onChange={(e) => onReasonChange(e.target.value)}
          className="mt-1"
        />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onCancel}>
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            e.preventDefault();
            onConfirm();
          }}
        >
          Reschedule anyway
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
