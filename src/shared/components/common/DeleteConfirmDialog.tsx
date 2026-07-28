import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Spinner } from "../ui/spinner";
import { Badge } from "../ui/badge";
import type {
  DeleteConfirmDialogProps,
  DeleteResponse,
} from "../../types/delete-response";
import { cn } from "../../lib/utils";
import { useTranslation } from "react-i18next";
import {
  modalScrim,
  modalPanel,
  modalTitleCompact,
  modalBody,
  modalBodyMuted,
  modalHelperSmall,
  modalFooterRowRight,
  modalCancel,
  modalPrimary,
  modalDestructive,
} from "../ui/modal-tokens";

/**
 * Delete confirmation dialog. Built on the dashboard `modal-tokens` language (cream panel,
 * terracotta eyebrow, refined type, one hairline seam, tiered pills) so it matches the app's
 * other modals. Handles three states: checking dependencies, can-delete, and blocked (with a
 * dependency list). Full prop API + i18n keys preserved for the 4 call sites.
 */
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

  // While open, trust the fresh prop (callers set it before opening); use the local copy only
  // during the close animation, when the parent has reset deleteResponse to null. This stops the
  // stale local copy from flashing the wrong state (loader / old dependency list) on open.
  const effectiveResponse = open ? deleteResponse ?? localDeleteResponse : localDeleteResponse;

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

  // Loading state only when there is genuinely no response at all (no current flow opens this way).
  const isCheckingDependencies = !effectiveResponse;

  const {
    canDelete,
    usersCount,
    servicesCount,
    appointmentsCount,
    locationsCount,
    teamMembersCount,
    activeUsersCount,
    pendingUsersCount,
    websiteGalleryImagesCount,
  } = (effectiveResponse || {}) as Partial<DeleteResponse>;

  // Build dynamic dependency list
  const dependencies: {
    count: number;
    label: string;
    isPending?: boolean;
    isTeamMember?: boolean;
    isLocation?: boolean;
    isWebsite?: boolean;
  }[] = [];

  if (usersCount && usersCount > 0) {
    dependencies.push({
      count: usersCount,
      label: t(`deleteConfirmDialog.dependencies.${usersCount === 1 ? "user" : "users"}`),
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
      label: t(`deleteConfirmDialog.dependencies.${servicesCount === 1 ? "service" : "services"}`),
    });
  }
  if (appointmentsCount && appointmentsCount > 0) {
    dependencies.push({
      count: appointmentsCount,
      label: t(
        `deleteConfirmDialog.dependencies.${appointmentsCount === 1 ? "appointment" : "appointments"}`
      ),
    });
  }
  if (locationsCount && locationsCount > 0) {
    dependencies.push({
      count: locationsCount,
      label: t(`deleteConfirmDialog.dependencies.${locationsCount === 1 ? "location" : "locations"}`),
      isLocation: true,
    });
  }
  if (teamMembersCount && teamMembersCount > 0) {
    dependencies.push({
      count: teamMembersCount,
      label: t(
        `deleteConfirmDialog.dependencies.${teamMembersCount === 1 ? "teamMember" : "teamMembers"}`
      ),
      isTeamMember: true,
    });
  }
  if (websiteGalleryImagesCount && websiteGalleryImagesCount > 0) {
    dependencies.push({
      count: websiteGalleryImagesCount,
      label: t(
        `deleteConfirmDialog.dependencies.${
          websiteGalleryImagesCount === 1 ? "websiteGalleryPhoto" : "websiteGalleryPhotos"
        }`
      ),
      isWebsite: true,
    });
  }

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing during loading
    if (!newOpen && isLoading) {
      return;
    }
    onOpenChange(newOpen);
  };

  // Secondary actions (blocked state): "Go to Assignments" gets a localized label; others pass through.
  const goToAssignments = secondaryActions?.find((a) => a.label === "Go to Assignments");
  const otherActions = secondaryActions?.filter((a) => a.label !== "Go to Assignments");

  const closeButton = (
    <button
      type="button"
      onClick={() => handleOpenChange(false)}
      aria-label={t("deleteConfirmDialog.close")}
      className={cn(
        "absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg",
        "text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800",
        "dark:text-foreground-3 dark:hover:bg-surface-hover dark:hover:text-foreground-1",
        "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
      )}
    >
      <X className="h-4 w-4" />
    </button>
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={cn(modalScrim, overlayClassName)} />
        <DialogPrimitive.Content
          className={cn(modalPanel, "text-left sm:p-6", className)}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {isCheckingDependencies ? (
            /* Checking dependencies — never reached by the current optimistic flows. */
            <>
              <div className="flex flex-col items-center py-2 text-center">
                <DialogPrimitive.Title asChild>
                  <h2 className={modalTitleCompact}>{t("deleteConfirmDialog.loading.title")}</h2>
                </DialogPrimitive.Title>
                <Spinner size="sm" className="mt-6" />
                <DialogPrimitive.Description asChild>
                  <p className={cn(modalBodyMuted, "mt-4")}>
                    {t("deleteConfirmDialog.loading.description", {
                      resourceType: resourceLabelSingular,
                    })}
                  </p>
                </DialogPrimitive.Description>
              </div>
            </>
          ) : canDelete ? (
            /* Can delete — destructive confirm. */
            <>
              {closeButton}
              <div className="flex items-center gap-2.5 pr-8">
                <AlertTriangle className="h-6 w-6 shrink-0 text-destructive" aria-hidden="true" />
                <DialogPrimitive.Title asChild>
                  <h2 className={modalTitleCompact}>
                    {t("deleteConfirmDialog.canDelete.title", { resourceName })}
                  </h2>
                </DialogPrimitive.Title>
              </div>
              <DialogPrimitive.Description asChild>
                <p className={cn(modalBody, "mt-3")}>
                  {t("deleteConfirmDialog.canDelete.description", {
                    resourceType: resourceLabelSingular,
                  })}
                </p>
              </DialogPrimitive.Description>

              <div className={cn("mt-6", modalFooterRowRight)}>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className={modalCancel}
                >
                  {t("deleteConfirmDialog.canDelete.cancel")}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isLoading}
                  aria-busy={isLoading || undefined}
                  className={modalDestructive}
                >
                  {isLoading ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <span>
                      {t("deleteConfirmDialog.canDelete.delete", {
                        resourceType: resourceLabelSingular,
                      })}
                    </span>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Blocked — explain why, list what depends on it, offer a way to resolve. */
            <>
              {closeButton}
              <div className="flex items-center gap-2.5 pr-8">
                <AlertTriangle className="h-6 w-6 shrink-0 text-warning" aria-hidden="true" />
                <DialogPrimitive.Title asChild>
                  <h2 className={modalTitleCompact}>
                    {t("deleteConfirmDialog.cannotDelete.title", { resourceType: resourceTitle })}
                  </h2>
                </DialogPrimitive.Title>
              </div>
              <DialogPrimitive.Description asChild>
                <p className={cn(modalBody, "mt-3")}>
                  {t("deleteConfirmDialog.cannotDelete.descriptionPrefix")}{" "}
                  <span className="font-semibold text-neutral-900 dark:text-foreground-1">
                    {resourceName}
                  </span>{" "}
                  {t("deleteConfirmDialog.cannotDelete.descriptionSuffix")}
                </p>
              </DialogPrimitive.Description>

              {dependencies.length > 0 && (
                <div className="mt-5">
                  <div className="flex flex-wrap gap-2">
                    {dependencies.map((dep, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className={cn(
                          "text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 border",
                          dep.isWebsite
                            ? "bg-warning-bg border-warning-border hover:bg-warning-bg"
                            : dep.isTeamMember
                            ? "bg-purple-50 border-purple-200 hover:bg-purple-100"
                            : dep.isLocation
                            ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
                            : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                        )}
                      >
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            dep.isWebsite
                              ? "bg-warning"
                              : dep.isTeamMember
                              ? "bg-purple-500"
                              : dep.isLocation
                              ? "bg-blue-500"
                              : "bg-blue-500"
                          )}
                        />
                        <span className="font-semibold text-neutral-900">{dep.count}</span>
                        <span className="text-neutral-900">{dep.label}</span>
                      </Badge>
                    ))}
                  </div>
                  {dependencies.some((dep) => dep.isPending) && (
                    <div className="mt-3 space-y-1">
                      {dependencies
                        .filter((dep) => dep.isPending)
                        .map((dep, index) => (
                          <p key={index} className={modalHelperSmall}>
                            {t("deleteConfirmDialog.dependencies.cancelInvitationHint", {
                              plural: dep.count > 1 ? "s" : "",
                              resourceType: resourceLabelSingular,
                            })}
                          </p>
                        ))}
                    </div>
                  )}
                  <p className={cn(modalHelperSmall, "mt-3")}>
                    {t("deleteConfirmDialog.cannotDelete.footer", {
                      resourceType: resourceLabelSingular,
                    })}
                  </p>
                </div>
              )}

              <div className={cn("mt-6", modalFooterRowRight)}>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className={modalCancel}
                >
                  {t("deleteConfirmDialog.cannotDelete.cancel")}
                </button>
                {goToAssignments && (
                  <button
                    type="button"
                    onClick={goToAssignments.onClick}
                    disabled={isLoading}
                    className={modalPrimary}
                  >
                    {t("deleteConfirmDialog.cannotDelete.manageAssignments")}
                  </button>
                )}
                {otherActions?.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    disabled={isLoading}
                    className={modalPrimary}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
