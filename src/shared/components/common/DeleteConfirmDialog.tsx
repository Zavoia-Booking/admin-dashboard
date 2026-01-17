import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from "../ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, XCircle, X } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DashedDivider } from "./DashedDivider";
import type {
  DeleteConfirmDialogProps,
  DeleteResponse,
} from "../../types/delete-response";
import { cn } from "../../lib/utils";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("common");

  // Keep a local copy of the delete response to prevent loader flicker during close animation
  const [localDeleteResponse, setLocalDeleteResponse] = useState(deleteResponse);

  useEffect(() => {
    if (open) {
      setLocalDeleteResponse(deleteResponse);
    }
  }, [open, deleteResponse]);

  const getResourceLabel = (count: number, type: string) => {
    // Map resourceType to locale key (handle team_member -> team_member, etc.)
    const localeKey = count === 1 ? type : `${type}s`;
    const key = `deleteConfirmDialog.resourceTypes.${localeKey}`;
    const translated = t(key);
    // If translation returns the key itself, fallback to a readable default
    if (translated === key) {
      return count === 1
        ? type.replace("_", " ")
        : `${type.replace("_", " ")}s`;
    }
    return translated;
  };

  const getResourceTitle = (type: string) => {
    const key = `deleteConfirmDialog.resourceTypes.${type}Title`;
    const translated = t(key);
    // If translation returns the key itself, fallback to capitalized resource label
    if (translated === key) {
      const label = getResourceLabel(1, type);
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
    return translated;
  };

  const resourceLabelSingular = getResourceLabel(1, resourceType);
  const resourceTitle = getResourceTitle(resourceType);

  // Show loading state if no response yet
  const isCheckingDependencies = !localDeleteResponse;

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
  } = (localDeleteResponse || {}) as Partial<DeleteResponse>;

  // Build dynamic dependency list
  const dependencies: {
    count: number;
    label: string;
    isPending?: boolean;
    isTeamMember?: boolean;
    isLocation?: boolean;
  }[] = [];

  if (usersCount && usersCount > 0) {
    dependencies.push({
      count: usersCount,
      label: t(
        `deleteConfirmDialog.dependencies.${
          usersCount === 1 ? "user" : "users"
        }`
      ),
    });
  }
  if (activeUsersCount && activeUsersCount > 0) {
    dependencies.push({
      count: activeUsersCount,
      label: t(
        `deleteConfirmDialog.dependencies.${
          activeUsersCount === 1 ? "activeTeamMember" : "activeTeamMembers"
        }`
      ),
      isTeamMember: true,
    });
  }
  if (pendingUsersCount && pendingUsersCount > 0) {
    dependencies.push({
      count: pendingUsersCount,
      label: t(
        `deleteConfirmDialog.dependencies.${
          pendingUsersCount === 1
            ? "pendingTeamMemberInvitation"
            : "pendingTeamMemberInvitations"
        }`
      ),
      isPending: true,
      isTeamMember: true,
    });
  }
  if (servicesCount && servicesCount > 0) {
    dependencies.push({
      count: servicesCount,
      label: t(
        `deleteConfirmDialog.dependencies.${
          servicesCount === 1 ? "service" : "services"
        }`
      ),
    });
  }
  if (appointmentsCount && appointmentsCount > 0) {
    dependencies.push({
      count: appointmentsCount,
      label: t(
        `deleteConfirmDialog.dependencies.${
          appointmentsCount === 1 ? "appointment" : "appointments"
        }`
      ),
    });
  }
  if (locationsCount && locationsCount > 0) {
    dependencies.push({
      count: locationsCount,
      label: t(
        `deleteConfirmDialog.dependencies.${
          locationsCount === 1 ? "location" : "locations"
        }`
      ),
      isLocation: true,
    });
  }
  if (teamMembersCount && teamMembersCount > 0) {
    dependencies.push({
      count: teamMembersCount,
      label: t(
        `deleteConfirmDialog.dependencies.${
          teamMembersCount === 1 ? "teamMember" : "teamMembers"
        }`
      ),
      isTeamMember: true,
    });
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
            "bg-surface border-border dark:border-border-subtle data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg cursor-default",
            className
          )}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            // Focus the primary action button instead of the close X button
            const target = e.currentTarget as HTMLElement;
            if (target) {
              const footer = target.querySelector('[data-slot="dialog-footer"]');
              if (footer) {
                const buttons = Array.from(footer.querySelectorAll('button'));
                // Find the primary button (Confirm/Delete) which is typically the last one
                const primaryButton = buttons.length > 1 ? buttons[buttons.length - 1] : buttons[0];
                if (primaryButton instanceof HTMLElement) {
                  primaryButton.focus();
                }
              }
            }
          }}
        >
          {isCheckingDependencies ? (
            // Loading state while checking dependencies
            <>
              <DialogHeader className="space-y-4 text-left pr-6 cursor-default">
                <DialogTitle className="text-lg md:text-xl font-semibold text-foreground-1 cursor-default">
                  {t("deleteConfirmDialog.loading.title")}
                </DialogTitle>
                {/* Add a visually hidden description for accessibility during loading */}
                <DialogDescription className="sr-only">
                  {t("deleteConfirmDialog.loading.description", {
                    resourceType: resourceLabelSingular,
                  })}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-foreground-3 dark:text-foreground-2 cursor-default">
                  {t("deleteConfirmDialog.loading.description", {
                    resourceType: resourceLabelSingular,
                  })}
                </p>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
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
                <span className="sr-only">
                  {t("deleteConfirmDialog.close")}
                </span>
              </button>
              <DialogHeader className="space-y-4 text-left pr-6 cursor-default">
                <div className="flex items-end gap-3">
                  {canDelete ? (
                    <AlertTriangle className="h-6 w-6 text-warning flex-shrink-0 cursor-default mb-0.5" />
                  ) : (
                    <XCircle className="h-6 w-6 text-error flex-shrink-0 cursor-default mb-0.5" />
                  )}
                  <div className="space-y-2 cursor-default flex-1 min-w-0">
                    <DialogTitle className="text-lg md:text-xl font-semibold text-foreground-1 cursor-default">
                      {canDelete
                        ? t("deleteConfirmDialog.canDelete.title", {
                            resourceName,
                          })
                        : t("deleteConfirmDialog.cannotDelete.title", {
                            resourceType: resourceTitle,
                          })}
                    </DialogTitle>
                  </div>
                </div>
              </DialogHeader>

              {/* Main question / explanation row */}
              <DialogDescription asChild className="text-sm text-foreground-3 dark:text-foreground-2 cursor-default">
                <div className="text-left">
                  {canDelete ? (
                    t("deleteConfirmDialog.canDelete.description", {
                      resourceType: resourceLabelSingular,
                    })
                  ) : (
                    <>
                      {t("deleteConfirmDialog.cannotDelete.descriptionPrefix")}{" "}
                      <span className="font-semibold text-foreground-1">
                        {resourceName}
                      </span>{" "}
                      {t("deleteConfirmDialog.cannotDelete.descriptionSuffix")}
                    </>
                  )}
                </div>
              </DialogDescription>

              {!canDelete && dependencies.length > 0 && (
                <>
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {dependencies.map((dep, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className={cn(
                            "text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 border",
                            dep.isTeamMember
                              ? "bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800"
                              : dep.isLocation
                              ? "bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800"
                              : "bg-info/20 dark:bg-info/60 border-border dark:border-border-subtle"
                          )}
                        >
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full",
                              dep.isTeamMember
                                ? "bg-purple-500"
                                : dep.isLocation
                                ? "bg-blue-500"
                                : "bg-info"
                            )}
                          />
                          <span className="font-semibold text-neutral-900 dark:text-foreground-1">
                            {dep.count}
                          </span>
                          <span className="text-neutral-900 dark:text-foreground-1">
                            {dep.label}
                          </span>
                        </Badge>
                      ))}
                      {isVisibleInMarketplace && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 bg-info/20 dark:bg-info/60 border border-border dark:border-border-subtle"
                        >
                          <div className="h-2 w-2 rounded-full bg-info" />
                          <span className="text-neutral-900 dark:text-foreground-1">
                            {t(
                              "deleteConfirmDialog.cannotDelete.visibleInMarketplace"
                            )}
                          </span>
                        </Badge>
                      )}
                    </div>
                    {dependencies.some((dep) => dep.isPending) && (
                      <div className="mt-3 space-y-1">
                        {dependencies
                          .filter((dep) => dep.isPending)
                          .map((dep, index) => (
                            <p
                              key={index}
                              className="text-xs text-foreground-3 dark:text-foreground-2"
                            >
                              {t(
                                "deleteConfirmDialog.dependencies.cancelInvitationHint",
                                {
                                  plural: dep.count > 1 ? "s" : "",
                                  resourceType: resourceLabelSingular,
                                }
                              )}
                            </p>
                          ))}
                      </div>
                    )}
                    <p className="mt-3 text-sm text-foreground-3 dark:text-foreground-2">
                      {t("deleteConfirmDialog.cannotDelete.footer", {
                        resourceType: resourceLabelSingular,
                      })}
                    </p>
                  </div>
                </>
              )}
              {!canDelete && (
                <DashedDivider marginTop="mt-0" paddingTop="pt-0" />
              )}

              <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2 sm:justify-end">
                {canDelete ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isLoading}
                      className="rounded-full h-11 px-6 border-border bg-surface-hover hover:bg-surface-active text-foreground-1 font-medium cursor-pointer"
                    >
                      {t("deleteConfirmDialog.canDelete.cancel")}
                    </Button>
                    <Button
                      onClick={onConfirm}
                      disabled={isLoading}
                      className="rounded-full h-11 px-6 font-semibold cursor-pointer bg-error hover:bg-error-border text-white border-0"
                    >
                      {isLoading
                        ? t("deleteConfirmDialog.canDelete.deleting")
                        : t("deleteConfirmDialog.canDelete.delete", {
                            resourceType: resourceLabelSingular,
                          })}
                    </Button>
                  </>
                ) : (
                  <>
                    {secondaryActions?.find(
                      (action) => action.label === "Go to Assignments"
                    ) ? (
                      <Button
                        onClick={() => {
                          const assignmentsAction = secondaryActions.find(
                            (action) => action.label === "Go to Assignments"
                          );
                          if (assignmentsAction) {
                            assignmentsAction.onClick();
                          }
                        }}
                        disabled={isLoading}
                        className="rounded-full h-11 px-6 font-semibold cursor-pointer bg-primary text-white hover:bg-primary-hover"
                      >
                        {t(
                          "deleteConfirmDialog.cannotDelete.manageAssignments"
                        )}
                      </Button>
                    ) : null}
                    {secondaryActions
                      ?.filter((action) => action.label !== "Go to Assignments")
                      .map((action: { label: string; onClick: () => void }) => (
                        <Button
                          key={action.label}
                          onClick={action.onClick}
                          disabled={isLoading}
                          className="rounded-full h-11 px-6 font-semibold cursor-pointer bg-primary text-white hover:bg-primary-hover"
                        >
                          {action.label}
                        </Button>
                      ))}
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isLoading}
                      className="rounded-full h-11 px-6 border-border bg-surface-hover hover:bg-surface-active text-foreground-1 font-medium cursor-pointer"
                    >
                      {t("deleteConfirmDialog.cannotDelete.cancel")}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
