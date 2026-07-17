import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CircleCheck, CircleDashed, EllipsisVertical, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import type { LocationWithAssignments, WebsiteDraft, WebsiteIdentity } from "../../types";
import {
  saveWebsiteDraftAction,
  publishWebsiteAction,
  unpublishWebsiteAction,
  fetchWebsiteBuilderAction,
  clearWebsiteConflictAction,
} from "../../actions";
import {
  selectWebsiteSaving,
  selectWebsiteLoading,
  selectWebsiteError,
  selectWebsiteHeroMutating,
  selectWebsiteConflict,
  selectWebsiteLastSavedRequestId,
  selectWebsiteSaveFailure,
  selectWebsiteAccess,
  selectWebsitePublish,
  selectWebsitePublishing,
  selectWebsiteUnpublishing,
  selectWebsiteVariantCatalog,
  selectWebsiteSectionCatalog,
  selectWebsiteCatalogLoaded,
  selectWebsitePublishLockedItems,
} from "../../selectors";
import { useWebsiteDraft } from "../../hooks/useWebsiteDraft";
import { useCheckoutReturn } from "../../hooks/useCheckoutReturn";
import { useUnsavedChangesBlocker } from "../../../../shared/hooks/useUnsavedChangesBlocker";
import { useCanWrite } from "../../../../shared/components/common/subscription/useCanWrite";
import { LimitedAccessBanner } from "../../../../shared/components/common/subscription/LimitedAccessBanner";
import { HeaderRightSlot } from "../../../../shared/components/layouts/HeaderRightSlot";
import { useIsMobile } from "../../../../shared/hooks/use-mobile";
import ConfirmDialog from "../../../../shared/components/common/ConfirmDialog";
import { Button } from "../../../../shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../shared/components/ui/dropdown-menu";
import { Spinner } from "../../../../shared/components/ui/spinner";
import { WebsiteLegacyBuilderCore } from "./WebsiteLegacyBuilderCore";
import {
  localizeWebsiteSectionCatalog,
  localizeWebsiteVariantCatalog,
} from "../builder/catalogCopy";

interface WebsiteLegacyWorkspaceProps {
  identity: WebsiteIdentity;
  draft: WebsiteDraft;
  locations: LocationWithAssignments[];
  businessId: number | string | null;
}

/**
 * The Website workspace shell: page status (draft save state + last saved time + publish
 * state), the Save and Publish actions, the 409-conflict resolution dialog, the route-aware
 * unsaved-changes guard, and the checkout-return reconciliation — around the builder
 * editing surface.
 *
 * Save persists the DRAFT only. Publish (tier-2 only, enforced server-side) freezes the
 * saved draft into the snapshot the public site serves; a dirty form saves first, then
 * publishes (one click). Unpublish takes the site offline but keeps the snapshot.
 */
export function WebsiteLegacyWorkspace({ identity, draft, locations, businessId }: WebsiteLegacyWorkspaceProps) {
  const { t, i18n } = useTranslation("website");
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const canWrite = useCanWrite();
  const isSaving = useSelector(selectWebsiteSaving);
  const isLoading = useSelector(selectWebsiteLoading);
  const loadError = useSelector(selectWebsiteError);
  const isHeroMutating = useSelector(selectWebsiteHeroMutating);
  const conflict = useSelector(selectWebsiteConflict);
  const lastSavedRequestId = useSelector(selectWebsiteLastSavedRequestId);
  const saveFailure = useSelector(selectWebsiteSaveFailure);
  const websiteAccess = useSelector(selectWebsiteAccess);
  const publish = useSelector(selectWebsitePublish);
  const isPublishing = useSelector(selectWebsitePublishing);
  const isUnpublishing = useSelector(selectWebsiteUnpublishing);
  const rawVariantCatalog = useSelector(selectWebsiteVariantCatalog);
  const rawSectionCatalog = useSelector(selectWebsiteSectionCatalog);
  const variantCatalog = useMemo(
    () => localizeWebsiteVariantCatalog(rawVariantCatalog, t),
    [rawVariantCatalog, t],
  );
  const sectionCatalog = useMemo(
    () => localizeWebsiteSectionCatalog(rawSectionCatalog, t),
    [rawSectionCatalog, t],
  );
  const catalogLoaded = useSelector(selectWebsiteCatalogLoaded);
  const serverLockedItems = useSelector(selectWebsitePublishLockedItems);
  const serverLockedItemCount =
    (serverLockedItems?.unownedVariants.length ?? 0) +
    (serverLockedItems?.unownedSections.length ?? 0) +
    (serverLockedItems?.unownedThemeAssets.length ?? 0);
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
  const [replaceConflictVersion, setReplaceConflictVersion] = useState<number | null>(null);
  // Blocker chips scroll to / open the named section in the builder below.
  const [focusSection, setFocusSection] = useState<{ type: string; nonce: number } | null>(null);

  const onSave = useCallback(
    (request: Parameters<typeof saveWebsiteDraftAction.request>[0]) => {
      dispatch(saveWebsiteDraftAction.request(request));
    },
    [dispatch],
  );

  const onPublish = useCallback(
    (request: Parameters<typeof publishWebsiteAction.request>[0]) => {
      dispatch(publishWebsiteAction.request(request));
    },
    [dispatch],
  );

  const form = useWebsiteDraft({
    draft,
    lastSavedRequestId,
    onSave,
    onPublish,
    locations,
    saveEnabled: canWrite,
    isSaving,
    mutationBusy: isSaving || isHeroMutating || isPublishing || isUnpublishing,
    conflict,
    saveFailure,
  });
  const checkoutState = useCheckoutReturn();

  const isPublished = publish?.isPublished ?? false;
  // Live view: server state is per-fetch; the draft version moves on every save/hero mutation.
  const hasUnpublishedChanges =
    isPublished &&
    (form.isDirty || (publish?.publishedVersion != null && draft.version > publish.publishedVersion));
  // Everything the visitor would see is already live — nothing to publish.
  const isPublishedCurrent = isPublished && !hasUnpublishedChanges;
  const publishBusy = isPublishing || isUnpublishing;

  // Client-side mirror of the server's E07 publish rule (unowned paid content on VISIBLE
  // sections blocks publish). Same data the lock pills render from, so the button can say
  // no BEFORE the round-trip — the server stays the authority; this is the early warning.
  const publishBlockers = useMemo(() => {
    if (!catalogLoaded) return [];
    const variantByKey = new Map(variantCatalog.map((e) => [`${e.sectionType}:${e.variantKey}`, e]));
    const sectionByType = new Map(sectionCatalog.map((e) => [e.sectionType, e]));
    const blockers: { key: string; type: string; name: string }[] = [];
    for (const entry of form.layout) {
      if (!entry.visible) continue;
      const section = sectionByType.get(entry.type);
      if (section && section.priceMinor > 0 && !section.owned) {
        // The section unlock supersedes its style in the message.
        blockers.push({ key: `section-${entry.type}`, type: entry.type, name: section.name });
        continue;
      }
      const variant = variantByKey.get(`${entry.type}:${entry.variant}`);
      if (variant && variant.priceMinor > 0 && !variant.owned) {
        blockers.push({ key: `variant-${entry.type}`, type: entry.type, name: variant.name });
      }
    }
    return blockers;
  }, [catalogLoaded, form.layout, sectionCatalog, variantCatalog]);
  const hasLockedBlockers = publishBlockers.length > 0;

  const canPublish = canWrite && !!websiteAccess?.canPublish;
  const publishDisabled =
    !canPublish ||
    hasLockedBlockers ||
    form.hasPublishReadinessIssues ||
    form.hasBlockingErrors ||
    !form.isOnline ||
    form.canRetrySave ||
    publishBusy ||
    isSaving ||
    isHeroMutating ||
    isPublishedCurrent;
  // Disabled buttons swallow pointer events, so the reason rides on a wrapper span's title.
  const publishDisabledReason = !publishDisabled
    ? null
    : !canPublish
      ? t("page.publishReason.readOnly")
      : hasLockedBlockers
        ? t("page.publishReason.locked")
        : form.hasBlockingErrors
          ? t("page.publishReason.errors")
          : form.hasPublishReadinessIssues
            ? t("page.publishReason.contentIncomplete")
            : !form.isOnline
              ? t("page.publishReason.offline")
              : form.canRetrySave
                ? t("page.publishReason.saveFailed")
                : publishBusy || isSaving || isHeroMutating
                  ? t("page.publishReason.busy")
                  : t("page.publishReason.current");

  const handleUnpublishConfirm = () => {
    setUnpublishDialogOpen(false);
    dispatch(unpublishWebsiteAction.request());
  };

  // Route-aware unsaved-changes guard: internal navigation blocks while dirty — including while
  // a save is in flight (edits typed during the request are not in it yet). A save that lands
  // mid-dialog flips isDirty off and auto-retries the intended navigation; edits made during the
  // save keep isDirty on, so the dialog stays up. Discard resets to the baseline first.
  const blocker = useUnsavedChangesBlocker({
    when: form.isDirty,
    proceedWhen: !form.isDirty,
  });

  const lastSaved = useMemo(() => {
    if (!draft.updatedAt) return null;
    try {
      return new Intl.DateTimeFormat(i18n.language === "ro" ? "ro-RO" : "en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(draft.updatedAt));
    } catch {
      return null;
    }
  }, [draft.updatedAt, i18n.language]);

  const handleReloadLatest = () => {
    form.acceptNextServerBaseline();
    setReplaceConflictVersion(null);
    dispatch(clearWebsiteConflictAction());
    dispatch(fetchWebsiteBuilderAction.request());
    toast.info(t("page.actions.reload"));
  };

  const prepareReplaceLatest = () => {
    if (!conflict) return;
    setReplaceConflictVersion(conflict.currentVersion);
    dispatch(fetchWebsiteBuilderAction.request());
  };

  const confirmReplaceLatest = () => {
    if (!conflict || replaceConflictVersion !== conflict.currentVersion) return;
    dispatch(clearWebsiteConflictAction());
    setReplaceConflictVersion(null);
    form.replaceLatestWithLocal();
  };

  const cancelReplaceLatest = () => {
    setReplaceConflictVersion(null);
  };

  const preparingLocalReplacement =
    !!conflict && replaceConflictVersion === conflict.currentVersion;
  const conflictDialogOpen =
    !!conflict && (!preparingLocalReplacement || !!loadError);
  const replaceConflictDialogOpen =
    preparingLocalReplacement &&
    !isLoading &&
    !loadError &&
    draft.version >= (conflict?.currentVersion ?? Number.POSITIVE_INFINITY);

  const mobileHeaderActions = (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        onClick={form.saveChanges}
        disabled={!canWrite || !form.isDirty || form.hasBlockingErrors || isSaving || isHeroMutating || publishBusy}
        className="min-h-11 px-3 text-[12px] font-semibold"
      >
        {isSaving ? <Spinner size="sm" /> : null}
        {isSaving ? t("page.status.saving") : t("page.actions.save")}
      </Button>
      <span title={publishDisabledReason ?? undefined}>
        <Button
          type="button"
          onClick={form.handlePublish}
          disabled={publishDisabled}
          className="min-h-11 px-3 text-[12px] font-semibold"
        >
          {isPublishing ? <Spinner size="sm" /> : null}
          {isPublishing
            ? t("page.status.publishing")
            : form.isDirty
              ? t("page.actions.savePublish")
              : t("page.actions.publish")}
        </Button>
      </span>
      {/* Unpublish must be reachable on phones too — behind an overflow menu, it stays out
          of the way of the two primary actions. */}
      {isPublished && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!canWrite || publishBusy}
              aria-label={t("page.actions.more")}
              className="size-11 text-foreground-3"
            >
              {isUnpublishing ? (
                <Spinner size="sm" />
              ) : (
                <EllipsisVertical className="size-4" strokeWidth={1.8} aria-hidden />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setUnpublishDialogOpen(true)}
            >
              <Globe className="size-4" strokeWidth={1.8} aria-hidden />
              {t("page.actions.unpublish")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );

  return (
    <div className="cursor-default">
      {isMobile ? <HeaderRightSlot>{mobileHeaderActions}</HeaderRightSlot> : null}
      {/* Sticky page status header (all viewports): draft state + the Save/Publish actions.
          top-11 below md: the mobile breadcrumb bar is also sticky at top-0 with a higher
          z-index, so this bar stacks under it instead of sliding behind it (responsive-tabs
          uses the same offset). */}
      <div className="sticky top-11 z-30 -mx-2 mb-4 border-b border-border/70 bg-background/95 px-2 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:top-0 md:-mx-4 md:mb-5 md:px-4">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          {/* flex-wrap: on narrow RO phones the (longer) publish status wraps to a second
              line instead of truncating away the "published but stale" warning. */}
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5">
            <h1 className="text-[15px] font-semibold text-foreground-1">{t("page.title")}</h1>
            <span
              className="hidden h-4 w-px bg-border sm:block"
              aria-hidden
            />
            <p className="flex min-w-0 items-center gap-1.5 text-xs text-foreground-3" aria-live="polite">
              {isSaving ? (
                <>
                  <Spinner size="sm" />
                  <span>{t("page.status.saving")}</span>
                </>
              ) : form.isDirty ? (
                <>
                  <CircleDashed className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                  <span>{t("page.status.unsaved")}</span>
                </>
              ) : (
                <>
                  <CircleCheck className="h-3.5 w-3.5 text-green-600" aria-hidden />
                  <span className="truncate">
                    {t("page.status.saved")}
                    {lastSaved ? ` · ${t("page.status.lastSaved", { time: lastSaved })}` : ""}
                  </span>
                </>
              )}
            </p>
            <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
            {/* Publish state: offline / live / live-but-stale. */}
            <p className="flex min-w-0 items-center gap-1.5 text-xs text-foreground-3">
              <Globe
                className={`h-3.5 w-3.5 ${
                  isPublished ? (hasUnpublishedChanges ? "text-amber-500" : "text-green-600") : "text-foreground-3"
                }`}
                aria-hidden
              />
              <span className="truncate">
                {isPublished
                  ? hasUnpublishedChanges
                    ? t("page.status.publishedStale")
                    : t("page.status.published")
                  : t("page.status.notPublished")}
              </span>
            </p>
            {(checkoutState.state === "pending" || checkoutState.state === "reconciling") && (
              <>
                <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
                {/* Visible on phones too — Stripe returns are a mobile-heavy flow and the
                    reconciliation poll can run for ~45s. */}
                <p className="flex items-center gap-1.5 text-xs text-foreground-3">
                  <Spinner size="sm" />
                  {t("page.status.checkingPurchase")}
                </p>
              </>
            )}
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {isPublished && (
              <Button
                variant="ghost"
                onClick={() => setUnpublishDialogOpen(true)}
                disabled={!canWrite || publishBusy}
                className="min-h-11 px-3 text-foreground-3 hover:text-destructive xl:h-8 xl:min-h-0"
              >
                {isUnpublishing ? <Spinner size="sm" /> : null}
                {t("page.actions.unpublish")}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={form.saveChanges}
              disabled={!canWrite || !form.isDirty || form.hasBlockingErrors || isSaving || isHeroMutating || publishBusy}
              className="min-h-11 px-4 xl:h-8 xl:min-h-0"
            >
              {t("page.actions.save")}
            </Button>
            <span title={publishDisabledReason ?? undefined}>
              <Button
                onClick={form.handlePublish}
                disabled={publishDisabled}
                className="min-h-11 px-4 xl:h-8 xl:min-h-0"
              >
                {isPublishing ? <Spinner size="sm" /> : null}
                {isPublishing
                  ? t("page.status.publishing")
                  : form.isDirty
                    ? t("page.actions.savePublish")
                    : t("page.actions.publish")}
              </Button>
            </span>
          </div>
        </div>
      </div>

      <LimitedAccessBanner className="!px-0 !pt-0" />

      {/* Publish blockers: unowned premium content on visible sections. Client-computed chips
          jump to the section. If the server finds newer catalog data, show only a localized
          count so backend catalog names never leak into the dashboard language. */}
      {(hasLockedBlockers || serverLockedItemCount > 0) && (
        <div
          className="mb-4 rounded-xl border border-warning-border bg-warning-bg px-3.5 py-3 md:mb-5"
          role="status"
        >
          <p className="text-[13px] leading-5 text-warning">
            <span className="font-semibold">{t("page.publishBlockers.title")}</span>{" "}
            {t("page.publishBlockers.helper")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {hasLockedBlockers
              ? publishBlockers.map((b) => (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() =>
                      setFocusSection((r) => ({ type: b.type, nonce: (r?.nonce ?? 0) + 1 }))
                    }
                    aria-label={t("page.publishBlockers.openAria", { name: b.name })}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-warning-border bg-surface px-3 text-[12px] font-medium text-foreground-1 outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    <Lock className="size-3.5 text-warning" strokeWidth={1.9} aria-hidden />
                    {b.name}
                  </button>
                ))
              : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-warning-border bg-surface px-3 py-1 text-[12px] font-medium text-foreground-1">
                    <Lock className="size-3.5 text-warning" strokeWidth={1.9} aria-hidden />
                    {t("page.publishBlockers.fallback", {
                      count: serverLockedItemCount,
                    })}
                  </span>
                )}
          </div>
        </div>
      )}

      <WebsiteLegacyBuilderCore
        identity={identity}
        canWrite={canWrite}
        businessId={businessId}
        locations={locations}
        form={form}
        focusSection={focusSection}
        checkoutReconciliationBlocked={checkoutState.blocksNewCheckout}
      />

      {/* Unsaved changes: Stay keeps draft and URL; Discard resets to the server baseline, then continues. */}
      <ConfirmDialog
        open={blocker.isBlocked}
        onConfirm={() => {
          form.resetToBaseline();
          blocker.discard();
        }}
        onCancel={blocker.stay}
        onOpenChange={(open: boolean) => {
          if (!open) blocker.stay();
        }}
        title={t("page.unsaved.title")}
        description={t("page.unsaved.description")}
        confirmTitle={t("page.unsaved.discard")}
        cancelTitle={t("page.unsaved.stay")}
        variant="destructive"
        icon={AlertTriangle}
        iconBgColor="transparent"
        iconColor="text-destructive"
        showCloseButton
        footerClassName=""
        cancelClassName="w-auto md:w-32"
        confirmClassName="w-auto md:w-44"
      />

      {/* Unpublish: takes the site offline immediately; the snapshot is kept for instant re-publish. */}
      <ConfirmDialog
        open={unpublishDialogOpen}
        onConfirm={handleUnpublishConfirm}
        onCancel={() => setUnpublishDialogOpen(false)}
        onOpenChange={(open: boolean) => {
          if (!open) setUnpublishDialogOpen(false);
        }}
        title={t("page.unpublishConfirm.title")}
        description={t("page.unpublishConfirm.description")}
        confirmTitle={t("page.unpublishConfirm.confirm")}
        cancelTitle={t("page.unpublishConfirm.cancel")}
        variant="destructive"
        icon={Globe}
        iconBgColor="transparent"
        iconColor="text-destructive"
        showCloseButton
        footerClassName=""
        cancelClassName="w-auto md:w-36"
        confirmClassName="w-auto md:w-40"
      />

      {/* 409: a newer draft exists on the server — never silently overwrite it. */}
      <ConfirmDialog
        open={conflictDialogOpen}
        onConfirm={handleReloadLatest}
        onCancel={prepareReplaceLatest}
        onOpenChange={() => undefined}
        title={t("page.conflict.title")}
        description={t("page.conflict.description")}
        confirmTitle={t("page.conflict.reload")}
        cancelTitle={t("page.conflict.keepLocal")}
        icon={AlertTriangle}
        iconBgColor="transparent"
        iconColor="text-amber-500"
        showCloseButton
        footerClassName=""
        cancelClassName="w-auto md:w-36"
        confirmClassName="w-auto md:w-48"
      />

      <ConfirmDialog
        open={replaceConflictDialogOpen}
        onConfirm={confirmReplaceLatest}
        onCancel={cancelReplaceLatest}
        onOpenChange={(open: boolean) => {
          if (!open) cancelReplaceLatest();
        }}
        title={t("page.conflict.replaceTitle")}
        description={t("page.conflict.replaceDescription")}
        confirmTitle={t("page.conflict.replaceConfirm")}
        cancelTitle={t("page.conflict.back")}
        variant="destructive"
        icon={AlertTriangle}
        iconBgColor="transparent"
        iconColor="text-destructive"
        showCloseButton
        footerClassName=""
        cancelClassName="w-auto md:w-32"
        confirmClassName="w-auto md:w-52"
      />
    </div>
  );
}
