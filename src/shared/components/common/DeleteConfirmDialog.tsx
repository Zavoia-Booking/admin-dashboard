import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "../ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { AlertTriangle, XCircle } from "lucide-react";
import type { DeleteConfirmDialogProps, DeleteResponse } from "../../types/delete-response";
import { cn } from "../../lib/utils";

const resourceLabels: Record<string, { singular: string; plural: string }> = {
  location: { singular: "location", plural: "locations" },
  service: { singular: "service", plural: "services" },
  team_member: { singular: "team member", plural: "team members" },
  bundle: { singular: "bundle", plural: "bundles" },
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  resourceType,
  resourceName,
  deleteResponse,
  onConfirm,
  isLoading = false,
  secondaryActions,
  className,
  overlayClassName,
}: DeleteConfirmDialogProps) {
  const labels = resourceLabels[resourceType] || {
    singular: "resource",
    plural: "resources",
  };

  // Show loading state if no response yet
  const isCheckingDependencies = !deleteResponse;

  const {
    canDelete,
    usersCount,
    servicesCount,
    appointmentsCount,
    locationsCount,
    teamMembersCount,
    activeUsersCount,
    pendingUsersCount,
    isVisibleInMarketplace,
  } = (deleteResponse || {}) as Partial<DeleteResponse>;

  // Build dynamic dependency list
  const dependencies: { count: number; label: string; isPending?: boolean }[] = [];

  if (usersCount && usersCount > 0) {
    dependencies.push({ count: usersCount, label: usersCount === 1 ? "user" : "users" });
  }
  if (activeUsersCount && activeUsersCount > 0) {
    dependencies.push({ count: activeUsersCount, label: activeUsersCount === 1 ? "active team member" : "active team members" });
  }
  if (pendingUsersCount && pendingUsersCount > 0) {
    dependencies.push({ count: pendingUsersCount, label: pendingUsersCount === 1 ? "pending team member invitation" : "pending team member invitations", isPending: true });
  }
  if (servicesCount && servicesCount > 0) {
    dependencies.push({ count: servicesCount, label: servicesCount === 1 ? "service" : "services" });
  }
  if (appointmentsCount && appointmentsCount > 0) {
    dependencies.push({ count: appointmentsCount, label: appointmentsCount === 1 ? "appointment" : "appointments" });
  }
  if (locationsCount && locationsCount > 0) {
    dependencies.push({ count: locationsCount, label: locationsCount === 1 ? "location" : "locations" });
  }
  if (teamMembersCount && teamMembersCount > 0) {
    dependencies.push({ count: teamMembersCount, label: teamMembersCount === 1 ? "team member" : "team members" });
  }

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing during loading
    if (!newOpen && isLoading) {
      return;
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay className={cn(overlayClassName)} />
        <DialogPrimitive.Content
          className={cn(
            "bg-surface border-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
            className
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
        {isCheckingDependencies ? (
          // Loading state while checking dependencies
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground-1">
                Checking dependencies...
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-foreground-3">
                Verifying if this {labels.singular} can be deleted...
              </p>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {canDelete ? (
                    <div className="rounded-full bg-warning-bg p-2 border border-warning-border">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                    </div>
                  ) : (
                    <div className="rounded-full bg-error-bg p-2 border border-error-border">
                      <XCircle className="h-5 w-5 text-error" />
                    </div>
                  )}
                  <DialogTitle className="text-foreground-1">
                    {canDelete ? `Delete ${labels.singular}?` : `Cannot delete ${labels.singular}`}
                  </DialogTitle>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground-3 hover:text-foreground-1 hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border"
                >
                  <span className="sr-only">Close</span>
                </button>
              </div>
            </DialogHeader>

        {/* Main question / explanation row */}
        <div className="text-foreground-2 text-sm">
          {canDelete ? (
            <div className="space-y-1 text-left">
              <p>
                Are you sure you want to delete{" "}
                <span className="font-semibold text-foreground-1">
                  {resourceName}
                </span>
                ?
              </p>
              <p>This action cannot be undone.</p>
            </div>
          ) : (
            <p>
              You cannot delete{" "}
              <span className="font-semibold text-foreground-1">
                {resourceName}
              </span>{" "}
              because it has associated dependencies.
            </p>
          )}
        </div>

        {!canDelete && dependencies.length > 0 && (
          <div className="rounded-lg bg-info-bg border border-info-border p-4">
            <h4 className="text-sm font-semibold text-info mb-2">
              This {labels.singular} is currently used by:
            </h4>
            <ul className="space-y-1.5">
              {dependencies.map((dep, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-foreground-2"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-info mt-1.5 flex-shrink-0" />
                  <span>
                    <span className="font-semibold text-foreground-1">
                      {dep.count}
                    </span>{" "}
                    {dep.label}
                    {dep.isPending && (
                      <span className="block text-xs text-foreground-3 mt-0.5">
                        Cancel the invitation{dep.count > 1 ? 's' : ''} before removing this {labels.singular}
                      </span>
                    )}
                  </span>
                </li>
              ))}
              {isVisibleInMarketplace && (
                <li className="flex items-center gap-2 text-sm text-foreground-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-info" />
                  <span>
                    <span className="font-semibold text-foreground-1">
                      Visible in the Marketplace
                    </span>
                  </span>
                </li>
              )}
            </ul>
            <p className="mt-3 text-sm text-foreground-3">
              Please remove or reassign these dependencies before deleting this{" "}
              {labels.singular}.
            </p>
          </div>
        )}

        <DialogFooter>
          {canDelete ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                tabIndex={-1}
              >
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                disabled={isLoading}
                className="bg-error hover:bg-error-border text-white border-0"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </Button>
            </>
          ) : (
            <>
              {secondaryActions?.map((action: { label: string; onClick: () => void }) => (
                <Button
                  key={action.label}
                  onClick={action.onClick}
                  disabled={isLoading}
                  className="bg-primary text-white hover:bg-primary-hover"
                >
                  {action.label}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </>
          )}
        </DialogFooter>
          </>
        )}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

