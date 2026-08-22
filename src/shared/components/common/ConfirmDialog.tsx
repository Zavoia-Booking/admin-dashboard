import * as AlertDialog from "@radix-ui/react-alert-dialog";
import React from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";
import { Spinner } from "../ui/spinner.tsx";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "../ui/drawer";
import { useIsMobile } from "../../hooks/use-mobile";
import {
  modalScrim,
  modalPanel,
  modalTitleCompact,
  modalBody,
  modalFooterRowRight,
  modalCancel,
  modalPrimary,
  modalDestructive,
} from "../ui/modal-tokens";

export interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenChange?: (open: boolean) => void;
  cancelTitle?: string | null;
  confirmTitle?: string;
  confirmDisabled?: boolean;
  confirmBusy?: boolean;
  title: string;
  description: string | React.ReactNode;
  showCloseButton?: boolean;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  variant?: "default" | "destructive";
  className?: string;
  headerClassName?: string;
  footerClassName?: string;
  cancelClassName?: string;
  confirmClassName?: string;
  /** Render as a bottom sheet under `md` instead of a centred panel. Opt-in so
   *  the ~13 existing call sites keep the modal they were designed around. */
  mobileDrawer?: boolean;
}

/**
 * Shared confirmation dialog. Built on the dashboard `modal-tokens` design language
 * (cream panel, terracotta pills, refined type) so it matches the app's other modals —
 * SubscriptionBlocker, link-business, and the useConfirmRadix panel. The full prop API
 * (icon, close button, busy state, destructive variant, custom class overrides) is kept
 * intact for the ~13 call sites that depend on it.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  onOpenChange,
  cancelTitle,
  confirmTitle,
  confirmDisabled = false,
  confirmBusy = false,
  title,
  description,
  showCloseButton = false,
  icon: Icon,
  iconBgColor = "bg-primary/10",
  iconColor = "text-primary",
  variant = "default",
  className,
  headerClassName,
  footerClassName,
  cancelClassName,
  confirmClassName,
  mobileDrawer = false,
}) => {
  const { t } = useTranslation("common");
  const isMobile = useIsMobile();
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

  const confirmPill = variant === "destructive" ? modalDestructive : modalPrimary;
  const hasBadge = Boolean(Icon) && iconBgColor !== "transparent";

  const iconBadge = Icon && (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        hasBadge && "h-10 w-10 rounded-full",
        hasBadge ? iconBgColor : "",
        iconColor.includes("text-") ? "" : iconColor,
      )}
    >
      <Icon
        className={cn("h-5 w-5", iconColor.includes("text-") ? iconColor : "text-primary")}
        aria-hidden="true"
      />
    </span>
  );

  if (mobileDrawer && isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(next) => {
          if (!next) handleCancel();
        }}
        autoFocus
      >
        {/* Above every other layer, like the modal's z-[300] scrim: a
            confirmation is always the topmost thing on screen, and it is
            routinely raised from inside another drawer or slider. */}
        <DrawerContent
          className={cn(
            "!z-[300] bg-neutral-50 text-neutral-900 dark:bg-surface dark:text-foreground-1",
            "px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-1 text-left",
            className,
          )}
          overlayClassName="!z-[299] bg-[oklch(15%_0.004_70/0.42)]"
        >
          <div className={cn("flex items-start gap-3.5 pt-4", headerClassName)}>
            {iconBadge}
            <div className="min-w-0 flex-1">
              <DrawerTitle className={modalTitleCompact}>{title}</DrawerTitle>
              <DrawerDescription asChild>
                {description ? (
                  <div className={cn(modalBody, "mt-2")}>{description}</div>
                ) : (
                  <span className="sr-only">{title}</span>
                )}
              </DrawerDescription>
            </div>
          </div>

          {/* Stacked full-width actions: thumb-reachable, primary on top. */}
          <div className={cn("mt-6 flex flex-col gap-2", footerClassName)}>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              aria-busy={confirmBusy || undefined}
              className={cn(confirmPill, "w-full", confirmClassName)}
            >
              {confirmBusy ? (
                <Spinner size="sm" color="white" />
              ) : (
                <span>{confirmTitle || "Confirm"}</span>
              )}
            </button>
            {cancelTitle !== null && (
              <button
                type="button"
                onClick={handleCancel}
                className={cn(modalCancel, "w-full", cancelClassName)}
              >
                {cancelTitle || "Cancel"}
              </button>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange || handleCancel}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={modalScrim} />
        <AlertDialog.Content className={cn(modalPanel, "text-left", className)}>
          {showCloseButton && (
            <button
              type="button"
              onClick={handleCancel}
              aria-label={t("aria.close")}
              className={cn(
                "absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg",
                "text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800",
                "dark:text-foreground-3 dark:hover:bg-surface-hover dark:hover:text-foreground-1",
                "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30",
              )}
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className={cn("flex items-start gap-3.5", showCloseButton && "pr-8", headerClassName)}>
            {iconBadge}
            <div className="min-w-0 flex-1">
              <AlertDialog.Title className={modalTitleCompact}>{title}</AlertDialog.Title>
              <AlertDialog.Description asChild>
                {description ? (
                  <div className={cn(modalBody, "mt-2")}>{description}</div>
                ) : (
                  <span className="sr-only">{title}</span>
                )}
              </AlertDialog.Description>
            </div>
          </div>

          <div className={cn("mt-7", modalFooterRowRight, footerClassName)}>
            {cancelTitle !== null && (
              <AlertDialog.Cancel asChild>
                <button
                  type="button"
                  onClick={handleCancel}
                  className={cn(modalCancel, cancelClassName)}
                >
                  {cancelTitle || "Cancel"}
                </button>
              </AlertDialog.Cancel>
            )}
            <AlertDialog.Action asChild>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirmDisabled}
                aria-busy={confirmBusy || undefined}
                className={cn(confirmPill, confirmClassName)}
              >
                {confirmBusy ? (
                  <Spinner size="sm" color="white" />
                ) : (
                  <span>{confirmTitle || "Confirm"}</span>
                )}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

export default ConfirmDialog;
