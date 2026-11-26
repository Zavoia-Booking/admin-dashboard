import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ConfirmDialogProps } from "../components/common/ConfirmDialog";

interface UseDiscardChangesOptions {
  isOpen: boolean;
  isDirty: boolean | (() => boolean);
  isSaving?: boolean;
  onClose: () => void;
}

export function useDiscardChanges({
  isOpen,
  isDirty,
  isSaving = false,
  onClose,
}: UseDiscardChangesOptions) {
  const { t } = useTranslation("common", { keyPrefix: "confirmDialog.discardChanges" });
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!isOpen) setPendingAction(null);
  }, [isOpen]);

  const allowAction = (action: () => void) => {
    if (!isOpen || isSaving) return false;
    if (!(typeof isDirty === "function" ? isDirty() : isDirty)) return true;

    setPendingAction((pending) => pending ?? action);
    return false;
  };

  const requestAction = (action: () => void) => {
    if (allowAction(action)) action();
  };

  const dialogProps: ConfirmDialogProps = {
    open: isOpen && pendingAction !== null,
    onCancel: () => setPendingAction(null),
    onConfirm: () => {
      setPendingAction(null);
      pendingAction?.();
    },
    confirmDisabled: isSaving,
    title: t("title"),
    description: t("description"),
    cancelTitle: t("keepEditing"),
    confirmTitle: t("confirm"),
    variant: "destructive",
    mobileDrawer: true,
  };

  return {
    canClose: () => allowAction(onClose),
    requestClose: () => requestAction(onClose),
    requestAction,
    dialogProps,
  };
}
