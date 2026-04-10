import type { FC } from "react";
import { useTranslation } from "react-i18next";
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
}) => {
  const { t } = useTranslation("calendar");
  return (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {isConflictOverride ? t("page.override.confirmReschedule") : t("page.override.outsideBusinessHours")}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {isConflictOverride
            ? t("page.override.conflictDescription")
            : t("page.override.outOfHoursDescription")}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="py-2">
        <Label htmlFor={inputId} className="text-xs text-muted-foreground">{t("page.override.reasonLabel")}</Label>
        <Input
          id={inputId}
          placeholder={t("page.override.reasonPlaceholder")}
          value={reasonText}
          onChange={(e) => onReasonChange(e.target.value)}
          className="mt-1"
        />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onCancel}>
          {t("page.override.cancel")}
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            e.preventDefault();
            onConfirm();
          }}
        >
          {t("page.override.rescheduleAnyway")}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  );
};
