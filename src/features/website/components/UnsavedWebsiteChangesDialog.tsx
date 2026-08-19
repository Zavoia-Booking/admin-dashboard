import { AlertTriangle, LoaderCircle, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../shared/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "../../../shared/components/ui/drawer";
import { Button } from "../../../shared/components/ui/button";
import { useAtelierCompactLayout } from "./atelier/useAtelierCompactLayout";

interface UnsavedWebsiteChangesDialogProps {
  open: boolean;
  onSaveAndLeave: () => void;
  onDiscardAndLeave: () => void;
  onKeepEditing: () => void;
  saveDisabled: boolean;
  saveBusy: boolean;
  saveLabel?: string;
  saveFeedback?: string | null;
  saveFeedbackTone?: "status" | "error";
  /** Discard is the guaranteed exit: it stays available while a write is in flight (the caller
   * cancels and reconciles it) and is only withheld for a conflict that needs its own decision. */
  discardDisabled?: boolean;
}

/**
 * Website-specific three-way navigation guard. Save deliberately does not close the dialog:
 * useUnsavedChangesBlocker resumes the original route or external action only after the saved
 * baseline is acknowledged. A failed request therefore leaves both the work and destination intact.
 *
 * Compact layouts (phone / native) get the same choices as a bottom sheet — same as the other
 * atelier confirmations — while wider screens keep the centered alert dialog.
 */
export function UnsavedWebsiteChangesDialog({
  open,
  onSaveAndLeave,
  onDiscardAndLeave,
  onKeepEditing,
  saveDisabled,
  saveBusy,
  saveLabel,
  saveFeedback,
  saveFeedbackTone = "status",
  discardDisabled = false,
}: UnsavedWebsiteChangesDialogProps) {
  const { t } = useTranslation("website");
  const isCompact = useAtelierCompactLayout();

  const feedback = saveFeedback ? (
    <p
      className="atelier-unsaved-dialog__feedback"
      data-tone={saveFeedbackTone}
      role={saveFeedbackTone === "error" ? "alert" : "status"}
      aria-live={saveFeedbackTone === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      {saveFeedback}
    </p>
  ) : null;

  const saveButton = (
    <Button
      type="button"
      onClick={onSaveAndLeave}
      disabled={saveDisabled || saveBusy}
      aria-busy={saveBusy || undefined}
      className="atelier-unsaved-dialog__button atelier-unsaved-dialog__button--primary"
    >
      {saveBusy ? (
        <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
      ) : null}
      {saveBusy ? t("page.status.saving") : saveLabel ?? t("page.unsaved.saveAndLeave")}
    </Button>
  );

  const discardButton = (
    <Button
      type="button"
      variant="ghost"
      onClick={onDiscardAndLeave}
      disabled={discardDisabled}
      className="atelier-unsaved-dialog__danger text-destructive hover:bg-destructive/5 hover:text-destructive"
    >
      {t("page.unsaved.discardAndLeave")}
    </Button>
  );

  if (isCompact) {
    return (
      <Drawer
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !saveBusy) onKeepEditing();
        }}
        dismissible={!saveBusy}
        autoFocus
        repositionInputs={false}
      >
        <DrawerContent
          aria-busy={saveBusy || undefined}
          overlayClassName="z-[79] bg-[rgb(23_22_20/45%)] backdrop-blur-[2px]"
          className="website-atelier atelier-confirm-sheet z-[80] max-h-[85dvh]"
        >
          <div className="atelier-confirm-sheet__body">
            <div className="atelier-confirm-sheet__header">
              <AlertTriangle className="atelier-confirm-sheet__icon size-5" aria-hidden />
              <DrawerTitle className="atelier-unsaved-dialog__title">
                {t("page.unsaved.title")}
              </DrawerTitle>
            </div>
            <DrawerDescription className="atelier-unsaved-dialog__description">
              {t("page.unsaved.explicitDescription")}
            </DrawerDescription>
            {feedback}
          </div>

          <div className="atelier-confirm-sheet__footer">
            {saveButton}
            <Button
              type="button"
              variant="outline"
              onClick={onKeepEditing}
              disabled={saveBusy}
              className="atelier-unsaved-dialog__button atelier-unsaved-dialog__button--secondary"
            >
              {t("page.unsaved.keepEditing")}
            </Button>
            {discardButton}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !saveBusy) onKeepEditing();
      }}
    >
      <AlertDialogContent
        aria-busy={saveBusy || undefined}
        overlayClassName="z-[79] bg-[rgb(23_22_20/45%)] backdrop-blur-[2px] duration-200 motion-reduce:duration-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
        className="website-atelier atelier-confirm-dialog atelier-unsaved-dialog left-1/2 right-auto z-[80] w-[calc(100%-2rem)] -translate-x-1/2 cursor-default duration-200 motion-reduce:duration-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 sm:max-w-[520px]"
      >
        <button
          type="button"
          aria-label={t("page.unsaved.closeAndKeepEditing")}
          disabled={saveBusy}
          onClick={onKeepEditing}
          className="website-atelier-focus atelier-unsaved-dialog__close"
        >
          <X className="size-4" aria-hidden />
        </button>

        <div className="atelier-unsaved-dialog__body">
          <AlertDialogHeader className="atelier-unsaved-dialog__header space-y-0 text-left">
            <span className="atelier-unsaved-dialog__icon" aria-hidden>
              <AlertTriangle className="size-[18px]" />
            </span>
            <div className="min-w-0">
              <AlertDialogTitle className="atelier-unsaved-dialog__title">
                {t("page.unsaved.title")}
              </AlertDialogTitle>
              <AlertDialogDescription className="atelier-unsaved-dialog__description">
                {t("page.unsaved.explicitDescription")}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>

          {feedback}
        </div>

        <div className="atelier-unsaved-dialog__footer">
          {discardButton}

          <AlertDialogCancel
            disabled={saveBusy}
            className="atelier-unsaved-dialog__button atelier-unsaved-dialog__button--secondary !mt-0"
          >
            {t("page.unsaved.keepEditing")}
          </AlertDialogCancel>
          {saveButton}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
