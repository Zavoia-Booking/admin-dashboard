import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog.tsx";
import React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";

export interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenChange?: (open: boolean) => void;
  cancelTitle?: string;
  confirmTitle?: string;
  title: string;
  description: string | React.ReactNode;
  showCloseButton?: boolean;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  variant?: "default" | "destructive";
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  onOpenChange,
  cancelTitle,
  confirmTitle,
  title,
  description,
  showCloseButton = false,
  icon: Icon,
  iconBgColor = "bg-primary/10",
  iconColor = "text-primary",
  variant = "default",
}) => {
  const handleConfirm = () => {
    onConfirm();
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const isDestructive = variant === "destructive";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange || handleCancel}>
      <AlertDialogContent className="bg-surface border-border dark:border-border-subtle sm:max-w-lg cursor-default">
        {showCloseButton && (
          <button
            type="button"
            onClick={handleCancel}
            className={cn(
              "absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md",
              "text-foreground-2 hover:text-foreground-1",
              "hover:bg-surface-hover active:bg-surface-active",
              "transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:pointer-events-none",
              "cursor-pointer"
            )}
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </button>
        )}
        <AlertDialogHeader className="space-y-4 text-left pr-6 cursor-default">
          {Icon && (
            <div
              className={cn(
                "inline-flex items-center justify-center w-12 h-12 rounded-xl",
                iconBgColor,
                iconColor.includes("text-") ? "" : iconColor,
                "cursor-default"
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6",
                  iconColor.includes("text-") ? iconColor : "text-primary"
                )}
              />
            </div>
          )}
          <div className="space-y-2 cursor-default">
            <AlertDialogTitle className="text-lg md:text-xl font-semibold text-foreground-1 cursor-default">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm py-3 text-foreground-3 dark:text-foreground-2 cursor-default">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2 sm:justify-end">
          <AlertDialogCancel
            onClick={handleCancel}
            className="rounded-full h-11 px-6 border-border bg-surface-hover hover:bg-surface-active text-foreground-1 font-medium cursor-pointer"
          >
            {cancelTitle || `Cancel`}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={cn(
              "rounded-full h-11 px-6 font-semibold cursor-pointer",
              isDestructive
                ? "bg-destructive hover:bg-destructive/90 text-white"
                : "bg-primary hover:bg-primary-hover text-white"
            )}
          >
            {confirmTitle || `Confirm`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;
