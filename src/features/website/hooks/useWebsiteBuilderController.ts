import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { usePlatform } from "../../../shared/hooks/usePlatform";
import { websiteToast as toast } from "../websiteToast";
import type {
  Business,
  WebsiteIdentity,
  SectionEntry,
  WebsiteSectionCatalogEntry,
  WebsiteThemeAssetCatalogItem,
  WebsiteThemeAssetKind,
  WebsiteVariantCatalogEntry,
  WebsiteVariantCheckoutPayload,
} from "../types";
import { fetchReviewStatsAction, fetchHighlightReviewsAction } from "../../reviews/actions";
import {
  selectReviewStats,
  selectHighlightReviews,
  selectHighlightReviewsLoaded,
} from "../../reviews/selectors";
import {
  fetchWebsiteVariantCatalogAction,
  createWebsiteVariantCheckoutAction,
  addVariantToCartAction,
  removeVariantFromCartAction,
  addSectionToCartAction,
  removeSectionFromCartAction,
  addThemeAssetToCartAction,
  removeThemeAssetFromCartAction,
  clearVariantCartAction,
  hydrateWebsiteCartAction,
  releaseWebsiteCheckoutBusyAction,
} from "../actions";
import {
  selectWebsiteVariantCatalog,
  selectWebsiteSectionCatalog,
  selectWebsiteCatalogLoading,
  selectWebsiteCatalogLoaded,
  selectWebsiteCatalogError,
  selectWebsiteCheckoutCreating,
  selectWebsiteVariantCart,
  selectWebsiteSectionCart,
  selectWebsiteThemeAssetCatalog,
  selectWebsiteUnavailableVariants,
  selectWebsiteThemeAssetCart,
  selectWebsiteCartBusinessId,
  selectWebsiteDraft,
  selectWebsiteAccess,
} from "../selectors";
import type { UnlockLineItem } from "../components/builder/PendingUnlocksTray";
import {
  localizeWebsiteSectionCatalog,
  localizeWebsiteVariantCatalog,
} from "../components/builder/catalogCopy";
import type { PreviewReview, RatingBars } from "../components/builder/LivePreview";
import {
  clearWebsiteCheckoutIntent,
  persistWebsiteCheckoutIntent,
  WEBSITE_CHECKOUT_CONTEXT_PARAM,
  type WebsiteCheckoutReturnContext,
  type PreviewOnlyVariantSelections,
} from "../checkoutIntent";

interface UseWebsiteBuilderControllerProps {
  identity: WebsiteIdentity;
  businessId: number | string | null;
  /** An existing Stripe return still owns checkout reconciliation for this business. */
  checkoutReconciliationBlocked?: boolean;
  /** Stripe leaves the page, so unrelated local draft edits must be saved first. */
  checkoutBlocked?: boolean;
  /** A coordinated save/checkout owns the current premium selection snapshot. */
  purchaseMutationsBlocked?: boolean;
  committedTheme: {
    brandColorHex: string;
    fontKey: string;
  };
  /** Current working layout, including hidden paid-only sections previewed for enablement. */
  pageLayout: readonly SectionEntry[];
  onCommitThemeAsset: (asset: WebsiteThemeAssetCatalogItem) => void;
}

export type PreviewOnlyThemeSelections = Partial<Record<WebsiteThemeAssetKind, string>>;

function themeAssetMatchesCommitted(
  asset: WebsiteThemeAssetCatalogItem,
  committedTheme: UseWebsiteBuilderControllerProps["committedTheme"],
): boolean {
  return asset.kind === "color"
    ? asset.value.toLowerCase() === committedTheme.brandColorHex.trim().toLowerCase()
    : asset.assetKey === committedTheme.fontKey.trim().toLowerCase();
}

/**
 * Store and side-effect boundary for the Website editor surface. The component consuming this
 * hook remains responsible only for composing controls and passing the resulting model to the
 * section builder; catalog, cart, checkout, review, and platform orchestration stays here.
 */
export function useWebsiteBuilderController({
  identity,
  businessId,
  checkoutReconciliationBlocked = false,
  checkoutBlocked = false,
  purchaseMutationsBlocked = false,
  committedTheme,
  pageLayout,
  onCommitThemeAsset,
}: UseWebsiteBuilderControllerProps) {
  const { t } = useTranslation("website");
  const dispatch = useDispatch();
  const { isNative } = usePlatform();
  const reviewStats = useSelector(selectReviewStats);
  const highlightReviews = useSelector(selectHighlightReviews);
  const highlightReviewsLoaded = useSelector(selectHighlightReviewsLoaded);

  const rawVariantCatalog = useSelector(selectWebsiteVariantCatalog);
  const rawSectionCatalog = useSelector(selectWebsiteSectionCatalog);
  const themeAssetCatalog = useSelector(selectWebsiteThemeAssetCatalog);
  const unavailableVariants = useSelector(selectWebsiteUnavailableVariants);
  const variantCatalog = useMemo(
    () => localizeWebsiteVariantCatalog(rawVariantCatalog, t),
    [rawVariantCatalog, t],
  );
  const sectionCatalog = useMemo(
    () => localizeWebsiteSectionCatalog(rawSectionCatalog, t),
    [rawSectionCatalog, t],
  );
  const isCatalogLoading = useSelector(selectWebsiteCatalogLoading);
  const catalogLoaded = useSelector(selectWebsiteCatalogLoaded);
  const catalogError = useSelector(selectWebsiteCatalogError);
  const isVariantCheckoutLoading = useSelector(selectWebsiteCheckoutCreating);
  const variantCart = useSelector(selectWebsiteVariantCart);
  const sectionCart = useSelector(selectWebsiteSectionCart);
  const themeAssetCart = useSelector(selectWebsiteThemeAssetCart);
  const cartBusinessId = useSelector(selectWebsiteCartBusinessId);
  const draft = useSelector(selectWebsiteDraft);
  const access = useSelector(selectWebsiteAccess);
  // A previously loaded catalog remains useful for rendering and committed/owned choices, but
  // paid mutations require a fresh, successful owner-scoped read. This prevents stale prices or
  // ownership from being used while a refetch is in flight or has failed.
  const catalogPurchasesReady = catalogLoaded && !isCatalogLoading && !catalogError;
  const retryCatalog = useCallback(() => {
    dispatch(fetchWebsiteVariantCatalogAction.request());
  }, [dispatch]);
  // The three Website capabilities are intentionally independent. A read-only owner who can
  // still purchase or publish is inside the real builder, so purchase copy must not claim that
  // their plan lacks Website access merely because editing itself is disabled.
  const hasWebsiteBuilder = !!access && (
    access.canEdit || access.canPurchase || access.canPublish
  );
  const previewOnlyVariantsRef = useRef<PreviewOnlyVariantSelections>({});
  const [previewOnlyVariantSelections, setPreviewOnlyVariantSelections] =
    useState<PreviewOnlyVariantSelections>({});
  const [previewOnlyThemeSelections, setPreviewOnlyThemeSelections] =
    useState<PreviewOnlyThemeSelections>({});
  const previewOnlyThemeSelectionsRef = useRef<PreviewOnlyThemeSelections>({});
  // Discard clears what is rendered without removing anything the owner still intends to buy.
  // Keep cart-backed theme previews dormant for this mount until an explicit selection applies one
  // again; otherwise the cart-recovery effect would immediately restore the discarded preview.
  const [cartPreviewRehydrationSuppressed, setCartPreviewRehydrationSuppressed] =
    useState(false);
  const cartPreviewRehydrationSuppressedRef = useRef(false);

  const updatePreviewOnlyThemeSelections = useCallback(
    (next: PreviewOnlyThemeSelections) => {
      previewOnlyThemeSelectionsRef.current = next;
      setPreviewOnlyThemeSelections(next);
    },
    [],
  );

  const resetPreviewOnlySelections = useCallback(() => {
    previewOnlyVariantsRef.current = {};
    setPreviewOnlyVariantSelections({});
    cartPreviewRehydrationSuppressedRef.current = true;
    setCartPreviewRehydrationSuppressed(true);
    updatePreviewOnlyThemeSelections({});
  }, [updatePreviewOnlyThemeSelections]);

  const clearPreviewOnlyVariant = useCallback((sectionType: string) => {
    if (!previewOnlyVariantsRef.current[sectionType]) return;
    const next = { ...previewOnlyVariantsRef.current };
    delete next[sectionType];
    previewOnlyVariantsRef.current = next;
    setPreviewOnlyVariantSelections(next);
  }, []);

  // The preview renderer consumes a Business-shaped identity; the canonical fields it reads
  // (name, logo, contact, socials) are exactly what GET /website-builder returns.
  const previewBusiness = useMemo(
    () => ({
      ...identity,
      name: identity.name?.trim() || t("page.identity.fallbackName"),
    }) as unknown as Business,
    [identity, t],
  );

  // Shopping cart persistence is scoped to the active business. Every scope change hydrates
  // both carts, including empty storage; persistence writes only after Redux confirms the
  // cart belongs to this business.
  const cartStorageKey = businessId ? `zavoia.websiteVariantCart.${businessId}` : null;
  const sectionCartStorageKey = businessId ? `zavoia.websiteSectionCart.${businessId}` : null;
  const themeAssetCartStorageKey = businessId ? `zavoia.websiteThemeAssetCart.${businessId}` : null;
  const hydratedCartScopeRef = useRef<string | null>(null);
  useEffect(() => {
    if (!cartStorageKey || !sectionCartStorageKey || !themeAssetCartStorageKey) {
      hydratedCartScopeRef.current = null;
      return;
    }
    const cartScope = String(businessId);
    if (hydratedCartScopeRef.current === cartScope) return;
    hydratedCartScopeRef.current = cartScope;
    cartPreviewRehydrationSuppressedRef.current = false;
    setCartPreviewRehydrationSuppressed(false);
    previewOnlyVariantsRef.current = {};
    setPreviewOnlyVariantSelections({});
    updatePreviewOnlyThemeSelections({});
    const readIds = (key: string): number[] => {
      try {
        const stored: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
        return Array.isArray(stored)
          ? stored.filter((id): id is number => Number.isInteger(id) && id > 0)
          : [];
      } catch {
        // Corrupted cart — start empty; the next change overwrites it.
        return [];
      }
    };
    const variantIds = readIds(cartStorageKey);
    const sectionIds = readIds(sectionCartStorageKey);
    const themeAssetIds = readIds(themeAssetCartStorageKey);
    dispatch(hydrateWebsiteCartAction({ businessId: cartScope, variantIds, sectionIds, themeAssetIds }));
  }, [
    businessId,
    cartStorageKey,
    sectionCartStorageKey,
    themeAssetCartStorageKey,
    dispatch,
    updatePreviewOnlyThemeSelections,
  ]);

  useEffect(() => {
    if (!cartStorageKey || cartBusinessId !== String(businessId)) return;
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(variantCart));
    } catch {
      // Storage full/unavailable — the cart still works for this session.
    }
  }, [businessId, cartBusinessId, cartStorageKey, variantCart]);

  useEffect(() => {
    if (!sectionCartStorageKey || cartBusinessId !== String(businessId)) return;
    try {
      localStorage.setItem(sectionCartStorageKey, JSON.stringify(sectionCart));
    } catch {
      // Storage full/unavailable — the cart still works for this session.
    }
  }, [businessId, cartBusinessId, sectionCartStorageKey, sectionCart]);

  useEffect(() => {
    if (!themeAssetCartStorageKey || cartBusinessId !== String(businessId)) return;
    try {
      localStorage.setItem(themeAssetCartStorageKey, JSON.stringify(themeAssetCart));
    } catch {
      // Storage full/unavailable — the cart still works for this session.
    }
  }, [businessId, cartBusinessId, themeAssetCart, themeAssetCartStorageKey]);

  // Cart entries resolved against the live catalog. Ids that turned owned, free, or
  // vanished from the catalog are dropped from the cart (stale after a purchase or a
  // catalog change) rather than silently skipped at checkout. Owned-but-deactivated
  // entries (available: false) are not purchasable either.
  const cartEntries = useMemo(
    () =>
      variantCart
        .map((id) => variantCatalog.find((entry) => entry.id === id))
        .filter(
          (entry): entry is WebsiteVariantCatalogEntry =>
            !!entry && !entry.owned && entry.priceMinor > 0 && entry.available !== false,
        ),
    [variantCart, variantCatalog],
  );

  const sectionCartEntries = useMemo(
    () =>
      sectionCart
        .map((id) => sectionCatalog.find((entry) => entry.id === id))
        .filter(
          (entry): entry is WebsiteSectionCatalogEntry =>
            !!entry && !entry.owned && entry.priceMinor > 0 && entry.available !== false,
        ),
    [sectionCart, sectionCatalog],
  );

  const themeAssetCartEntries = useMemo(
    () =>
      themeAssetCart
        .map((id) => themeAssetCatalog.find((entry) => entry.id === id))
        .filter(
          (entry): entry is WebsiteThemeAssetCatalogItem =>
            !!entry &&
            !entry.isIncluded &&
            !entry.owned &&
            entry.priceMinor > 0 &&
            entry.available !== false,
        ),
    [themeAssetCart, themeAssetCatalog],
  );

  // Rebuild the preview-only choice after a reload from the business-scoped cart. The cart
  // stores only trusted catalog ids; the live catalog supplies the corresponding kind/value.
  // Once ownership is confirmed and checkout reconciliation has removed the id, the temporary
  // preview disappears so the newly committed draft value becomes authoritative.
  useEffect(() => {
    if (!catalogLoaded) return;
    if (!access?.canEdit) {
      if (Object.keys(previewOnlyThemeSelectionsRef.current).length > 0) {
        updatePreviewOnlyThemeSelections({});
      }
      return;
    }
    const next = { ...previewOnlyThemeSelectionsRef.current };
    const requiresCartBackedPreview = !isNative && !!access.canPurchase;
    (Object.keys(next) as WebsiteThemeAssetKind[]).forEach((kind) => {
      const value = next[kind];
      const asset = themeAssetCatalog.find(
        (candidate) => candidate.kind === kind && candidate.value === value,
      );
      const queued = themeAssetCartEntries.some(
        (candidate) => candidate.kind === kind && candidate.value === value,
      );
      // On the web purchase path a locked preview is valid only while its exact asset remains
      // queued and purchasable. Native/read-only-purchase surfaces may preview without Stripe,
      // but still cannot retain an asset that disappeared, became unavailable, or became owned.
      if (
        (requiresCartBackedPreview && !queued) ||
        (!requiresCartBackedPreview && (!asset || (!asset.available && !asset.owned) || asset.owned))
      ) {
        delete next[kind];
      }
    });
    if (!cartPreviewRehydrationSuppressedRef.current) {
      themeAssetCartEntries.forEach((entry) => {
        if (themeAssetMatchesCommitted(entry, committedTheme)) {
          delete next[entry.kind];
        } else {
          next[entry.kind] = entry.value;
        }
      });
    }
    if (JSON.stringify(next) !== JSON.stringify(previewOnlyThemeSelectionsRef.current)) {
      updatePreviewOnlyThemeSelections(next);
    }
  }, [
    access?.canEdit,
    access?.canPurchase,
    catalogLoaded,
    cartPreviewRehydrationSuppressed,
    committedTheme,
    isNative,
    themeAssetCart,
    themeAssetCartEntries,
    themeAssetCatalog,
    updatePreviewOnlyThemeSelections,
  ]);

  useEffect(() => {
    if (!catalogLoaded || businessId == null || cartBusinessId !== String(businessId)) return;

    const validVariantIds = new Set(cartEntries.map((entry) => entry.id));
    const validSectionIds = new Set(sectionCartEntries.map((entry) => entry.id));
    const validThemeAssetIds = new Set(themeAssetCartEntries.map((entry) => entry.id));
    const staleVariantIds = variantCart.filter((id) => !validVariantIds.has(id));
    const staleSectionIds = sectionCart.filter((id) => !validSectionIds.has(id));
    const staleThemeAssetIds = themeAssetCart.filter((id) => !validThemeAssetIds.has(id));

    // Explain ownership reconciliation once per catalog refresh, even when variants,
    // sections, and brand assets all became owned together. Free, inactive, or removed
    // catalog rows remain silent, matching the previous behavior.
    const newlyOwnedNames = [
      ...staleVariantIds.map((id) => variantCatalog.find((entry) => entry.id === id)),
      ...staleSectionIds.map((id) => sectionCatalog.find((entry) => entry.id === id)),
      ...staleThemeAssetIds.map((id) => themeAssetCatalog.find((entry) => entry.id === id)),
    ].flatMap((entry) => entry?.owned ? [entry.name] : []);
    if (newlyOwnedNames.length > 0) {
      toast.info(
        t("businessPage.paidVariants.unlocks.alreadyOwnedRemoved", {
          count: newlyOwnedNames.length,
          name: newlyOwnedNames[0],
        }),
        { id: "website-owned-selection-reconciled" },
      );
    }

    staleVariantIds.forEach((id) => dispatch(removeVariantFromCartAction(id)));
    staleSectionIds.forEach((id) => dispatch(removeSectionFromCartAction(id)));
    staleThemeAssetIds.forEach((id) => dispatch(removeThemeAssetFromCartAction(id)));

    const staleThemeAssets = staleThemeAssetIds
      .map((id) => themeAssetCatalog.find((entry) => entry.id === id))
      .filter((entry): entry is WebsiteThemeAssetCatalogItem => !!entry);
    if (
      staleThemeAssets.some(
        (entry) => previewOnlyThemeSelectionsRef.current[entry.kind] === entry.value,
      )
    ) {
      const next = { ...previewOnlyThemeSelectionsRef.current };
      staleThemeAssets.forEach((entry) => {
        if (next[entry.kind] === entry.value) delete next[entry.kind];
      });
      updatePreviewOnlyThemeSelections(next);
    }
  }, [
    businessId,
    cartBusinessId,
    cartEntries,
    catalogLoaded,
    dispatch,
    sectionCart,
    sectionCartEntries,
    sectionCatalog,
    t,
    themeAssetCart,
    themeAssetCartEntries,
    themeAssetCatalog,
    updatePreviewOnlyThemeSelections,
    variantCart,
    variantCatalog,
  ]);

  // One unlock tray for both kinds — sections listed first (an unlock is the bigger decision).
  const cartItems = useMemo<UnlockLineItem[]>(
    () => [
      ...sectionCartEntries.map((entry) => ({
        key: `section-${entry.id}`,
        id: entry.id,
        kind: "section" as const,
        name: entry.name,
        priceMinor: entry.priceMinor,
        currency: entry.currency,
      })),
      ...cartEntries.map((entry) => ({
        key: `variant-${entry.id}`,
        id: entry.id,
        kind: "variant" as const,
        name: entry.name,
        priceMinor: entry.priceMinor,
        currency: entry.currency,
      })),
      ...themeAssetCartEntries.map((entry) => ({
        key: `${entry.kind}-${entry.id}`,
        id: entry.id,
        kind: entry.kind,
        name: entry.name,
        priceMinor: entry.priceMinor,
        currency: entry.currency,
        value: entry.value,
        assetKey: entry.assetKey,
      })),
    ],
    [sectionCartEntries, cartEntries, themeAssetCartEntries],
  );

  // Review highlights load separately from the primary editing data so the builder renders
  // first; the catalog fetch keeps locked/owned pills current on every load.
  useEffect(() => {
    if (!businessId) return;
    dispatch(fetchReviewStatsAction.request());
    dispatch(
      fetchHighlightReviewsAction.request({
        rating: 5,
        withCommentsOnly: true,
        sortBy: "rating",
        sortOrder: "DESC",
        limit: 12,
      }),
    );
    dispatch(fetchWebsiteVariantCatalogAction.request());
  }, [businessId, dispatch]);

  // Stripe substitutes {CHECKOUT_SESSION_ID}; the return lands back on /website where
  // useCheckoutReturn polls the owner-scoped checkout status until ownership confirms.
  const checkoutBusinessMarker = businessId == null
    ? ""
    : encodeURIComponent(String(businessId));
  const checkoutUrlsFor = (returnContext?: WebsiteCheckoutReturnContext) => {
    const contextMarker = returnContext
      ? `&${WEBSITE_CHECKOUT_CONTEXT_PARAM}=${encodeURIComponent(returnContext)}`
      : "";
    return {
      successUrl: `${window.location.origin}/website?website_business_id=${checkoutBusinessMarker}&session_id={CHECKOUT_SESSION_ID}${contextMarker}`,
      cancelUrl: `${window.location.origin}/website?website_business_id=${checkoutBusinessMarker}&variantPurchase=cancelled${contextMarker}`,
    };
  };
  const checkoutUrls = checkoutUrlsFor();

  const handlePreviewOnlyVariantsChange = useCallback(
    (selections: PreviewOnlyVariantSelections) => {
      if (purchaseMutationsBlocked || isVariantCheckoutLoading) return;
      const next = { ...selections };
      previewOnlyVariantsRef.current = next;
      setPreviewOnlyVariantSelections(next);
    },
    [isVariantCheckoutLoading, purchaseMutationsBlocked],
  );

  const handleSelectThemeAsset = useCallback(
    (asset: WebsiteThemeAssetCatalogItem) => {
      if (
        !access?.canEdit ||
        checkoutReconciliationBlocked ||
        purchaseMutationsBlocked ||
        isVariantCheckoutLoading ||
        (asset.available === false && !asset.owned)
      ) return;

      const isLockedPaidAsset = !asset.isIncluded && !asset.owned;
      if (isLockedPaidAsset && !catalogPurchasesReady) return;

      const sameKindCart = themeAssetCart
        .map((id) => themeAssetCatalog.find((candidate) => candidate.id === id))
        .filter((candidate) => candidate?.kind === asset.kind);

      if (asset.isIncluded || asset.owned) {
        sameKindCart.forEach((candidate) => {
          if (candidate) dispatch(removeThemeAssetFromCartAction(candidate.id));
        });
        const next = { ...previewOnlyThemeSelectionsRef.current };
        delete next[asset.kind];
        updatePreviewOnlyThemeSelections(next);
        onCommitThemeAsset(asset);
        return;
      }

      const next = { ...previewOnlyThemeSelectionsRef.current };
      if (themeAssetMatchesCommitted(asset, committedTheme)) {
        delete next[asset.kind];
      } else {
        next[asset.kind] = asset.value;
      }
      updatePreviewOnlyThemeSelections(next);

      if (isNative || !access.canPurchase) {
        toast.info(
          t(
            isNative
              ? "businessPage.paidVariants.nativeHint"
              : "businessPage.paidVariants.purchaseUnavailable",
          ),
          { id: "website-premium-purchase-guidance" },
        );
        return;
      }

      sameKindCart.forEach((candidate) => {
        if (candidate && candidate.id !== asset.id) {
          dispatch(removeThemeAssetFromCartAction(candidate.id));
        }
      });
      if (!themeAssetCart.includes(asset.id)) {
        dispatch(addThemeAssetToCartAction(asset.id));
      }
      toast.info(t("businessPage.theme.assetStatus.previewAnnounced", { name: asset.name }), {
        id: `website-premium-preview-${asset.kind}`,
      });
    },
    [
      access,
      catalogPurchasesReady,
      checkoutReconciliationBlocked,
      committedTheme,
      dispatch,
      isNative,
      isVariantCheckoutLoading,
      onCommitThemeAsset,
      purchaseMutationsBlocked,
      t,
      themeAssetCart,
      themeAssetCatalog,
      updatePreviewOnlyThemeSelections,
    ],
  );

  const effectiveBrandColorHex =
    previewOnlyThemeSelections.color ?? committedTheme.brandColorHex;
  const effectiveFontKey = previewOnlyThemeSelections.font ?? committedTheme.fontKey;

  const startCheckout = (payload: WebsiteVariantCheckoutPayload): boolean => {
    if (checkoutBlocked) {
      toast.info(t("businessPage.paidVariants.saveBeforeCheckout"), {
        id: "website-save-before-checkout",
      });
      return false;
    }
    if (
      businessId == null ||
      isNative ||
      !access?.canPurchase ||
      isVariantCheckoutLoading ||
      checkoutReconciliationBlocked ||
      !catalogPurchasesReady
    ) return false;

    const requestedVariantIds = new Set(
      [payload.variantId, ...(payload.variantIds ?? [])].filter(
        (id): id is number => Number.isInteger(id) && (id as number) > 0,
      ),
    );
    const requestedSectionIds = new Set(payload.sectionIds ?? []);
    const requestedThemeAssetIds = new Set(payload.themeAssetIds ?? []);
    const quotedItems: NonNullable<WebsiteVariantCheckoutPayload["expectedLineItems"]> = [
      ...variantCatalog.filter(
        (entry) =>
          requestedVariantIds.has(entry.id) &&
          entry.priceMinor > 0 &&
          !entry.owned &&
          entry.available !== false,
      ).map((entry) => ({
        kind: "variant" as const,
        catalogId: entry.id,
        priceMinor: entry.priceMinor,
        currency: entry.currency.trim().toLowerCase(),
      })),
      ...sectionCatalog.filter(
        (entry) =>
          requestedSectionIds.has(entry.id) &&
          entry.priceMinor > 0 &&
          !entry.owned &&
          entry.available !== false,
      ).map((entry) => ({
        kind: "section" as const,
        catalogId: entry.id,
        priceMinor: entry.priceMinor,
        currency: entry.currency.trim().toLowerCase(),
      })),
      ...themeAssetCatalog.filter(
        (entry) =>
          requestedThemeAssetIds.has(entry.id) &&
          !entry.isIncluded &&
          entry.priceMinor > 0 &&
          !entry.owned &&
          entry.available !== false,
      ).map((entry) => ({
        kind: entry.kind,
        catalogId: entry.id,
        priceMinor: entry.priceMinor,
        currency: entry.currency.trim().toLowerCase(),
      })),
    ];
    const requestedItemCount =
      requestedVariantIds.size + requestedSectionIds.size + requestedThemeAssetIds.size;
    const quoteCurrencies = new Set(
      quotedItems.map((entry) => entry.currency).filter(Boolean),
    );
    if (
      requestedItemCount === 0 ||
      quotedItems.length !== requestedItemCount ||
      quoteCurrencies.size !== 1 ||
      quotedItems.some((entry) => entry.priceMinor <= 0)
    ) {
      dispatch(fetchWebsiteVariantCatalogAction.request());
      toast.error(t("page.toasts.checkoutFailed"), {
        id: "website-checkout-start-failed",
      });
      return false;
    }
    const quotedPayload: WebsiteVariantCheckoutPayload = {
      ...payload,
      expectedLineItems: [...quotedItems].sort((left, right) =>
        `${left.kind}:${left.catalogId}`.localeCompare(`${right.kind}:${right.catalogId}`),
      ),
    };
    persistWebsiteCheckoutIntent({
      businessId,
      payload: quotedPayload,
      previewOnlyVariants: previewOnlyVariantsRef.current,
      previewOnlyThemeSelections: previewOnlyThemeSelectionsRef.current,
      pageLayout,
      variantCatalog,
      sectionCatalog,
      themeAssetCatalog,
    });
    dispatch(createWebsiteVariantCheckoutAction.request(quotedPayload));
    return true;
  };

  const handleBuyVariant = (variant: WebsiteVariantCatalogEntry) => {
    return startCheckout({ variantId: variant.id, ...checkoutUrls });
  };

  const handleBuySection = (section: WebsiteSectionCatalogEntry) => {
    return startCheckout({ sectionIds: [section.id], ...checkoutUrls });
  };

  const handleToggleCartVariant = (variant: WebsiteVariantCatalogEntry) => {
    if (
      isNative ||
      !access?.canPurchase ||
      checkoutReconciliationBlocked ||
      purchaseMutationsBlocked ||
      isVariantCheckoutLoading ||
      !catalogPurchasesReady
    ) return;
    dispatch(
      variantCart.includes(variant.id)
        ? removeVariantFromCartAction(variant.id)
        : addVariantToCartAction(variant.id),
    );
  };

  const handleToggleCartSection = (section: WebsiteSectionCatalogEntry) => {
    if (
      isNative ||
      !access?.canPurchase ||
      checkoutReconciliationBlocked ||
      purchaseMutationsBlocked ||
      isVariantCheckoutLoading ||
      !catalogPurchasesReady
    ) return;
    dispatch(
      sectionCart.includes(section.id)
        ? removeSectionFromCartAction(section.id)
        : addSectionToCartAction(section.id),
    );
  };

  const handleToggleCartThemeAsset = (asset: WebsiteThemeAssetCatalogItem) => {
    if (
      isNative ||
      !access?.canPurchase ||
      checkoutReconciliationBlocked ||
      purchaseMutationsBlocked ||
      isVariantCheckoutLoading ||
      !catalogPurchasesReady ||
      asset.isIncluded ||
      asset.owned ||
      asset.available === false
    ) return;
    if (themeAssetCart.includes(asset.id)) {
      dispatch(removeThemeAssetFromCartAction(asset.id));
      if (previewOnlyThemeSelectionsRef.current[asset.kind] === asset.value) {
        const next = { ...previewOnlyThemeSelectionsRef.current };
        delete next[asset.kind];
        updatePreviewOnlyThemeSelections(next);
      }
      return;
    }
    themeAssetCart
      .map((id) => themeAssetCatalog.find((candidate) => candidate.id === id))
      .filter((candidate) => candidate?.kind === asset.kind)
      .forEach((candidate) => candidate && dispatch(removeThemeAssetFromCartAction(candidate.id)));
    const next = { ...previewOnlyThemeSelectionsRef.current };
    if (themeAssetMatchesCommitted(asset, committedTheme)) {
      delete next[asset.kind];
    } else {
      next[asset.kind] = asset.value;
    }
    updatePreviewOnlyThemeSelections(next);
    dispatch(addThemeAssetToCartAction(asset.id));
  };

  const handleRemoveCartItem = (item: UnlockLineItem) => {
    if (
      checkoutReconciliationBlocked ||
      purchaseMutationsBlocked ||
      isVariantCheckoutLoading
    ) return;
    dispatch(
      item.kind === "section"
        ? removeSectionFromCartAction(item.id)
        : item.kind === "variant"
          ? removeVariantFromCartAction(item.id)
          : removeThemeAssetFromCartAction(item.id),
    );
    if (
      (item.kind === "color" || item.kind === "font") &&
      item.value === previewOnlyThemeSelectionsRef.current[item.kind]
    ) {
      const next = { ...previewOnlyThemeSelectionsRef.current };
      delete next[item.kind];
      updatePreviewOnlyThemeSelections(next);
    }
  };

  const handleClearCart = () => {
    if (
      checkoutReconciliationBlocked ||
      purchaseMutationsBlocked ||
      isVariantCheckoutLoading
    ) return;
    dispatch(clearVariantCartAction());
    updatePreviewOnlyThemeSelections({});
  };

  const handleCheckoutItems = (
    items: UnlockLineItem[],
    options?: { returnContext?: WebsiteCheckoutReturnContext },
  ) => {
    if (items.length === 0) return false;
    const variantIds = [...new Set(
      items.filter((item) => item.kind === "variant").map((item) => item.id),
    )];
    const sectionIds = [...new Set(
      items.filter((item) => item.kind === "section").map((item) => item.id),
    )];
    const themeAssetIds = [...new Set(
      items
        .filter((item) => item.kind === "color" || item.kind === "font")
        .map((item) => item.id),
    )];
    return startCheckout({
      ...(variantIds.length > 0 ? { variantIds } : {}),
      ...(sectionIds.length > 0 ? { sectionIds } : {}),
      ...(themeAssetIds.length > 0 ? { themeAssetIds } : {}),
      ...checkoutUrlsFor(options?.returnContext),
    });
  };

  const handleCheckoutCart = () => {
    return handleCheckoutItems(cartItems);
  };

  // A successful checkout action intentionally stays busy until Stripe owns the tab. If
  // the request instead settles back to idle, no redirect happened and its intent must not
  // leak into a later, unrelated checkout.
  const checkoutBusinessRef = useRef<number | string | null>(null);
  const checkoutWasCreatingRef = useRef(false);
  useEffect(() => {
    if (isVariantCheckoutLoading) {
      checkoutWasCreatingRef.current = true;
      checkoutBusinessRef.current = businessId;
      return;
    }
    if (checkoutWasCreatingRef.current) {
      clearWebsiteCheckoutIntent(checkoutBusinessRef.current);
      checkoutWasCreatingRef.current = false;
      checkoutBusinessRef.current = null;
    }
  }, [businessId, isVariantCheckoutLoading]);

  // Stripe owns the tab after checkout creation, so Redux intentionally remains busy. Browser
  // Back may restore that exact page from BFCache without remounting it; release only the visual
  // latch in that case and keep cart + intent intact so the backend can safely reuse/replace the
  // still-open attempt on the owner's next action.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted || !checkoutWasCreatingRef.current) return;
      checkoutWasCreatingRef.current = false;
      checkoutBusinessRef.current = null;
      dispatch(releaseWebsiteCheckoutBusyAction());
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [dispatch]);

  const teamRatings = useMemo(() => {
    const map: Record<number, { rating: number; count: number }> = {};
    (reviewStats?.teamMembers ?? []).forEach((teamMember) => {
      if (teamMember.totalReviews > 0) {
        map[teamMember.teamMemberId] = {
          rating: teamMember.averageRating,
          count: teamMember.totalReviews,
        };
      }
    });
    return map;
  }, [reviewStats]);

  const ratingDistribution = reviewStats?.business?.ratingDistribution as RatingBars | undefined;

  const previewReviews = useMemo<PreviewReview[]>(
    () =>
      highlightReviews
        .filter((review) => (review.comment ?? "").trim())
        .map((review) => ({
          id: review.id,
          rating: review.rating,
          comment: (review.comment ?? "").trim(),
          customerName: [review.customer.firstName, review.customer.lastName]
            .filter(Boolean)
            .join(" ")
            .trim(),
          locationName: review.location?.name ?? null,
          createdAt: review.createdAt,
        })),
    [highlightReviews],
  );

  return {
    isNative,
    previewBusiness,
    heroImageUrl: draft?.heroImageUrl ?? null,
    variantCatalog,
    sectionCatalog,
    unavailableVariants,
    themeAssetCatalog,
    isCatalogLoading,
    catalogLoaded,
    catalogError,
    retryCatalog,
    catalogPurchasesReady,
    checkoutReconciliationBlocked,
    checkoutBlocked,
    purchaseMutationsBlocked,
    isVariantCheckoutLoading,
    variantCart,
    sectionCart,
    themeAssetCart,
    previewOnlyVariantSelections,
    previewOnlyThemeSelections,
    effectiveBrandColorHex,
    effectiveFontKey,
    hasWebsiteBuilder,
    cartItems,
    teamRatings,
    ratingDistribution,
    previewReviews,
    highlightReviewsLoaded,
    resetPreviewOnlySelections,
    clearPreviewOnlyVariant,
    handlePreviewOnlyVariantsChange,
    handleBuyVariant,
    handleBuySection,
    handleToggleCartVariant,
    handleToggleCartSection,
    handleToggleCartThemeAsset,
    handleSelectThemeAsset,
    handleRemoveCartItem,
    handleClearCart,
    handleCheckoutItems,
    handleCheckoutCart,
  };
}

export type WebsiteBuilderController = ReturnType<typeof useWebsiteBuilderController>;
