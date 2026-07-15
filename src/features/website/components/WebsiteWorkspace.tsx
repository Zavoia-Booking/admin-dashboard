import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Check, EllipsisVertical, Globe, LoaderCircle, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { LocationWithAssignments, WebsiteDraft, WebsiteIdentity } from "../types";
import { useWebsiteBuilderController } from "../hooks/useWebsiteBuilderController";
import { useWebsiteWorkspaceController } from "../hooks/useWebsiteWorkspaceController";
import { LimitedAccessBanner } from "../../../shared/components/common/subscription/LimitedAccessBanner";
import ConfirmDialog from "../../../shared/components/common/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../shared/components/ui/dropdown-menu";
import { Button } from "../../../shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../shared/components/ui/dialog";
import { WebsiteBuilderCore } from "./WebsiteBuilderCore";
import { WebsiteAtelierHeader } from "./atelier/WebsiteAtelierHeader";
import { WebsiteAtelierShell } from "./atelier/WebsiteAtelierShell";
import { PendingUnlocksTrigger } from "./builder/PendingUnlocksTray";
import { displayFontFor } from "./builder/theme";
import { useWebsitePreviewFonts } from "../hooks/useWebsitePreviewFonts";

interface WebsiteWorkspaceProps {
  identity: WebsiteIdentity;
  draft: WebsiteDraft;
  locations: LocationWithAssignments[];
  businessId: number | string | null;
}

/**
 * The Website workspace shell: page status (draft autosave + publish state), the publish
 * action, the 409-conflict resolution dialog, the route-aware
 * unsaved-changes guard, and the checkout-return reconciliation — around the builder
 * editing surface.
 *
 * Autosave persists the DRAFT only. Publish (tier-2 only, enforced server-side) captures a
 * synchronous draft snapshot, flushes it through the serialized mutation lane, then freezes
 * that exact version as the published snapshot. No current frontend exposes a public URL.
 */
export function WebsiteWorkspace({ identity, draft, locations, businessId }: WebsiteWorkspaceProps) {
  const { t } = useTranslation("website");
  const navigate = useNavigate();
  const controller = useWebsiteWorkspaceController({
    draft,
    locationIds: locations.map((location) => location.id),
  });
  const [publishReviewOpen, setPublishReviewOpen] = useState(false);
  const { form } = controller;
  const builderController = useWebsiteBuilderController({
    identity,
    businessId,
    checkoutReconciliationBlocked: controller.checkoutReturnBlocksNewCheckout,
    committedTheme: {
      brandColorHex: form.brandColorHex,
      fontKey: form.fontKey,
    },
    onCommitThemeAsset: form.applyThemeAssetSelection,
  });
  const canWrite = controller.permissions.canEdit;
  const monogramFont = displayFontFor(builderController.effectiveFontKey);
  useWebsitePreviewFonts(builderController.effectiveFontKey);
  const { isSaving, isHeroMutating, isPublishing, isUnpublishing, publishBusy } =
    controller.mutations;
  const {
    isPublished,
    status: publishStatus,
    disabled: publishDisabled,
    reviewDisabled: publishReviewDisabled,
    reviewDisabledReason: publishReviewDisabledReason,
  } = controller.publication;
  const {
    saveStatus,
    publishBlockers: savedPublishBlockers,
    focusSection,
    navigationBlocker: blocker,
    conflict,
    conflictDialogOpen,
    replaceConflictDialogOpen,
    unpublishDialogOpen,
    checkoutReturnBlocksNewCheckout,
    catalogState,
  } = controller;

  const previewThemeBlockers = builderController.themeAssetCatalog
    .filter(
      (asset) =>
        !asset.isIncluded &&
        !asset.owned &&
        builderController.previewOnlyThemeSelections[asset.kind] === asset.value,
    )
    .map((asset) => ({
      key: `preview-${asset.kind}-${asset.id}`,
      type: asset.kind,
      name: asset.name,
      kind: asset.kind,
      catalogId: asset.id,
    }) as const);
  const publishBlockers = [...savedPublishBlockers, ...previewThemeBlockers].filter(
    (blocker, index, items) => items.findIndex((candidate) => candidate.key === blocker.key) === index,
  );
  const hasLockedBlockers = publishBlockers.length > 0;

  const moreControl = form.canRetryAutosave || isPublished || !!conflict ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("page.actions.more")}
          className="website-atelier-focus website-atelier-press grid size-11 shrink-0 place-items-center rounded-[9px] text-[var(--atelier-muted)] hover:bg-[var(--atelier-field)] min-[920px]:size-8"
        >
          {isUnpublishing ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <EllipsisVertical className="size-4" strokeWidth={1.8} aria-hidden />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {form.canRetryAutosave ? (
          <DropdownMenuItem
            disabled={!canWrite || isSaving || isHeroMutating || publishBusy}
            onSelect={form.retryAutosave}
          >
            <RotateCcw className="size-4" strokeWidth={1.8} aria-hidden />
            {t("page.actions.retrySave")}
          </DropdownMenuItem>
        ) : null}
        {conflict ? (
          <DropdownMenuItem onSelect={controller.reloadLatest}>
            <RotateCcw className="size-4" strokeWidth={1.8} aria-hidden />
            {t("page.actions.reload")}
          </DropdownMenuItem>
        ) : null}
        {isPublished ? (
          <DropdownMenuItem
            variant="destructive"
            disabled={!controller.permissions.canPublish || publishBusy}
            onSelect={() => controller.setUnpublishDialogOpen(true)}
          >
            <Globe className="size-4" strokeWidth={1.8} aria-hidden />
            {t("page.actions.unpublish")}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  const pendingUnlocksControl =
    controller.permissions.canPurchase && !builderController.isNative ? (
      <PendingUnlocksTrigger
        variant="atelier-header"
        entries={builderController.cartItems}
        isLoading={builderController.isVariantCheckoutLoading}
        isBlocked={
          controller.checkoutReturnBlocksNewCheckout ||
          !builderController.catalogPurchasesReady
        }
        onRemove={builderController.handleRemoveCartItem}
        onClear={builderController.handleClearCart}
        onCheckout={builderController.handleCheckoutCart}
      />
    ) : null;

  const catalogReviewChecking = catalogState.loading || (!catalogState.loaded && !catalogState.error);
  const catalogReviewFailed = !!catalogState.error;
  const publishReviewBlocked =
    catalogReviewChecking || catalogReviewFailed || hasLockedBlockers;
  const visibleSectionCount = form.layout.filter((entry) => entry.visible).length;

  const reviewBlocker = (type: string) => {
    setPublishReviewOpen(false);
    controller.focusPublishBlocker(type);
  };

  const selectIncludedVariant = (type: string, baseVariantKey?: string) => {
    if (!baseVariantKey) return;
    const index = form.layout.findIndex((entry) => entry.type === type);
    if (index >= 0) form.setSectionVariant(index, baseVariantKey);
  };

  const addBlockerToUnlocks = (publishBlocker: (typeof publishBlockers)[number]) => {
    if (publishBlocker.kind === "variant") {
      const entry = builderController.variantCatalog.find(
        (item) => item.id === publishBlocker.catalogId,
      );
      if (entry && !builderController.variantCart.includes(entry.id)) {
        builderController.handleToggleCartVariant(entry);
      }
      return;
    }
    if (publishBlocker.kind === "color" || publishBlocker.kind === "font") {
      const asset = builderController.themeAssetCatalog.find(
        (item) => item.id === publishBlocker.catalogId,
      );
      if (asset && !builderController.themeAssetCart.includes(asset.id)) {
        builderController.handleToggleCartThemeAsset(asset);
      }
      return;
    }
    const entry = builderController.sectionCatalog.find(
      (item) => item.id === publishBlocker.catalogId,
    );
    if (entry && !builderController.sectionCart.includes(entry.id)) {
      builderController.handleToggleCartSection(entry);
    }
  };

  const selectIncludedTheme = (kind: "color" | "font") => {
    const fallback = builderController.themeAssetCatalog
      .filter((asset) => asset.kind === kind && asset.isIncluded && asset.available !== false)
      .sort((left, right) => left.sortOrder - right.sortOrder)[0];
    if (fallback) builderController.handleSelectThemeAsset(fallback);
  };

  return (
    <WebsiteAtelierShell
      desktopHeader={
        <WebsiteAtelierHeader
          variant="desktop"
          businessName={identity.name}
          brandColor={builderController.effectiveBrandColorHex}
          monogramFontFamily={monogramFont.stack}
          monogramFontWeight={monogramFont.weight}
          publishStatus={publishStatus}
          saveStatus={saveStatus}
          onPreview={controller.requestPreview}
          onPublish={() => setPublishReviewOpen(true)}
          publishDisabled={publishReviewDisabled}
          publishDisabledReason={publishReviewDisabledReason}
          publishBusy={isPublishing}
          pendingControl={pendingUnlocksControl}
          moreControl={moreControl}
        />
      }
      mobileHeader={
        <WebsiteAtelierHeader
          variant="mobile"
          businessName={identity.name}
          monogramFontFamily={monogramFont.stack}
          monogramFontWeight={monogramFont.weight}
          publishStatus={publishStatus}
          saveStatus={saveStatus}
          onBack={() => navigate("/dashboard")}
          onPreview={controller.requestPreview}
          onPublish={() => setPublishReviewOpen(true)}
          publishDisabled={publishReviewDisabled}
          publishDisabledReason={publishReviewDisabledReason}
          publishBusy={isPublishing}
          moreControl={moreControl}
        />
      }
    >
      <div className="website-atelier-workspace website-atelier-scrollbar h-full min-h-0 cursor-default">
        <div className="website-atelier-workspace-banner">
          <LimitedAccessBanner className="!px-0 !pt-0" />
        </div>

        <WebsiteBuilderCore
          identity={identity}
          canWrite={canWrite}
          canPurchase={controller.permissions.canPurchase}
          controller={builderController}
          locations={locations}
          form={form}
          focusSection={focusSection}
          previewOpen={controller.previewOpen}
          onPreviewOpenChange={controller.setPreviewOpen}
          checkoutReconciliationBusy={
            checkoutReturnBlocksNewCheckout
          }
        />
      </div>

      <Dialog open={publishReviewOpen} onOpenChange={setPublishReviewOpen}>
        <DialogContent
          overlayClassName="z-50 bg-[rgb(23_22_20/45%)] backdrop-blur-[2px]"
          className="website-atelier atelier-publish-dialog z-50 w-[min(540px,calc(100%-2rem))] max-w-[540px] gap-0 rounded-[18px] border-0 p-[22px]"
        >
          <DialogHeader className="pr-8 text-left">
            <p className="atelier-publish-eyebrow">{t("page.publishReview.eyebrow")}</p>
            <DialogTitle className="text-[19px] leading-[1.25] tracking-[-0.015em]">
              {catalogReviewChecking
                ? t("page.publishReview.catalogCheckingTitle")
                : catalogReviewFailed
                  ? t("page.publishReview.catalogErrorTitle")
                  : publishReviewBlocked
                    ? t("page.publishReview.blockedTitle")
                    : t("page.publishReview.readyTitle")}
            </DialogTitle>
            <DialogDescription className="pt-1 text-[12.5px] leading-[1.55]">
              {catalogReviewChecking
                ? t("page.publishReview.catalogCheckingDescription")
                : catalogReviewFailed
                  ? t("page.publishReview.catalogErrorDescription")
                  : publishReviewBlocked
                    ? t("page.publishReview.blockedDescription")
                    : t("page.publishReview.readyDescription")}
            </DialogDescription>
          </DialogHeader>

          {catalogReviewChecking ? (
            <div className="my-5 flex min-h-20 items-center justify-center gap-2.5 rounded-[12px] border border-[var(--atelier-border)] bg-[var(--atelier-surface-strong)] px-4 text-[12.5px] text-[var(--atelier-muted)]" role="status">
              <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
              {t("page.status.checkingPurchase")}
            </div>
          ) : catalogReviewFailed ? (
            <div className="my-5 flex min-h-20 flex-col items-center justify-center gap-3 rounded-[12px] border border-[var(--atelier-border)] bg-[var(--atelier-surface-strong)] px-4 text-center">
              <Button
                type="button"
                variant="outline"
                onClick={catalogState.retry}
                disabled={catalogState.loading}
                className="min-h-11 rounded-[10px] px-4 text-[12.5px]"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                {t("page.publishReview.retryCatalog")}
              </Button>
            </div>
          ) : publishReviewBlocked ? (
            <div className="atelier-publish-blocker-list">
              {publishBlockers.map((publishBlocker) => {
                const themeKind =
                  publishBlocker.kind === "color" || publishBlocker.kind === "font"
                    ? publishBlocker.kind
                    : null;
                const queueable =
                  builderController.catalogPurchasesReady &&
                  !checkoutReturnBlocksNewCheckout &&
                  (publishBlocker.kind === "variant"
                    ? builderController.variantCatalog.some(
                        (entry) =>
                          entry.id === publishBlocker.catalogId &&
                          entry.available !== false &&
                          !entry.owned &&
                          entry.priceMinor > 0,
                      )
                    : publishBlocker.kind === "section"
                      ? builderController.sectionCatalog.some(
                          (entry) =>
                            entry.id === publishBlocker.catalogId &&
                            entry.available !== false &&
                            !entry.owned &&
                            entry.priceMinor > 0,
                        )
                      : builderController.themeAssetCatalog.some(
                          (entry) =>
                            entry.id === publishBlocker.catalogId &&
                            entry.available &&
                            !entry.isIncluded &&
                            !entry.owned &&
                            entry.priceMinor > 0,
                        ));
                const queued = publishBlocker.kind === "variant"
                  ? builderController.variantCart.includes(publishBlocker.catalogId)
                  : publishBlocker.kind === "section"
                    ? builderController.sectionCart.includes(publishBlocker.catalogId)
                    : builderController.themeAssetCart.includes(publishBlocker.catalogId);
                return (
                  <div key={publishBlocker.key} className="atelier-publish-blocker-row">
                    <span className="atelier-publish-blocker-dot" aria-hidden />
                    <div className="min-w-[130px] flex-1">
                      <p>{publishBlocker.name}</p>
                      <span>
                        {publishBlocker.kind === "variant"
                          ? t("page.publishReview.premiumStyle")
                          : publishBlocker.kind === "section"
                            ? t("page.publishReview.premiumSection")
                            : publishBlocker.kind === "color"
                              ? t("businessPage.theme.accentColor")
                              : t("businessPage.theme.fontLabel")}
                      </span>
                    </div>
                    {controller.permissions.canEdit ? (
                      themeKind ? (
                        <button
                          type="button"
                          onClick={() => selectIncludedTheme(themeKind)}
                        >
                          {t("page.publishReview.useIncluded")}
                        </button>
                      ) : publishBlocker.kind === "variant" && publishBlocker.baseVariantKey ? (
                        <button
                          type="button"
                          onClick={() => selectIncludedVariant(
                            publishBlocker.type,
                            publishBlocker.baseVariantKey,
                          )}
                        >
                          {t("page.publishReview.useIncluded")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => form.setSectionVisibleByType(publishBlocker.type, false)}
                        >
                          {t("page.publishReview.hideSection")}
                        </button>
                      )
                    ) : null}
                    {controller.permissions.canPurchase && !builderController.isNative && queueable ? (
                      <button
                        type="button"
                        disabled={queued}
                        onClick={() => addBlockerToUnlocks(publishBlocker)}
                      >
                        {queued
                          ? t("page.publishReview.queued")
                          : t("page.publishReview.addToUnlocks")}
                      </button>
                    ) : null}
                    {publishBlocker.kind === "section" || publishBlocker.kind === "variant" ? (
                      <button type="button" onClick={() => reviewBlocker(publishBlocker.type)}>
                        {t("page.publishReview.review")}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="atelier-publish-summary">
              <div>
                <span>{t("page.publishReview.sectionsLabel")}</span>
                <strong>{t("page.publishReview.visibleSections", { count: visibleSectionCount })}</strong>
              </div>
              <div>
                <span>{t("page.publishReview.bookingLabel")}</span>
                <strong>{t("page.publishReview.bookingValue")}</strong>
              </div>
              <div>
                <span>{t("page.publishReview.saveLabel")}</span>
                <strong>
                  {form.isDirty
                    ? t("page.publishReview.saveFirst")
                    : t("page.publishReview.saved")}
                </strong>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 flex-row items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPublishReviewOpen(false)}
              className="h-9 rounded-[10px] px-3.5 text-[12.5px] text-[var(--atelier-muted)]"
            >
              {publishReviewBlocked
                ? t("page.publishReview.keepEditing")
                : t("page.publishReview.cancel")}
            </Button>
            {!publishReviewBlocked ? (
              <Button
                type="button"
                onClick={() => {
                  if (publishDisabled || publishReviewBlocked) return;
                  const accepted = form.handlePublish();
                  if (accepted !== false) setPublishReviewOpen(false);
                }}
                disabled={publishDisabled || isPublishing}
                className="h-[38px] rounded-[11px] bg-[var(--atelier-ink)] px-[18px] text-[13px] font-semibold text-[var(--atelier-canvas)] hover:bg-black"
              >
                {isPublishing ? (
                  <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Check className="size-3.5" aria-hidden />
                )}
                {t("page.publishReview.publish")}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved changes: Stay keeps draft and URL; Discard resets to the server baseline, then continues. */}
      <ConfirmDialog
        open={blocker.isBlocked}
        onConfirm={() => {
          controller.discardChanges();
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
        className="website-atelier atelier-confirm-dialog"
        footerClassName=""
        cancelClassName="w-auto md:w-32"
        confirmClassName="w-auto md:w-44"
      />

      {/* Unpublish clears published status; the saved draft remains available for re-publishing. */}
      <ConfirmDialog
        open={unpublishDialogOpen}
        onConfirm={controller.confirmUnpublish}
        onCancel={() => controller.setUnpublishDialogOpen(false)}
        onOpenChange={(open: boolean) => {
          if (!open) controller.setUnpublishDialogOpen(false);
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
        className="website-atelier atelier-confirm-dialog"
        footerClassName=""
        cancelClassName="w-auto md:w-36"
        confirmClassName="w-auto md:w-40"
      />

      {/* 409: a newer draft exists on the server — never silently overwrite it. */}
      <ConfirmDialog
        open={conflictDialogOpen}
        onConfirm={controller.reloadLatest}
        onCancel={controller.prepareReplaceLatest}
        onOpenChange={() => undefined}
        title={t("page.conflict.title")}
        description={t("page.conflict.description")}
        confirmTitle={t("page.conflict.reload")}
        cancelTitle={t("page.conflict.keepLocal")}
        icon={AlertTriangle}
        iconBgColor="transparent"
        iconColor="text-amber-500"
        className="website-atelier atelier-confirm-dialog"
        footerClassName=""
        cancelClassName="w-auto md:w-36"
        confirmClassName="w-auto md:w-48"
      />

      {/* Keeping local work is deliberately two-stage: this dialog appears only after the
          latest server baseline has been fetched while the conflict lock stayed active. */}
      <ConfirmDialog
        open={replaceConflictDialogOpen}
        onConfirm={controller.confirmReplaceLatest}
        onCancel={controller.cancelReplaceLatest}
        onOpenChange={(open: boolean) => {
          if (!open) controller.cancelReplaceLatest();
        }}
        title={t("page.conflict.replaceTitle")}
        description={t("page.conflict.replaceDescription")}
        confirmTitle={t("page.conflict.replaceConfirm")}
        cancelTitle={t("page.conflict.back")}
        variant="destructive"
        icon={AlertTriangle}
        iconBgColor="transparent"
        iconColor="text-destructive"
        className="website-atelier atelier-confirm-dialog"
        footerClassName=""
        cancelClassName="w-auto md:w-32"
        confirmClassName="w-auto md:w-52"
      />
    </WebsiteAtelierShell>
  );
}
