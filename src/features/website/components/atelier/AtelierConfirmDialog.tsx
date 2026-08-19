import ConfirmDialog, {
  type ConfirmDialogProps,
} from "../../../../shared/components/common/ConfirmDialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "../../../../shared/components/ui/drawer";
import { Button } from "../../../../shared/components/ui/button";
import { useAtelierCompactLayout } from "./useAtelierCompactLayout";

/**
 * Web Studio confirmations: the shared ConfirmDialog on wide layouts, a bottom sheet on
 * compact/native — same rule as the unsaved-changes guard and the rest of the atelier.
 */
export function AtelierConfirmDialog(props: ConfirmDialogProps) {
  const isCompact = useAtelierCompactLayout();
  if (!isCompact) return <ConfirmDialog {...props} />;

  const {
    open,
    onConfirm,
    onCancel,
    onOpenChange,
    title,
    description,
    confirmTitle,
    cancelTitle,
    confirmDisabled = false,
    confirmBusy = false,
    variant = "default",
    icon: Icon,
  } = props;
  const isConfirmDisabled = confirmDisabled || confirmBusy;

  const handleConfirm = () => {
    if (isConfirmDisabled) return;
    onConfirm();
    onOpenChange?.(false);
  };
  const handleCancel = () => {
    onCancel();
    onOpenChange?.(false);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next && !confirmBusy) handleCancel();
      }}
      dismissible={!confirmBusy}
      autoFocus
      repositionInputs={false}
    >
      <DrawerContent
        aria-busy={confirmBusy || undefined}
        overlayClassName="z-[89] bg-[rgb(23_22_20/45%)] backdrop-blur-[2px]"
        className="website-atelier atelier-confirm-sheet z-[90] max-h-[85dvh]"
      >
        <div className="atelier-confirm-sheet__body">
          <div className="atelier-confirm-sheet__header">
            {Icon ? (
              <Icon
                className="atelier-confirm-sheet__icon size-5"
                data-tone={variant}
                aria-hidden
              />
            ) : null}
            <DrawerTitle className="atelier-unsaved-dialog__title">{title}</DrawerTitle>
          </div>
          <DrawerDescription className="atelier-unsaved-dialog__description">
            {description}
          </DrawerDescription>
        </div>

        <div className="atelier-confirm-sheet__footer">
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            loading={confirmBusy}
            className={`atelier-unsaved-dialog__button ${
              variant === "destructive"
                ? "atelier-unsaved-dialog__button--destructive"
                : "atelier-unsaved-dialog__button--primary"
            }`}
          >
            {confirmTitle}
          </Button>
          {cancelTitle !== null ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={confirmBusy}
              className="atelier-unsaved-dialog__button atelier-unsaved-dialog__button--secondary"
            >
              {cancelTitle}
            </Button>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
