import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  EllipsisVertical,
  Globe,
  Images,
  LayoutTemplate,
  LoaderCircle,
  Megaphone,
  MessageSquareQuote,
  MessagesSquare,
  Palette,
  RotateCcw,
  Rows3,
  TextCursorInput,
  Type,
  Undo2,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { LocationWithAssignments, WebsiteDraft, WebsiteIdentity } from "../types";
import { useWebsiteBuilderController } from "../hooks/useWebsiteBuilderController";
import {
  useWebsiteWorkspaceController,
  type WebsitePublishBlocker,
} from "../hooks/useWebsiteWorkspaceController";
import { LimitedAccessBanner } from "../../../shared/components/common/subscription/LimitedAccessBanner";
import ConfirmDialog from "../../../shared/components/common/ConfirmDialog";
import { UnsavedWebsiteChangesDialog } from "./UnsavedWebsiteChangesDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../shared/components/ui/dropdown-menu";
import { Button } from "../../../shared/components/ui/button";
import { Spinner } from "../../../shared/components/ui/spinner";
import { useFormatPrice } from "../../../shared/hooks/useFormatPrice";
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
import {
  PendingUnlocksTrigger,
  UnlockSpecimen,
  type UnlockLineItem,
} from "./builder/PendingUnlocksTray";
import { unlockTotalsByCurrency, variantPriceLabel } from "./builder/pricing";
import { displayFontFor } from "./builder/theme";
import { useWebsitePreviewFonts } from "../hooks/useWebsitePreviewFonts";
import type { WebsiteReadinessIssue } from "./builder/sectionReadiness";

interface WebsiteWorkspaceProps {
  identity: WebsiteIdentity;
  draft: WebsiteDraft;
  locations: LocationWithAssignments[];
  businessId: number | string | null;
}

interface PendingPublishCheckout {
  target: string;
  items: UnlockLineItem[];
  requestId: string;
  acknowledgementObserved: boolean;
}

/**
 * The Website workspace shell: explicit draft save + publish state, the publish
 * action, the 409-conflict resolution dialog, the route-aware
 * unsaved-changes guard, and the checkout-return reconciliation — around the builder
 * editing surface.
 *
 * Save persists the DRAFT only. Publish (tier-2 only, enforced server-side) captures a
 * synchronous draft snapshot, flushes it through the serialized mutation lane, then freezes
 * that exact version as the published snapshot. No current frontend exposes a public URL.
 */
export function WebsiteWorkspace({ identity, draft, locations, businessId }: WebsiteWorkspaceProps) {
  const { t } = useTranslation("website");
  const { formatPrice } = useFormatPrice();
  const navigate = useNavigate();
  const controller = useWebsiteWorkspaceController({
    draft,
    locations,
  });
  const [publishReviewOpen, setPublishReviewOpen] = useState(false);
  const pendingReadinessFocusRef = useRef<WebsiteReadinessIssue | null>(null);
  const [publishCheckoutTarget, setPublishCheckoutTarget] = useState<string | null>(null);
  const [pendingPublishCheckout, setPendingPublishCheckout] =
    useState<PendingPublishCheckout | null>(null);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
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
    checkoutBlocked: form.isDirty,
  });
  const canWrite = controller.permissions.canEdit;
  const monogramFont = displayFontFor(builderController.effectiveFontKey);
  useWebsitePreviewFonts(builderController.effectiveFontKey);
  const { isSaving, isPublishing, isUnpublishing, publishBusy } =
    controller.mutations;
  const {
    isPublished,
    isPublishedCurrent,
    status: publishStatus,
    disabled: publishDisabled,
    reviewDisabledReason: publishReviewDisabledReason,
    reviewGuardDisabled: publishReviewGuardDisabled,
    reviewGuardDisabledReason: publishReviewGuardDisabledReason,
    failure: publishFailure,
    retryPending: publishRetryPending,
  } = controller.publication;
  const {
    saveStatus,
    draftSave,
    discardAction,
    publishBlockers: savedPublishBlockers,
    focusSection,
    navigationBlocker: blocker,
    conflict,
    conflictDialogOpen,
    replaceConflictDialogOpen,
    unpublishDialogOpen,
    checkoutReturnBlocksNewCheckout,
    checkoutReturnResumePublishReview,
    consumeCheckoutReturnPublishReview,
    catalogState,
  } = controller;

  const previewThemeBlockers = (["color", "font"] as const)
    .flatMap<WebsitePublishBlocker>((kind) => {
      const selectedValue = builderController.previewOnlyThemeSelections[kind];
      if (!selectedValue) return [];
      const asset = builderController.themeAssetCatalog.find(
        (entry) => entry.kind === kind && entry.value === selectedValue,
      );
      if (asset?.isIncluded || asset?.owned) return [];
      return [{
        key: `preview-${kind}-${asset?.id ?? "unavailable"}`,
        type: kind,
        name: asset?.name ?? t(
          kind === "color"
            ? "businessPage.theme.accentColor"
            : "businessPage.theme.fontLabel",
        ),
        kind,
        catalogId: asset?.id ?? 0,
        previewOnly: true,
      }];
    });
  const previewVariantBlockers = Object.entries(
    builderController.previewOnlyVariantSelections,
  ).flatMap<WebsitePublishBlocker>(([sectionType, variantKey]) => {
    const sectionEntry = form.layout.find((entry) => entry.type === sectionType);
    const variant = builderController.variantCatalog.find(
      (entry) => entry.sectionType === sectionType && entry.variantKey === variantKey,
    );
    if (
      !sectionEntry?.visible ||
      sectionEntry.variant === variantKey ||
      !variant ||
      variant.priceMinor <= 0 ||
      variant.owned
    ) return [];

    return [{
      key: `variant-${sectionType}`,
      type: sectionType,
      name: variant.name,
      kind: "variant" as const,
      catalogId: variant.id,
      previewOnly: true,
      baseVariantKey: builderController.variantCatalog.find(
        (entry) => entry.sectionType === sectionType && entry.isBase,
      )?.variantKey,
    }];
  });
  // The previewed choice is what the owner currently sees, so it takes precedence over a
  // saved blocker of the same kind when Publish review explains what must change.
  const publishBlockers: WebsitePublishBlocker[] = [
    ...previewVariantBlockers,
    ...previewThemeBlockers,
    ...savedPublishBlockers,
  ].filter(
    (blocker, index, items) =>
      items.findIndex(
        (candidate) => candidate.kind === blocker.kind && candidate.type === blocker.type,
      ) === index,
  );
  const blockerUnlockItems = publishBlockers.flatMap<UnlockLineItem>((blocker) => {
    if (blocker.kind === "variant") {
      const entry = builderController.variantCatalog.find((item) => item.id === blocker.catalogId);
      if (!entry || entry.owned || entry.available === false || entry.priceMinor <= 0) return [];
      return [{
        key: `variant-${entry.id}`,
        id: entry.id,
        kind: "variant",
        name: blocker.name,
        priceMinor: entry.priceMinor,
        currency: entry.currency,
      }];
    }
    if (blocker.kind === "section") {
      const entry = builderController.sectionCatalog.find((item) => item.id === blocker.catalogId);
      if (!entry || entry.owned || entry.available === false || entry.priceMinor <= 0) return [];
      return [{
        key: `section-${entry.id}`,
        id: entry.id,
        kind: "section",
        name: blocker.name,
        priceMinor: entry.priceMinor,
        currency: entry.currency,
      }];
    }
    const entry = builderController.themeAssetCatalog.find((item) => item.id === blocker.catalogId);
    if (!entry || entry.isIncluded || entry.owned || entry.available === false || entry.priceMinor <= 0) {
      return [];
    }
    return [{
      key: `${entry.kind}-${entry.id}`,
      id: entry.id,
      kind: entry.kind,
      name: blocker.name,
      priceMinor: entry.priceMinor,
      currency: entry.currency,
      value: entry.value,
      assetKey: entry.assetKey,
    }];
  });
  const publishUnlockItems = [
    ...builderController.cartItems,
    ...blockerUnlockItems,
  ].filter(
    (item, index, items) => items.findIndex((candidate) => candidate.key === item.key) === index,
  );
  const unresolvedPublishBlockers = publishBlockers.filter(
    (blocker) =>
      !publishUnlockItems.some(
        (item) => item.id === blocker.catalogId && item.kind === blocker.kind,
      ),
  );
  const premiumReviewCount = publishUnlockItems.length + unresolvedPublishBlockers.length;
  const publishUnlockTotals = unlockTotalsByCurrency(publishUnlockItems);
  const publishUnlockTotal = publishUnlockTotals
    .map((subtotal) => variantPriceLabel(formatPrice, subtotal))
    .join(" + ");
  const publishUnlockHasMixedCurrencies = publishUnlockTotals.length > 1;
  const publishPremiumMutationDisabled =
    builderController.isVariantCheckoutLoading ||
    checkoutReturnBlocksNewCheckout ||
    !builderController.catalogPurchasesReady ||
    draftSave.busy ||
    pendingPublishCheckout != null;
  const publishCheckoutSaveBlocked =
    form.isDirty && draftSave.disabled && !draftSave.busy;
  const publishUnlockCheckoutDisabled =
    !controller.permissions.canPurchase ||
    builderController.isNative ||
    publishPremiumMutationDisabled ||
    publishCheckoutSaveBlocked ||
    pendingPublishCheckout != null;
  const showPublishUnlockSummary =
    controller.permissions.canPurchase &&
    !builderController.isNative &&
    publishUnlockItems.length > 0 &&
    unresolvedPublishBlockers.length === 0;

  const requestPublishCheckout = (target: string, items: UnlockLineItem[]) => {
    if (publishUnlockCheckoutDisabled || items.length === 0) return;

    setPublishCheckoutTarget(target);
    if (!form.isDirty) {
      builderController.handleCheckoutItems(items, { returnContext: "publish-review" });
      return;
    }

    const requestId = draftSave.saveWithReceipt();
    if (requestId === false) {
      setPublishCheckoutTarget(null);
      return;
    }
    setPendingPublishCheckout({
      target,
      items,
      requestId,
      acknowledgementObserved: false,
    });
  };

  useEffect(() => {
    if (!pendingPublishCheckout) return;

    if (
      draftSave.conflict ||
      draftSave.failure?.requestId === pendingPublishCheckout.requestId
    ) {
      setPendingPublishCheckout(null);
      setPublishCheckoutTarget(null);
      return;
    }

    if (draftSave.lastSavedRequestId !== pendingPublishCheckout.requestId) {
      return;
    }

    if (form.saveStatus === "clean" && !form.isDirty) {
      const items = pendingPublishCheckout.items;
      setPendingPublishCheckout(null);
      builderController.handleCheckoutItems(items, { returnContext: "publish-review" });
      return;
    }

    // The draft hook adopts the acknowledged server baseline in its own effect. Give that
    // reconciliation one render before treating a remaining dirty state as a newer edit.
    if (!pendingPublishCheckout.acknowledgementObserved) {
      setPendingPublishCheckout((current) =>
        current ? { ...current, acknowledgementObserved: true } : current,
      );
      return;
    }

    setPendingPublishCheckout(null);
    setPublishCheckoutTarget(null);
  }, [
    builderController,
    draftSave.conflict,
    draftSave.failure,
    draftSave.lastSavedRequestId,
    form.isDirty,
    form.saveStatus,
    pendingPublishCheckout,
  ]);

  useEffect(() => {
    if (!checkoutReturnResumePublishReview) return;
    setPublishReviewOpen(true);
    consumeCheckoutReturnPublishReview();
  }, [
    checkoutReturnResumePublishReview,
    consumeCheckoutReturnPublishReview,
  ]);

  const handlePublishReviewOpenChange = (open: boolean) => {
    setPublishReviewOpen(open);
    if (!open && pendingPublishCheckout) {
      setPendingPublishCheckout(null);
      setPublishCheckoutTarget(null);
    }
  };
  const hasLockedBlockers = premiumReviewCount > 0;
  const hasPreviewOnlySelections =
    previewVariantBlockers.length > 0 || previewThemeBlockers.length > 0;
  const workspaceIsPublishedCurrent =
    isPublishedCurrent && !hasPreviewOnlySelections && premiumReviewCount === 0;
  const workspacePublishStatus =
    publishStatus === "live" && hasPreviewOnlySelections ? "stale" : publishStatus;
  const workspacePublishReviewDisabled =
    publishReviewGuardDisabled || workspaceIsPublishedCurrent;
  const workspacePublishReviewDisabledReason =
    publishReviewGuardDisabledReason ??
    (workspaceIsPublishedCurrent ? publishReviewDisabledReason : null);
  const workspaceDiscardDisabled =
    !!conflict ||
    discardAction.busy ||
    (form.isDirty && discardAction.disabled);
  const workspaceDiscardAction = {
    visible: !conflict && (discardAction.visible || hasPreviewOnlySelections),
    disabled: workspaceDiscardDisabled,
    disabledReason: workspaceDiscardDisabled ? discardAction.disabledReason : null,
    busy: discardAction.busy,
  };

  const discardDraftChanges = () => {
    if (workspaceDiscardAction.disabled) return false;
    if (form.isDirty && !discardAction.discard()) return false;
    builderController.resetPreviewOnlySelections();
    return true;
  };

  const moreControl = workspaceDiscardAction.visible || isPublished || !!conflict ? (
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
        {workspaceDiscardAction.visible ? (
          <DropdownMenuItem
            variant="destructive"
            disabled={workspaceDiscardAction.disabled}
            title={workspaceDiscardAction.disabledReason ?? undefined}
            onSelect={() => setDiscardDialogOpen(true)}
          >
            <Undo2 className="size-4" strokeWidth={1.8} aria-hidden />
            {t("page.actions.discardChanges")}
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
        checkoutBlocked={builderController.checkoutBlocked}
        onRemove={builderController.handleRemoveCartItem}
        onClear={builderController.handleClearCart}
        onCheckout={builderController.handleCheckoutCart}
      />
    ) : null;

  const catalogReviewChecking = catalogState.loading || (!catalogState.loaded && !catalogState.error);
  const catalogReviewFailed = !!catalogState.error;
  const contentReadinessIssues = form.publishReadinessIssues;
  const publishReviewBlocked =
    catalogReviewChecking ||
    catalogReviewFailed ||
    hasLockedBlockers ||
    contentReadinessIssues.length > 0;
  const publishNeedsPreparation =
    catalogReviewFailed ||
    hasLockedBlockers ||
    contentReadinessIssues.length > 0;
  const publishActionLabel = workspaceIsPublishedCurrent
    ? t("page.actions.published")
    : publishNeedsPreparation
      ? t("page.actions.preparePublish")
      : publishRetryPending
        ? t("page.actions.retryPublish")
        : form.isDirty
          ? t("page.actions.savePublish")
          : workspacePublishStatus === "stale"
            ? t("page.actions.publishChanges")
            : t("page.actions.publish");
  const publishFailureHint = publishFailure
    ? publishFailure.message || t("page.toasts.publishFailed")
    : null;
  const visibleSectionCount = form.layout.filter((entry) => entry.visible).length;

  const readinessSectionLabel = (type: (typeof contentReadinessIssues)[number]["type"]) => {
    switch (type) {
      case "announcement":
        return t("page.publishReview.readinessSections.announcement");
      case "about":
        return t("page.publishReview.readinessSections.about");
      case "marquee":
        return t("businessPage.sections.marquee.label");
      case "gallery":
        return t("page.publishReview.readinessSections.gallery");
      case "team":
        return t("businessPage.sections.team.label");
      case "testimonials":
        return t("businessPage.sections.testimonials.label");
      case "faq":
        return t("page.publishReview.readinessSections.faq");
    }
  };

  const readinessIssueDetail = (issue: (typeof contentReadinessIssues)[number]) => {
    switch (issue.type) {
      case "announcement":
        return t(
          issue.field === "cta-url"
            ? "businessPage.builder.settings.readiness.announcement.urlTitle"
            : "businessPage.builder.settings.readiness.announcement.title",
        );
      case "about":
        return t("businessPage.builder.settings.readiness.about.title");
      case "gallery":
        return t("businessPage.builder.settings.readiness.gallery.title", {
          count: issue.required,
        });
      case "faq":
        return t("businessPage.builder.settings.readiness.faq.title");
      case "marquee":
        return t("businessPage.builder.summary.servicesProgress", {
          count: issue.current,
          required: issue.required,
        });
      case "team":
        return t("businessPage.builder.summary.membersProgress", {
          count: issue.current,
          required: issue.required,
        });
      case "testimonials":
        return t("businessPage.builder.summary.reviewsProgress", {
          count: issue.current,
          required: issue.required,
        });
    }
  };

  const readinessIssueIcon = (type: (typeof contentReadinessIssues)[number]["type"]) => {
    switch (type) {
      case "announcement":
        return <Megaphone className="size-[18px]" strokeWidth={1.7} />;
      case "about":
        return <TextCursorInput className="size-[18px]" strokeWidth={1.7} />;
      case "marquee":
        return <Rows3 className="size-[18px]" strokeWidth={1.7} />;
      case "gallery":
        return <Images className="size-[18px]" strokeWidth={1.7} />;
      case "team":
        return <Users className="size-[18px]" strokeWidth={1.7} />;
      case "testimonials":
        return <MessageSquareQuote className="size-[18px]" strokeWidth={1.7} />;
      case "faq":
        return <MessagesSquare className="size-[18px]" strokeWidth={1.7} />;
    }
  };

  const readinessIssueAction = (issue: (typeof contentReadinessIssues)[number]) => {
    switch (issue.type) {
      case "announcement":
        return t(
          issue.field === "cta-url"
            ? "businessPage.builder.settings.readiness.announcement.urlAction"
            : "businessPage.builder.settings.readiness.announcement.action",
        );
      case "about":
        return t("businessPage.builder.settings.readiness.about.action");
      case "gallery":
        return t("businessPage.builder.settings.readiness.gallery.action");
      case "faq":
        return t("businessPage.builder.settings.readiness.faq.action");
      default:
        return t("page.publishReview.openSection");
    }
  };

  const reviewBlocker = (issue: (typeof contentReadinessIssues)[number]) => {
    pendingReadinessFocusRef.current = issue;
    handlePublishReviewOpenChange(false);
  };

  const selectIncludedVariant = (type: string, baseVariantKey?: string) => {
    if (!baseVariantKey) return;
    builderController.clearPreviewOnlyVariant(type);
    const index = form.layout.findIndex((entry) => entry.type === type);
    if (index >= 0) form.setSectionVariant(index, baseVariantKey);
  };

  const selectIncludedTheme = (kind: "color" | "font") => {
    const fallback = builderController.themeAssetCatalog
      .filter((asset) => asset.kind === kind && asset.isIncluded && asset.available !== false)
      .sort((left, right) => left.sortOrder - right.sortOrder)[0];
    if (fallback) builderController.handleSelectThemeAsset(fallback);
  };

  const removePremiumChoice = (item: UnlockLineItem) => {
    if (publishPremiumMutationDisabled) return;

    if (item.kind === "variant") {
      const variant = builderController.variantCatalog.find((entry) => entry.id === item.id);
      if (!variant) return;
      const previewed =
        builderController.previewOnlyVariantSelections[variant.sectionType] === variant.variantKey;
      const saved = form.layout.some(
        (entry) =>
          entry.type === variant.sectionType &&
          entry.visible &&
          entry.variant === variant.variantKey,
      );
      builderController.handleRemoveCartItem(item);
      if (previewed) {
        builderController.clearPreviewOnlyVariant(variant.sectionType);
      } else if (saved && controller.permissions.canEdit) {
        const baseVariantKey = builderController.variantCatalog.find(
          (entry) => entry.sectionType === variant.sectionType && entry.isBase,
        )?.variantKey;
        selectIncludedVariant(variant.sectionType, baseVariantKey);
      }
      return;
    }

    if (item.kind === "section") {
      const section = builderController.sectionCatalog.find((entry) => entry.id === item.id);
      if (!section) return;
      const visible = form.layout.some(
        (entry) => entry.type === section.sectionType && entry.visible,
      );
      builderController.handleRemoveCartItem(item);
      if (visible && controller.permissions.canEdit) {
        form.setSectionVisibleByType(section.sectionType, false);
      }
      return;
    }

    const asset = builderController.themeAssetCatalog.find((entry) => entry.id === item.id);
    if (!asset) return;
    const saved = asset.kind === "color"
      ? form.brandColorHex.trim().toLowerCase() === asset.value.trim().toLowerCase()
      : [asset.assetKey, asset.value]
          .map((value) => value.trim().toLowerCase())
          .includes(form.fontKey.trim().toLowerCase());
    builderController.handleRemoveCartItem(item);
    if (saved && controller.permissions.canEdit) selectIncludedTheme(asset.kind);
  };

  const removeUnresolvedPremiumChoice = (blocker: WebsitePublishBlocker) => {
    if (publishPremiumMutationDisabled || !controller.permissions.canEdit) return;
    if (blocker.kind === "color" || blocker.kind === "font") {
      selectIncludedTheme(blocker.kind);
      return;
    }
    if (blocker.kind === "variant") {
      const baseVariantKey = blocker.baseVariantKey ?? builderController.variantCatalog.find(
        (entry) => entry.sectionType === blocker.type && entry.isBase,
      )?.variantKey;
      selectIncludedVariant(blocker.type, baseVariantKey);
      return;
    }
    form.setSectionVisibleByType(blocker.type, false);
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
          publishStatus={workspacePublishStatus}
          saveStatus={saveStatus}
          onSave={draftSave.save}
          saveLabel={draftSave.label}
          saveDisabled={draftSave.disabled}
          saveDisabledReason={draftSave.disabledReason}
          saveBusy={draftSave.busy}
          onPublish={() => setPublishReviewOpen(true)}
          publishLabel={publishActionLabel}
          publishHint={publishFailureHint}
          publishSavesChanges={form.isDirty}
          publishDisabled={workspacePublishReviewDisabled}
          publishDisabledReason={workspacePublishReviewDisabledReason}
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
          publishStatus={workspacePublishStatus}
          saveStatus={saveStatus}
          onBack={() => navigate("/dashboard")}
          onPreview={controller.requestPreview}
          onSave={draftSave.save}
          saveLabel={draftSave.label}
          saveDisabled={draftSave.disabled}
          saveDisabledReason={draftSave.disabledReason}
          saveBusy={draftSave.busy}
          onPublish={() => setPublishReviewOpen(true)}
          publishLabel={publishActionLabel}
          publishHint={publishFailureHint}
          publishSavesChanges={form.isDirty}
          publishDisabled={workspacePublishReviewDisabled}
          publishDisabledReason={workspacePublishReviewDisabledReason}
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

      <Dialog open={publishReviewOpen} onOpenChange={handlePublishReviewOpenChange}>
        <DialogContent
          overlayClassName="z-50 bg-[rgb(23_22_20/45%)] backdrop-blur-[2px]"
          className="website-atelier atelier-publish-dialog z-50 w-[min(660px,calc(100%-2rem))] max-w-[660px] gap-0 rounded-[18px] border-0 p-0"
          onCloseAutoFocus={(event) => {
            const issue = pendingReadinessFocusRef.current;
            if (!issue) return;
            event.preventDefault();
            pendingReadinessFocusRef.current = null;
            controller.focusPublishBlocker(issue.type, issue);
          }}
        >
          <div className="atelier-publish-dialog-scroll website-atelier-scrollbar">
            <DialogHeader className="pr-8 text-left">
            <DialogTitle className="text-[22px] leading-[1.2] tracking-[-0.025em]">
              {catalogReviewChecking
                ? t("page.publishReview.catalogCheckingTitle")
                : catalogReviewFailed
                  ? t("page.publishReview.catalogErrorTitle")
                  : publishReviewBlocked
                    ? t("page.publishReview.blockedTitle")
                    : t("page.publishReview.readyTitle")}
            </DialogTitle>
            <DialogDescription className="max-w-[56ch] pt-1.5 text-[13.5px] leading-[1.55]">
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
            <div className="atelier-publish-checks">
              {contentReadinessIssues.length > 0 ? (
                <section className="atelier-publish-check-group">
                  <div className="atelier-publish-check-heading">
                    <div>
                      <p className="atelier-publish-check-label">
                        {t("page.publishReview.contentRequirements")}
                        <span> · {contentReadinessIssues.length}</span>
                      </p>
                      <p className="atelier-publish-check-helper">
                        {t("page.publishReview.contentRequirementsDescription")}
                      </p>
                    </div>
                  </div>
                  <div className="atelier-publish-check-list">
                    {contentReadinessIssues.map((issue) => (
                      <div
                        key={`readiness-${issue.type}`}
                        className="atelier-publish-check-row atelier-publish-check-row--required"
                      >
                        <span className="atelier-publish-check-icon" aria-hidden>
                          {readinessIssueIcon(issue.type)}
                        </span>
                        <div className="atelier-publish-check-body">
                          <p>{readinessSectionLabel(issue.type)}</p>
                          <span>{readinessIssueDetail(issue)}</span>
                        </div>
                        <div className="atelier-publish-check-actions">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => reviewBlocker(issue)}
                            className="atelier-publish-row-action"
                          >
                            {readinessIssueAction(issue)}
                            <ArrowRight className="size-3.5" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
              {premiumReviewCount > 0 ? (
                <section className="atelier-publish-check-group">
                  <div className="atelier-publish-check-heading">
                    <div>
                      <p className="atelier-publish-check-label">
                        {t("page.publishReview.premiumRequirements")}
                        <span> · {premiumReviewCount}</span>
                      </p>
                      <p className="atelier-publish-check-helper">
                        {t("page.publishReview.premiumRequirementsDescription")}
                      </p>
                    </div>
                  </div>
                  <div className="atelier-publish-check-list atelier-publish-check-list--premium">
                    {publishUnlockItems.map((unlockItem) => {
                      const premiumKindLabel = unlockItem.kind === "variant"
                        ? t("page.publishReview.premiumStyle")
                        : unlockItem.kind === "section"
                          ? t("page.publishReview.premiumSection")
                          : unlockItem.kind === "color"
                            ? t("businessPage.theme.accentColor")
                            : t("businessPage.theme.fontLabel");
                      const queued = builderController.cartItems.some(
                        (item) => item.key === unlockItem.key,
                      );

                      return (
                        <div
                          key={unlockItem.key}
                          className="atelier-publish-check-row atelier-publish-check-row--premium"
                        >
                          <UnlockSpecimen entry={unlockItem} />
                          <div className="atelier-publish-check-body">
                            <p>{unlockItem.name}</p>
                            <span>{premiumKindLabel}</span>
                          </div>
                          <span className="atelier-publish-check-price">
                            {variantPriceLabel(formatPrice, unlockItem)}
                          </span>
                          <div className="atelier-publish-check-actions">
                            {queued || controller.permissions.canEdit ? (
                              <button
                                type="button"
                                disabled={publishPremiumMutationDisabled}
                                onClick={() => removePremiumChoice(unlockItem)}
                                aria-label={t("businessPage.paidVariants.unlocks.removeAria", {
                                  name: unlockItem.name,
                                })}
                                className="website-atelier-focus atelier-unlock-remove atelier-publish-remove-choice relative grid size-8 shrink-0 place-items-center rounded-full text-[var(--atelier-muted-soft)] outline-none transition-colors hover:bg-[var(--atelier-field)] hover:text-[var(--atelier-ink)] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <X className="size-3.5" strokeWidth={1.9} aria-hidden />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                    {unresolvedPublishBlockers.map((publishBlocker) => {
                      const premiumKindLabel = publishBlocker.kind === "variant"
                        ? t("page.publishReview.premiumStyle")
                        : publishBlocker.kind === "section"
                          ? t("page.publishReview.premiumSection")
                          : publishBlocker.kind === "color"
                            ? t("businessPage.theme.accentColor")
                            : t("businessPage.theme.fontLabel");
                      const PremiumFallbackIcon = publishBlocker.kind === "color"
                        ? Palette
                        : publishBlocker.kind === "font"
                          ? Type
                          : LayoutTemplate;
                      return (
                        <div
                          key={publishBlocker.key}
                          className="atelier-publish-check-row atelier-publish-check-row--premium"
                        >
                          <span className="atelier-publish-specimen-fallback" aria-hidden>
                            <PremiumFallbackIcon className="size-[18px]" strokeWidth={1.7} />
                          </span>
                          <div className="atelier-publish-check-body">
                            <p>{publishBlocker.name}</p>
                            <span>{premiumKindLabel}</span>
                          </div>
                          <span />
                          <div className="atelier-publish-check-actions">
                            {controller.permissions.canEdit ? (
                              <button
                                type="button"
                                disabled={publishPremiumMutationDisabled}
                                onClick={() => removeUnresolvedPremiumChoice(publishBlocker)}
                                aria-label={t("page.publishReview.removePremiumAria", {
                                  name: publishBlocker.name,
                                })}
                                className="website-atelier-focus atelier-unlock-remove atelier-publish-remove-choice relative grid size-8 shrink-0 place-items-center rounded-full text-[var(--atelier-muted-soft)] outline-none transition-colors hover:bg-[var(--atelier-field)] hover:text-[var(--atelier-ink)] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <X className="size-3.5" strokeWidth={1.9} aria-hidden />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {!showPublishUnlockSummary && form.isDirty ? (
                    <p
                      id="publish-review-checkout-note"
                      className="atelier-publish-checkout-note"
                      role="status"
                    >
                      {publishCheckoutSaveBlocked
                        ? draftSave.disabledReason
                        : t("page.publishReview.saveAndUnlockHint")}
                    </p>
                  ) : !showPublishUnlockSummary && publishUnlockHasMixedCurrencies ? (
                    <p className="atelier-publish-checkout-note" role="status">
                      {t("page.publishReview.mixedCurrency")}
                    </p>
                  ) : null}
                </section>
              ) : null}
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
          </div>

          {!catalogReviewChecking && !catalogReviewFailed && showPublishUnlockSummary ? (
            <div className="atelier-publish-unlock-summary">
              {form.isDirty ? (
                <p
                  id="publish-review-checkout-note"
                  className="atelier-publish-checkout-note"
                  role="status"
                >
                  {publishCheckoutSaveBlocked
                    ? draftSave.disabledReason
                    : t("page.publishReview.saveAndUnlockHint")}
                </p>
              ) : publishUnlockHasMixedCurrencies ? (
                <p className="atelier-publish-checkout-note" role="status">
                  {t("page.publishReview.mixedCurrency")}
                </p>
              ) : null}
              <div className="atelier-publish-unlock-total">
                <span>{t("businessPage.paidVariants.unlocks.totalLabel")}</span>
                <strong>{publishUnlockTotal}</strong>
              </div>
              <Button
                type="button"
                disabled={publishUnlockCheckoutDisabled || publishUnlockHasMixedCurrencies}
                aria-describedby={form.isDirty ? "publish-review-checkout-note" : undefined}
                aria-busy={
                  publishCheckoutTarget === "all" &&
                  (builderController.isVariantCheckoutLoading ||
                    pendingPublishCheckout != null)
                }
                onClick={() => {
                  requestPublishCheckout("all", publishUnlockItems);
                }}
                className="atelier-publish-unlock-all"
              >
                {publishCheckoutTarget === "all" &&
                (builderController.isVariantCheckoutLoading ||
                  pendingPublishCheckout != null) ? (
                  <Spinner size="sm" color="white" />
                ) : (
                  t(
                    form.isDirty
                      ? "page.publishReview.saveAndUnlockAll"
                      : "businessPage.paidVariants.unlocks.completeWithTotal",
                    {
                      count: publishUnlockItems.length,
                      total: publishUnlockTotal,
                    },
                  )
                )}
              </Button>
              <p>{t("businessPage.paidVariants.unlocks.secureNote")}</p>
            </div>
          ) : null}

          {!publishReviewBlocked ? (
            <DialogFooter className="atelier-publish-footer flex-row items-center justify-between sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPublishReviewOpen(false)}
                className="h-9 rounded-[10px] px-3.5 text-[12.5px] text-[var(--atelier-muted)]"
              >
                {t("page.publishReview.cancel")}
              </Button>
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
                {form.isDirty
                  ? t("page.actions.savePublish")
                  : publishRetryPending
                    ? t("page.actions.retryPublish")
                    : t("page.publishReview.publishWebsite")}
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Save keeps the blocked destination pending until the versioned PUT is acknowledged. */}
      <UnsavedWebsiteChangesDialog
        open={blocker.isBlocked}
        onSaveAndLeave={draftSave.save}
        onDiscardAndLeave={() => {
          if (discardDraftChanges()) blocker.discard();
        }}
        onKeepEditing={blocker.stay}
        saveDisabled={draftSave.disabled}
        saveBusy={isSaving}
        saveLabel={
          draftSave.mode === "retry"
            ? t("page.unsaved.retrySaveAndLeave")
            : t("page.unsaved.saveAndLeave")
        }
        saveFeedback={
          form.canRetrySave
            ? t("page.save.failed")
            : form.isDirty
              ? draftSave.disabledReason
              : t("page.unsaved.updateInProgress")
        }
        discardDisabled={workspaceDiscardAction.disabled}
      />

      {/* Same-page revert: restore the last acknowledged server baseline without writing. */}
      <ConfirmDialog
        open={discardDialogOpen}
        onConfirm={discardDraftChanges}
        onCancel={() => setDiscardDialogOpen(false)}
        onOpenChange={setDiscardDialogOpen}
        title={t("page.discardConfirm.title")}
        description={t("page.discardConfirm.description")}
        confirmTitle={t("page.discardConfirm.confirm")}
        confirmDisabled={workspaceDiscardAction.disabled}
        confirmBusy={workspaceDiscardAction.busy}
        cancelTitle={t("page.discardConfirm.cancel")}
        variant="destructive"
        icon={Undo2}
        iconBgColor="transparent"
        iconColor="text-destructive"
        showCloseButton
        className="website-atelier atelier-confirm-dialog"
        cancelClassName="w-auto md:w-36"
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
