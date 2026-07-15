import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { WebsiteDraft } from "../types";
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

export interface WebsitePublishBlocker {
  key: string;
  type: string;
  name: string;
  kind: "section" | "variant" | "color" | "font";
  catalogId: number;
  baseVariantKey?: string;
}

interface UseWebsiteWorkspaceControllerOptions {
  draft: WebsiteDraft;
  locationIds: readonly number[];
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
  locationIds,
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
  const [focusSection, setFocusSection] = useState<{
    type: string;
    nonce: number;
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [replaceConflictVersion, setReplaceConflictVersion] = useState<number | null>(null);
  const [reloadConflictVersion, setReloadConflictVersion] = useState<number | null>(null);

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
    lastSavedRequestId,
    onSave,
    onPublish,
    allowedLocationIds: locationIds,
    autosaveEnabled: canEdit,
    isSaving,
    mutationBusy: isLoading || isSaving || isHeroMutating || isPublishing || isUnpublishing,
    conflict,
    saveFailure,
  });
  const checkoutReturn = useCheckoutReturn({
    onReconcileVariantSelections: form.applyOwnedVariantSelections,
    onReconcileThemeSelections: form.applyOwnedThemeSelections,
  });

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
  const saveRecoveryRequired = !form.isOnline || form.canRetryAutosave;
  const publishDisabled =
    !canPublish ||
    !catalogLoaded ||
    catalogLoading ||
    !!catalogError ||
    form.hasBlockingErrors ||
    !!conflict ||
    saveRecoveryRequired ||
    publishBusy ||
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
          : !form.isOnline
            ? t("page.publishReason.offline")
            : form.canRetryAutosave
              ? t("page.publishReason.saveFailed")
          : !!conflict || publishBusy || isLoading
            ? t("page.publishReason.busy")
            : t("page.publishReason.current");

  // Catalog loading/failure belongs inside Publish review, where the owner can see the
  // checking state or invoke the real retry action. Invalid/offline/conflicted work still
  // disables the trigger because opening a review would incorrectly imply readiness.
  const publishReviewDisabled =
    !canPublish ||
    form.hasBlockingErrors ||
    !!conflict ||
    saveRecoveryRequired ||
    publishBusy ||
    isLoading ||
    isPublishedCurrent;
  const publishReviewDisabledReason = !publishReviewDisabled
    ? null
    : !canPublish
      ? t("page.publishReason.readOnly")
      : form.hasBlockingErrors
        ? t("page.publishReason.errors")
        : !form.isOnline
          ? t("page.publishReason.offline")
          : form.canRetryAutosave
            ? t("page.publishReason.saveFailed")
            : !!conflict || publishBusy || isLoading
              ? t("page.publishReason.busy")
              : t("page.publishReason.current");

  const navigationBlocker = useUnsavedChangesBlocker({
    when:
      form.autosaveStatus === "dirty" ||
      form.autosaveStatus === "invalid" ||
      form.autosaveStatus === "saving" ||
      form.autosaveStatus === "queued" ||
      form.autosaveStatus === "offline" ||
      form.autosaveStatus === "failed" ||
      form.autosaveStatus === "conflict" ||
      isHeroMutating ||
      isPublishing ||
      isUnpublishing,
    proceedWhen:
      form.autosaveStatus === "clean" &&
      !isHeroMutating &&
      !isPublishing &&
      !isUnpublishing,
  });

  const confirmUnpublish = useCallback(() => {
    if (!canPublish || publishBusy) return;
    setUnpublishDialogOpen(false);
    dispatch(unpublishWebsiteAction.request());
  }, [canPublish, dispatch, publishBusy]);

  const retryCatalog = useCallback(() => {
    dispatch(fetchWebsiteVariantCatalogAction.request());
  }, [dispatch]);

  const discardChanges = useCallback(() => {
    dispatch(cancelWebsiteMutationIntentsAction());
    form.resetToBaseline();
  }, [dispatch, form]);

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

  const focusPublishBlocker = useCallback((type: string) => {
    setFocusSection((current) => ({
      type,
      nonce: (current?.nonce ?? 0) + 1,
    }));
  }, []);

  const requestPreview = useCallback(() => {
    setPreviewOpen(true);
  }, []);

  const saveStatusMap: Record<typeof form.autosaveStatus, AtelierSaveStatus> = {
    clean: "saved",
    dirty: "unsaved",
    invalid: "invalid",
    saving: "saving",
    queued: "queued",
    offline: "offline",
    failed: "failed",
    conflict: "conflict",
  };
  const saveStatus = saveStatusMap[form.autosaveStatus];
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
    toast.info(t("page.actions.reload"));
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
      isPublished,
      hasUnpublishedChanges,
      isPublishedCurrent,
      status: publishStatus,
      disabled: publishDisabled,
      disabledReason: publishDisabledReason,
      reviewDisabled: publishReviewDisabled,
      reviewDisabledReason: publishReviewDisabledReason,
    },
    saveStatus,
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
    previewOpen,
    setPreviewOpen,
    requestPreview,
    navigationBlocker,
    discardChanges,
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
