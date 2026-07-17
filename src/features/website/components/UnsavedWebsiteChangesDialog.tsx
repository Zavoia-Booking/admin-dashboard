import { AlertTriangle, LoaderCircle, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../shared/components/ui/alert-dialog";
import { Button } from "../../../shared/components/ui/button";

interface UnsavedWebsiteChangesDialogProps {
  open: boolean;
  onSaveAndLeave: () => void;
  onDiscardAndLeave: () => void;
  onKeepEditing: () => void;
  saveDisabled: boolean;
  saveBusy: boolean;
  saveLabel?: string;
  saveFeedback?: string | null;
  /** A server write cannot be undone after it starts, so discard stays unavailable in-flight. */
  discardDisabled?: boolean;
}

/**
 * Website-specific three-way navigation guard. Save deliberately does not close the dialog:
 * useUnsavedChangesBlocker resumes the original route or external action only after the saved
 * baseline is acknowledged. A failed request therefore leaves both the work and destination intact.
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
  discardDisabled = false,
}: UnsavedWebsiteChangesDialogProps) {
  const { t } = useTranslation("website");

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !saveBusy) onKeepEditing();
      }}
    >
      <AlertDialogContent className="website-atelier atelier-confirm-dialog cursor-default border-border bg-surface sm:max-w-lg">
        <AlertDialogCancel
          aria-label={t("page.unsaved.keepEditing")}
          disabled={saveBusy}
          className="website-atelier-focus absolute right-4 top-4 grid size-8 place-items-center rounded-md border-0 bg-transparent p-0 text-foreground-2 shadow-none hover:bg-surface-hover hover:text-foreground-1"
        >
          <X className="size-5" aria-hidden />
        </AlertDialogCancel>

        <AlertDialogHeader className="space-y-3 pr-8 text-left">
          <AlertDialogTitle className="flex items-center gap-3 text-lg font-semibold text-foreground-1 md:text-xl">
            <AlertTriangle className="size-6 shrink-0 text-amber-500" aria-hidden />
            {t("page.unsaved.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-6 text-foreground-3 dark:text-foreground-2">
            {t("page.unsaved.explicitDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {saveFeedback ? (
          <p className="rounded-lg border border-border bg-surface-hover px-3 py-2 text-xs leading-5 text-foreground-2" role="status">
            {saveFeedback}
          </p>
        ) : null}

        <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel
            disabled={saveBusy}
            className="h-11 rounded-full border-border bg-surface-hover px-5 font-medium text-foreground-1 hover:bg-surface-active"
          >
            {t("page.unsaved.keepEditing")}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={onDiscardAndLeave}
            disabled={discardDisabled || saveBusy}
            className="h-11 rounded-full px-5"
          >
            {t("page.unsaved.discardAndLeave")}
          </Button>
          <Button
            type="button"
            onClick={onSaveAndLeave}
            disabled={saveDisabled || saveBusy}
            className="h-11 rounded-full px-5"
          >
            {saveBusy ? (
              <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : null}
            {saveBusy ? t("page.status.saving") : saveLabel ?? t("page.unsaved.saveAndLeave")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
