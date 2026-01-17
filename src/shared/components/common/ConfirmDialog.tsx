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
  className?: string;
  headerClassName?: string;
  footerClassName?: string;
  cancelClassName?: string;
  confirmClassName?: string;
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
  className,
  headerClassName,
  footerClassName,
  cancelClassName,
  confirmClassName,
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
      <AlertDialogContent className={cn("bg-surface border-border dark:border-border-subtle sm:max-w-lg cursor-default", className)}>
        {showCloseButton && (
          <button
            type="button"
            onClick={handleCancel}
            className={cn(
              "absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md",
              "text-foreground-2 hover:text-foreground-1",
              "active:bg-surface-active",
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
        <AlertDialogHeader className={cn("space-y-3 text-left pr-6 cursor-default", headerClassName)}>
          <AlertDialogTitle className="text-lg md:text-xl font-semibold text-foreground-1 cursor-default flex items-center gap-3">
            {Icon && (
              <div
                className={cn(
                  "inline-flex items-center justify-center rounded-xl",
                  iconBgColor === "transparent" ? "" : "w-10 h-10",
                  iconBgColor,
                  iconColor.includes("text-") ? "" : iconColor,
                  "cursor-default shrink-0"
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
            <span>{title}</span>
          </AlertDialogTitle>
          <AlertDialogDescription className={cn("text-sm py-1 text-foreground-3 dark:text-foreground-2 cursor-default", !description && "sr-only")}>
            {description || title}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={cn("flex-col-reverse sm:flex-row gap-2 sm:gap-2 sm:justify-end", footerClassName)}>
          <AlertDialogCancel
            onClick={handleCancel}
            className={cn("rounded-full h-11 px-6 border-border bg-surface-hover hover:bg-surface-active text-foreground-1 font-medium cursor-pointer", cancelClassName)}
          >
            {cancelTitle || `Cancel`}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={cn(
              "rounded-full h-11 px-6 font-semibold cursor-pointer",
              isDestructive
                ? "bg-destructive hover:bg-destructive/90 text-white"
                : "bg-primary hover:bg-primary-hover text-white",
              confirmClassName
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
