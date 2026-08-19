import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import type { WebsiteBuilderLocation, WebsiteDraft } from "../types";
import { websiteToast as toast } from "../websiteToast";
import {
  clearWebsiteConflictAction,
  cancelWebsiteMutationIntentsAction,
  fetchWebsiteBuilderAction,
  fetchWebsiteVariantCatalogAction,
  publishWebsiteAction,
  saveWebsiteDraftAction,
  unpublishWebsiteAction,
} from "../actions";
import {
  selectWebsiteAccess,
  selectWebsiteCatalogLoaded,
  selectWebsiteCatalogLoading,
  selectWebsiteCatalogError,
  selectWebsiteConflict,
  selectWebsiteHeroMutating,
  selectWebsiteLastSavedRequestId,
  selectWebsiteLoading,
  selectWebsiteError,
  selectWebsiteSaveFailure,
  selectWebsitePublish,
  selectWebsitePublishFailure,
  selectWebsitePublishLockedItems,
  selectWebsitePublishing,
  selectWebsiteSaving,
  selectWebsiteSectionCatalog,
  selectWebsiteUnpublishing,
  selectWebsiteThemeAssetCatalog,
  selectWebsiteVariantCatalog,
} from "../selectors";
import { useWebsiteDraft } from "./useWebsiteDraft";
import { useCheckoutReturn } from "./useCheckoutReturn";
import { useUnsavedChangesBlocker } from "../../../shared/hooks/useUnsavedChangesBlocker";
import {
  localizeWebsiteSectionCatalog,
  localizeWebsiteVariantCatalog,
} from "../components/builder/catalogCopy";
import { BRAND_ACCENT_CATALOG } from "../components/builder/theme";
import type {
  AtelierPublishStatus,
  AtelierSaveStatus,
} from "../components/atelier/WebsiteAtelierHeader";
import type { WebsiteReadinessIssue } from "../components/builder/sectionReadiness";
import type { WebsiteDraftIssue } from "../components/builder/draftValidation";
import type {
  ReconciledCheckoutIntent,
  WebsiteCheckoutReturnContext,
} from "../checkoutIntent";

export interface WebsiteSectionFocusRequest {
  type: string;
  nonce: number;
  readinessIssue?: WebsiteReadinessIssue;
  blockingIssue?: WebsiteDraftIssue;
}

export interface WebsitePublishBlocker {
  key: string;
  type: string;
  name: string;
  kind: "section" | "variant" | "color" | "font";
  catalogId: number;
  baseVariantKey?: string;
  /** True when the option changes only the local preview and is not part of the saved draft. */
  previewOnly?: boolean;
}

interface UseWebsiteWorkspaceControllerOptions {
  draft: WebsiteDraft;
  locations: WebsiteBuilderLocation[];
  defaultAboutStory?: string | null;
}

/**
 * Connected controller for the Website workspace chrome.
 *
 * The Atelier components consume this model but do not own draft, concurrency,
 * publish, checkout-return, or navigation-blocking behavior. Keeping those
 * paths here lets the desktop and mobile presentations share one real state
 * machine while the visual workspace is replaced incrementally.
 */
export function useWebsiteWorkspaceController({
  draft,
  locations,
  defaultAboutStory,
}: UseWebsiteWorkspaceControllerOptions) {
  const { t } = useTranslation("website");
  const dispatch = useDispatch();
  const access = useSelector(selectWebsiteAccess);
  const isSaving = useSelector(selectWebsiteSaving);
  const isLoading = useSelector(selectWebsiteLoading);
  const loadError = useSelector(selectWebsiteError);
  const isHeroMutating = useSelector(selectWebsiteHeroMutating);
  const conflict = useSelector(selectWebsiteConflict);
  const lastSavedRequestId = useSelector(selectWebsiteLastSavedRequestId);
  const saveFailure = useSelector(selectWebsiteSaveFailure);
  const publish = useSelector(selectWebsitePublish);
  const publishFailure = useSelector(selectWebsitePublishFailure);
  const isPublishing = useSelector(selectWebsitePublishing);
  const isUnpublishing = useSelector(selectWebsiteUnpublishing);
  const rawVariantCatalog = useSelector(selectWebsiteVariantCatalog);
  const rawSectionCatalog = useSelector(selectWebsiteSectionCatalog);
  const themeAssetCatalog = useSelector(selectWebsiteThemeAssetCatalog);
  const catalogLoaded = useSelector(selectWebsiteCatalogLoaded);
  const catalogLoading = useSelector(selectWebsiteCatalogLoading);
  const catalogError = useSelector(selectWebsiteCatalogError);
  const serverLockedItems = useSelector(selectWebsitePublishLockedItems);
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
  const [focusSection, setFocusSection] = useState<WebsiteSectionFocusRequest | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [replaceConflictVersion, setReplaceConflictVersion] = useState<number | null>(null);
  const [reloadConflictVersion, setReloadConflictVersion] = useState<number | null>(null);
  const [publishReviewCheckoutSaveRequestId, setPublishReviewCheckoutSaveRequestId] =
    useState<string | null>(null);

  const canEdit = !!access?.canEdit;
  const canPurchase = !!access?.canPurchase;
  const canPublish = !!access?.canPublish;

  const variantCatalog = useMemo(
    () => localizeWebsiteVariantCatalog(rawVariantCatalog, t),
    [rawVariantCatalog, t],
  );
  const sectionCatalog = useMemo(
    () => localizeWebsiteSectionCatalog(rawSectionCatalog, t),
    [rawSectionCatalog, t],
  );

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
    defaultAboutStory,
    lastSavedRequestId,
    onSave,
    onPublish,
    locations,
    saveEnabled: canEdit,
    isSaving,
    mutationBusy: isLoading || isSaving || isHeroMutating || isPublishing || isUnpublishing,
    conflict,
    saveFailure,
  });
  const handleReconcileCheckoutSelections = useCallback(
    (
      selections: Pick<
        ReconciledCheckoutIntent,
        "variantSelections" | "themeSelections"
      >,
      returnContext: WebsiteCheckoutReturnContext | null,
    ) => {
      const requestId = form.applyOwnedCheckoutSelections(selections);
      setPublishReviewCheckoutSaveRequestId(
        returnContext === "publish-review" && typeof requestId === "string"
          ? requestId
          : null,
      );
    },
    [form.applyOwnedCheckoutSelections],
  );
  const checkoutReturn = useCheckoutReturn({
    onReconcileSelections: handleReconcileCheckoutSelections,
  });

  const checkoutSelectionSaveSettled =
    publishReviewCheckoutSaveRequestId === null ||
    (lastSavedRequestId === publishReviewCheckoutSaveRequestId &&
      form.saveStatus === "clean" &&
      !form.isDirty) ||
    saveFailure?.requestId === publishReviewCheckoutSaveRequestId ||
    conflict != null;
  const checkoutReturnResumePublishReview =
    checkoutReturn.resumePublishReview && checkoutSelectionSaveSettled;
  const consumeCheckoutReturnPublishReview = useCallback(() => {
    checkoutReturn.consumePublishReviewResume();
    setPublishReviewCheckoutSaveRequestId(null);
  }, [checkoutReturn.consumePublishReviewResume]);

  const isPublished = publish?.isPublished ?? false;
  const hasUnpublishedChanges =
    isPublished &&
    (form.isDirty ||
      (publish?.publishedVersion != null &&
        draft.version > publish.publishedVersion));
  const isPublishedCurrent = isPublished && !hasUnpublishedChanges;
  const publishBusy = isPublishing || isUnpublishing;
  const publishBlockers = useMemo<WebsitePublishBlocker[]>(() => {
    if (!catalogLoaded) return [];

    const variantByKey = new Map(
      variantCatalog.map((entry) => [
        `${entry.sectionType}:${entry.variantKey}`,
        entry,
      ]),
    );
    const sectionByType = new Map(
      sectionCatalog.map((entry) => [entry.sectionType, entry]),
    );
    const baseVariantByType = new Map(
      variantCatalog
        .filter((entry) => entry.isBase)
        .map((entry) => [entry.sectionType, entry.variantKey]),
    );
    const blockers: WebsitePublishBlocker[] = [];

    for (const entry of form.layout) {
      if (!entry.visible) continue;
      const section = sectionByType.get(entry.type);
      if (section && section.priceMinor > 0 && !section.owned) {
        blockers.push({
          key: `section-${entry.type}`,
          type: entry.type,
          name: section.name,
          kind: "section",
          catalogId: section.id,
        });
        continue;
      }

      const variant = variantByKey.get(`${entry.type}:${entry.variant}`);
      if (variant && variant.priceMinor > 0 && !variant.owned) {
        blockers.push({
          key: `variant-${entry.type}`,
          type: entry.type,
          name: variant.name,
          kind: "variant",
          catalogId: variant.id,
          baseVariantKey: baseVariantByType.get(entry.type),
        });
      }
    }

    const selectedThemeAssets = themeAssetCatalog.filter((asset) =>
      asset.kind === "color"
        ? (form.brandColorKey && asset.assetKey === form.brandColorKey) ||
          (!form.brandColorKey && asset.value.toLowerCase() === form.brandColorHex.toLowerCase())
        : asset.assetKey === form.fontKey,
    );
    selectedThemeAssets
      .filter((asset) => !asset.isIncluded && !asset.owned)
      .forEach((asset) => {
        blockers.push({
          key: `${asset.kind}-${asset.assetKey}`,
          type: asset.kind,
          name: asset.name,
          kind: asset.kind,
          catalogId: asset.id,
        });
      });

    // Keep the server's structured E07/save-time ownership proof as a fallback. A previously
    // selected asset may be deactivated, in which case it deliberately disappears from the catalog;
    // without these details the owner would see Publish become ready and hit E07 forever.
    for (const item of serverLockedItems?.unownedSections ?? []) {
      const selected = form.layout.some((entry) => entry.type === item.sectionType && entry.visible);
      const key = `section-${item.sectionType}`;
      if (!selected || blockers.some((blocker) => blocker.key === key)) continue;
      const catalogItem = sectionByType.get(item.sectionType);
      if (catalogItem && (catalogItem.owned || catalogItem.priceMinor <= 0)) continue;
      blockers.push({
        key,
        type: item.sectionType,
        name: item.name,
        kind: "section",
        catalogId: catalogItem?.id ?? 0,
      });
    }
    for (const item of serverLockedItems?.unownedVariants ?? []) {
      const selected = form.layout.some(
        (entry) =>
          entry.type === item.sectionType &&
          entry.variant === item.variantKey &&
          entry.visible,
      );
      const key = `variant-${item.sectionType}`;
      if (!selected || blockers.some((blocker) => blocker.key === key)) continue;
      const catalogItem = variantByKey.get(`${item.sectionType}:${item.variantKey}`);
      if (catalogItem && (catalogItem.owned || catalogItem.priceMinor <= 0)) continue;
      blockers.push({
        key,
        type: item.sectionType,
        name: item.name,
        kind: "variant",
        catalogId: catalogItem?.id ?? 0,
        baseVariantKey: baseVariantByType.get(item.sectionType),
      });
    }
    for (const item of serverLockedItems?.unownedThemeAssets ?? []) {
      const canonicalColorValue =
        item.value ??
        BRAND_ACCENT_CATALOG.find((accent) => accent.key === item.assetKey)?.hex;
      const selected =
        item.kind === "color"
          ? form.brandColorKey === item.assetKey ||
            (!form.brandColorKey &&
              !!canonicalColorValue &&
              form.brandColorHex.toLowerCase() === canonicalColorValue.toLowerCase())
          : form.fontKey === item.assetKey;
      const key = `${item.kind}-${item.assetKey}`;
      if (!selected || blockers.some((blocker) => blocker.key === key)) continue;
      const catalogItem = themeAssetCatalog.find(
        (asset) => asset.id === item.id || (asset.kind === item.kind && asset.assetKey === item.assetKey),
      );
      if (
        catalogItem &&
        (catalogItem.owned || catalogItem.isIncluded || catalogItem.priceMinor <= 0)
      ) continue;
      blockers.push({
        key,
        type: item.kind,
        name: catalogItem?.name ?? item.name,
        kind: item.kind,
        catalogId: catalogItem?.id ?? item.id,
      });
    }

    return blockers;
  }, [
    catalogLoaded,
    form.brandColorHex,
    form.brandColorKey,
    form.fontKey,
    form.layout,
    sectionCatalog,
    serverLockedItems,
    themeAssetCatalog,
    variantCatalog,
  ]);

  const hasLockedBlockers = publishBlockers.length > 0;
  const saveRecoveryRequired = !form.isOnline || form.canRetrySave;
  const saveBusy = isLoading || isSaving || isHeroMutating || isPublishing || isUnpublishing;
  const saveDisabled = !form.canSaveChanges;
  const saveMode = form.canRetrySave ? "retry" as const : "save" as const;
  const saveLabel = form.canRetrySave
    ? t("page.actions.retrySave")
    : t("page.actions.saveChanges");
  const saveDisabledReason = !saveDisabled
    ? null
    : !canEdit
      ? t("page.saveReason.readOnly")
      : !!conflict
        ? t("page.saveReason.conflict")
        : saveBusy || form.saveStatus === "saving" || form.saveStatus === "queued"
          ? t("page.saveReason.busy")
          : form.hasBlockingErrors
            ? t("page.saveReason.errors")
            : !form.isOnline
              ? t("page.saveReason.offline")
              : !form.isDirty
                ? t("page.saveReason.clean")
                : t("page.saveReason.busy");
  const publishDisabled =
    !canPublish ||
    !catalogLoaded ||
    catalogLoading ||
    !!catalogError ||
    form.hasPublishReadinessIssues ||
    form.hasBlockingErrors ||
    !!conflict ||
    saveRecoveryRequired ||
    publishBusy ||
    isSaving ||
    isHeroMutating ||
    isLoading ||
    isPublishedCurrent;
  const publishDisabledReason = !publishDisabled
    ? null
    : !canPublish
      ? t("page.publishReason.readOnly")
      : catalogLoading || (!catalogLoaded && !catalogError)
        ? t("page.publishReason.catalogChecking")
        : catalogError
          ? t("page.publishReason.catalogUnavailable")
          : form.hasBlockingErrors
            ? t("page.publishReason.errors")
            : form.hasPublishReadinessIssues
              ? t("page.publishReason.contentIncomplete")
              : !form.isOnline
                ? t("page.publishReason.offline")
                : form.canRetrySave
                  ? t("page.publishReason.saveFailed")
                  : !!conflict || publishBusy || isSaving || isHeroMutating || isLoading
                    ? t("page.publishReason.busy")
                    : t("page.publishReason.current");

  // Catalog, content-readiness, and field-validation blockers belong inside Publish review so the
  // owner can understand and repair them. Offline/conflicted/busy work still disables the trigger.
  // The final publish action remains guarded by `publishDisabled` above.
  const publishReviewGuardDisabled =
    !canPublish ||
    !!conflict ||
    saveRecoveryRequired ||
    publishBusy ||
    isSaving ||
    isHeroMutating ||
    isLoading;
  const publishReviewGuardDisabledReason = !publishReviewGuardDisabled
    ? null
    : !canPublish
      ? t("page.publishReason.readOnly")
      : !form.isOnline
        ? t("page.publishReason.offline")
        : form.canRetrySave
          ? t("page.publishReason.saveFailed")
          : !!conflict
            ? t("page.publishReason.conflict")
            : publishBusy || isSaving || isHeroMutating || isLoading
              ? t("page.publishReason.busy")
              : null;
  const publishReviewDisabled =
    publishReviewGuardDisabled || (isPublishedCurrent && !form.hasBlockingErrors);
  const publishReviewDisabledReason =
    publishReviewGuardDisabledReason ??
    (isPublishedCurrent && !form.hasBlockingErrors
      ? t("page.publishReason.current")
      : null);

  const discardBusy =
    isLoading ||
    isSaving ||
    isHeroMutating ||
    publishBusy ||
    form.saveStatus === "saving" ||
    form.saveStatus === "queued";
  const discardVisible = form.isDirty && !conflict;
  const discardDisabled =
    !canEdit ||
    !form.isDirty ||
    !!conflict ||
    discardBusy;
  const discardDisabledReason = !discardDisabled
    ? null
    : !canEdit
      ? t("page.saveReason.readOnly")
      : !!conflict
        ? t("page.saveReason.conflict")
        : discardBusy
          ? t("page.saveReason.busy")
          : null;

  // Guard only when leaving would lose something: real edits (isDirty covers dirty/invalid/
  // offline/failed/conflict once there are changes) or a write still in flight. A load-time
  // validation issue on an untouched draft (saveStatus "invalid" without isDirty) must not
  // arm the prompt — there is nothing new to lose.
  const navigationBlocker = useUnsavedChangesBlocker({
    when:
      form.isDirty ||
      form.saveStatus === "saving" ||
      form.saveStatus === "queued" ||
      isHeroMutating ||
      isPublishing ||
      isUnpublishing,
    proceedWhen:
      form.saveStatus === "clean" &&
      !isHeroMutating &&
      !isPublishing &&
      !isUnpublishing,
  });

  const confirmUnpublish = useCallback(() => {
    // Mirrors the menu gate: unpublish is content control, open to any editing owner.
    if (!canEdit || publishBusy) return;
    setUnpublishDialogOpen(false);
    dispatch(unpublishWebsiteAction.request());
  }, [canEdit, dispatch, publishBusy]);

  const retryCatalog = useCallback(() => {
    dispatch(fetchWebsiteVariantCatalogAction.request());
  }, [dispatch]);

  const discardChanges = useCallback(() => {
    if (discardDisabled) return false;
    dispatch(cancelWebsiteMutationIntentsAction());
    form.resetToBaseline();
    return true;
  }, [discardDisabled, dispatch, form]);

  /** Leave-guard escape hatch: unlike the same-page revert, this stays available while a write is
   * in flight or queued, so a stalled save can never lock the owner on the page (native has no
   * tab to close). Cancelling bumps the mutation generation: a late result is suppressed and the
   * lane refetches server truth; only an unresolved conflict still needs its own decision. */
  const discardChangesAndLeave = useCallback(() => {
    if (conflict) return false;
    dispatch(cancelWebsiteMutationIntentsAction());
    form.resetToBaseline();
    return true;
  }, [conflict, dispatch, form]);

  const clearConflict = useCallback(() => {
    dispatch(clearWebsiteConflictAction());
  }, [dispatch]);

  const reloadLatest = useCallback(() => {
    if (!conflict || isLoading) return;
    form.acceptNextServerBaseline();
    setReloadConflictVersion(conflict.currentVersion);
    setReplaceConflictVersion(null);
    dispatch(fetchWebsiteBuilderAction.request());
  }, [conflict, dispatch, form, isLoading]);

  /** Keep the local working copy, but first fetch the authoritative latest version. The
   * conflict remains active while that GET runs, so no queued mutation can overwrite it. */
  const prepareReplaceLatest = useCallback(() => {
    if (!conflict) return;
    // A failed reload attempt may have armed baseline adoption. Keep-local explicitly
    // reverses that choice before its proof GET so the working copy cannot be discarded.
    form.preserveWorkingValuesOnNextServerBaseline();
    setReloadConflictVersion(null);
    setReplaceConflictVersion(conflict.currentVersion);
    dispatch(fetchWebsiteBuilderAction.request());
  }, [conflict, dispatch, form]);

  /** The second, explicit decision in the keep-local path. Redux dispatch is synchronous:
   * clear the stale conflict before enqueueing the full local snapshot, then let the saga
   * inject the freshly fetched draft version as expectedVersion. */
  const confirmReplaceLatest = useCallback(() => {
    if (!conflict || replaceConflictVersion !== conflict.currentVersion) return;
    dispatch(clearWebsiteConflictAction());
    setReplaceConflictVersion(null);
    form.replaceLatestWithLocal();
  }, [conflict, dispatch, form, replaceConflictVersion]);

  const cancelReplaceLatest = useCallback(() => {
    setReplaceConflictVersion(null);
  }, []);

  const focusPublishBlocker = useCallback((
    type: string,
    readinessIssue?: WebsiteReadinessIssue,
  ) => {
    setFocusSection((current) => ({
      type,
      nonce: (current?.nonce ?? 0) + 1,
      readinessIssue,
    }));
  }, []);

  const focusBlockingIssue = useCallback((blockingIssue: WebsiteDraftIssue) => {
    setFocusSection((current) => ({
      type: blockingIssue.type,
      nonce: (current?.nonce ?? 0) + 1,
      blockingIssue,
    }));
  }, []);

  const requestPreview = useCallback(() => {
    setPreviewOpen(true);
  }, []);

  const saveStatusMap: Record<typeof form.saveStatus, AtelierSaveStatus> = {
    clean: "saved",
    dirty: "unsaved",
    invalid: "invalid",
    saving: "saving",
    queued: "queued",
    offline: "offline",
    failed: "failed",
    conflict: "conflict",
  };
  const saveStatus = saveStatusMap[form.saveStatus];
  const publishStatus: AtelierPublishStatus = isPublished
    ? hasUnpublishedChanges
      ? "stale"
      : "live"
    : "draft";
  const preparingLocalReplacement =
    !!conflict && replaceConflictVersion === conflict.currentVersion;
  const reloadingLatest =
    !!conflict && reloadConflictVersion === conflict.currentVersion;
  const conflictVersionProved =
    !!conflict && draft.version >= conflict.currentVersion;
  const reloadProofFailed =
    reloadingLatest && !isLoading && (!!loadError || !conflictVersionProved);
  const replacementProofFailed =
    preparingLocalReplacement &&
    !isLoading &&
    !loadError &&
    !conflictVersionProved;

  useEffect(() => {
    if (!reloadingLatest || isLoading) return;
    if (loadError || !conflictVersionProved) return;

    dispatch(clearWebsiteConflictAction());
    toast.success(t("page.toasts.latestVersionLoaded"), {
      id: "website-latest-version-loaded",
    });
  }, [conflictVersionProved, dispatch, isLoading, loadError, reloadingLatest, t]);

  const conflictDialogOpen =
    !!conflict &&
    ((!preparingLocalReplacement && !reloadingLatest) ||
      !!loadError ||
      reloadProofFailed ||
      replacementProofFailed);
  const replaceConflictDialogOpen =
    preparingLocalReplacement &&
    !isLoading &&
    !loadError &&
    conflictVersionProved;

  return {
    form,
    checkoutReturnState: checkoutReturn.state,
    checkoutReturnBlocksNewCheckout: checkoutReturn.blocksNewCheckout,
    checkoutReturnBusinessMismatch: checkoutReturn.returnBusinessMismatch,
    checkoutReturnResumePublishReview,
    consumeCheckoutReturnPublishReview,
    retryCheckoutReturn: checkoutReturn.retry,
    permissions: {
      canEdit,
      canPurchase,
      canPublish,
    },
    mutations: {
      isSaving,
      isLoading,
      isHeroMutating,
      isPublishing,
      isUnpublishing,
      publishBusy,
    },
    publication: {
      publish,
      failure: publishFailure,
      retryPending: publishFailure != null,
      isPublished,
      hasUnpublishedChanges,
      isPublishedCurrent,
      status: publishStatus,
      disabled: publishDisabled,
      disabledReason: publishDisabledReason,
      reviewDisabled: publishReviewDisabled,
      reviewDisabledReason: publishReviewDisabledReason,
      reviewGuardDisabled: publishReviewGuardDisabled,
      reviewGuardDisabledReason: publishReviewGuardDisabledReason,
    },
    saveStatus,
    draftSave: {
      mode: saveMode,
      label: saveLabel,
      disabled: saveDisabled,
      disabledReason: saveDisabledReason,
      busy: isSaving,
      save: form.canRetrySave ? form.retrySave : form.saveChanges,
      saveWithReceipt: form.canRetrySave
        ? form.retrySaveWithReceipt
        : form.saveChangesWithReceipt,
      lastSavedRequestId,
      failure: saveFailure,
      conflict,
    },
    discardAction: {
      visible: discardVisible,
      disabled: discardDisabled,
      disabledReason: discardDisabledReason,
      busy: discardBusy,
      discard: discardChanges,
      discardAndLeave: discardChangesAndLeave,
    },
    publishBlockers,
    hasLockedBlockers,
    serverLockedItems,
    catalogState: {
      loaded: catalogLoaded,
      loading: catalogLoading,
      error: catalogError,
      retry: retryCatalog,
    },
    focusSection,
    focusPublishBlocker,
    focusBlockingIssue,
    previewOpen,
    setPreviewOpen,
    requestPreview,
    navigationBlocker,
    conflict,
    conflictDialogOpen,
    replaceConflictDialogOpen,
    clearConflict,
    reloadLatest,
    prepareReplaceLatest,
    confirmReplaceLatest,
    cancelReplaceLatest,
    unpublishDialogOpen,
    setUnpublishDialogOpen,
    confirmUnpublish,
  };
}

export type WebsiteWorkspaceController = ReturnType<
  typeof useWebsiteWorkspaceController
>;
