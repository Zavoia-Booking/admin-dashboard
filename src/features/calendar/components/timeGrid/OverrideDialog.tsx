import type { FC } from "react";
import { useTranslation } from "react-i18next";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { cn } from "../../../../shared/lib/utils";
import {
  modalScrim,
  modalPanel,
  modalEyebrow,
  modalTitleCompact,
  modalBody,
  modalFooterRowRight,
  modalCancel,
  modalPrimary,
} from "../../../../shared/components/ui/modal-tokens";
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
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={modalScrim} />
        <AlertDialog.Content className={cn(modalPanel, "text-left")}>
          <div className={modalEyebrow}>{t("page.override.rescheduleEyebrow")}</div>
          <AlertDialog.Title className={modalTitleCompact}>
            {isConflictOverride
              ? t("page.override.conflictTitle")
              : t("page.override.outsideBusinessHours")}
          </AlertDialog.Title>
          <AlertDialog.Description asChild>
            <p className={cn(modalBody, "mt-3")}>
              {isConflictOverride
                ? t("page.override.conflictDescription")
                : t("page.override.outOfHoursDescription")}
            </p>
          </AlertDialog.Description>

          <div className="mt-5">
            <Label
              htmlFor={inputId}
              className="text-[13px] font-medium text-neutral-700 dark:text-foreground-2"
            >
              {t("page.override.reasonLabel")}
            </Label>
            <Input
              id={inputId}
              placeholder={t("page.override.reasonPlaceholder")}
              value={reasonText}
              onChange={(e) => onReasonChange(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div className={cn("mt-7", modalFooterRowRight)}>
            <AlertDialog.Cancel asChild>
              <button type="button" onClick={onCancel} className={modalCancel}>
                {t("page.override.cancel")}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onConfirm();
                }}
                className={modalPrimary}
              >
                {t("page.override.rescheduleAnyway")}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};
