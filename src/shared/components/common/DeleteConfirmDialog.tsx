import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { AlertTriangle, XCircle } from "lucide-react";
import type { DeleteConfirmDialogProps } from "../../types/delete-response";

const resourceLabels: Record<string, { singular: string; plural: string }> = {
  location: { singular: "location", plural: "locations" },
  service: { singular: "service", plural: "services" },
  team_member: { singular: "team member", plural: "team members" },
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
}: DeleteConfirmDialogProps) {
  const labels = resourceLabels[resourceType] || {
    singular: "resource",
    plural: "resources",
  };

  if (!deleteResponse) return null;

  const {
    canDelete,
    usersCount,
    servicesCount,
    appointmentsCount,
    locationsCount,
    teamMembersCount,
    isVisibleInMarketplace,
  } = deleteResponse;

  // Build dynamic dependency list
  const dependencies: { count: number; label: string }[] = [];

  if (usersCount && usersCount > 0) {
    dependencies.push({ count: usersCount, label: usersCount === 1 ? "user" : "users" });
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
      <DialogContent className="bg-surface border-border" onOpenAutoFocus={(e) => e.preventDefault()}>
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
        <DialogDescription className="text-foreground-2">
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
        </DialogDescription>

        {!canDelete && dependencies.length > 0 && (
          <div className="rounded-lg bg-info-bg border border-info-border p-4">
            <h4 className="text-sm font-semibold text-info mb-2">
              This {labels.singular} is currently used by:
            </h4>
            <ul className="space-y-1.5">
              {dependencies.map((dep, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm text-foreground-2"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-info" />
                  <span>
                    <span className="font-semibold text-foreground-1">
                      {dep.count}
                    </span>{" "}
                    {dep.label}
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
      </DialogContent>
    </Dialog>
  );
}

