import { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { usePlatform } from "../../../shared/hooks/usePlatform";
import type {
  Business,
  LocationWithAssignments,
  WebsiteIdentity,
  WebsiteSectionCatalogEntry,
  WebsiteVariantCatalogEntry,
} from "../types";
import type { WebsiteDraftForm } from "../hooks/useWebsiteDraft";
import { fetchReviewStatsAction, fetchHighlightReviewsAction } from "../../reviews/actions";
import { selectReviewStats, selectHighlightReviews } from "../../reviews/selectors";
import {
  fetchWebsiteVariantCatalogAction,
  createWebsiteVariantCheckoutAction,
  addVariantToCartAction,
  removeVariantFromCartAction,
  addSectionToCartAction,
  removeSectionFromCartAction,
  clearVariantCartAction,
  hydrateWebsiteCartAction,
} from "../actions";
import {
  selectWebsiteVariantCatalog,
  selectWebsiteSectionCatalog,
  selectWebsiteCatalogLoading,
  selectWebsiteCatalogLoaded,
  selectWebsiteCheckoutCreating,
  selectWebsiteVariantCart,
  selectWebsiteSectionCart,
  selectWebsiteCartBusinessId,
  selectWebsiteDraft,
  selectWebsiteAccess,
} from "../selectors";
import { BrandColorControl, BrandingSection } from "./BrandingSection";
import { SectionBuilder } from "./builder/SectionBuilder";
import {
  PendingUnlocksPanel,
  PendingUnlocksTrigger,
  type UnlockLineItem,
} from "./builder/PendingUnlocksTray";
import { ThemePanel } from "./builder/ThemePanel";
import { aboutHeadline } from "./builder/aboutContent";
import {
  localizeWebsiteSectionCatalog,
  localizeWebsiteVariantCatalog,
} from "./builder/catalogCopy";
import type { PreviewReview, RatingBars } from "./builder/LivePreview";

interface WebsiteBuilderCoreProps {
  identity: WebsiteIdentity;
  canWrite: boolean;
  businessId: number | string | null;
  locations: LocationWithAssignments[];
  form: WebsiteDraftForm;
  /** Request from the workspace (publish-blocker chips) to open/scroll to a section. */
  focusSection?: { type: string; nonce: number } | null;
}

/**
 * The Website editor surface: section list + editors + style picker + live preview,
 * plus the store wiring (catalog, cart, checkout). The renderer reads the CANONICAL
 * Business identity (never Marketplace overrides) supplied by GET /website-builder.
 */
export function WebsiteBuilderCore({
  identity,
  canWrite,
  businessId,
  locations,
  form,
  focusSection,
}: WebsiteBuilderCoreProps) {
  const { t, i18n } = useTranslation("website");
  const dispatch = useDispatch();
  const { isNative } = usePlatform();
  const reviewStats = useSelector(selectReviewStats);
  const highlightReviews = useSelector(selectHighlightReviews);

  const rawVariantCatalog = useSelector(selectWebsiteVariantCatalog);
  const rawSectionCatalog = useSelector(selectWebsiteSectionCatalog);
  const variantCatalog = useMemo(
    () => localizeWebsiteVariantCatalog(rawVariantCatalog, t),
    [i18n.resolvedLanguage, rawVariantCatalog, t],
  );
  const sectionCatalog = useMemo(
    () => localizeWebsiteSectionCatalog(rawSectionCatalog, t),
    [i18n.resolvedLanguage, rawSectionCatalog, t],
  );
  const isCatalogLoading = useSelector(selectWebsiteCatalogLoading);
  const catalogLoaded = useSelector(selectWebsiteCatalogLoaded);
  const isVariantCheckoutLoading = useSelector(selectWebsiteCheckoutCreating);
  const variantCart = useSelector(selectWebsiteVariantCart);
  const sectionCart = useSelector(selectWebsiteSectionCart);
  const cartBusinessId = useSelector(selectWebsiteCartBusinessId);
  const draft = useSelector(selectWebsiteDraft);
  const access = useSelector(selectWebsiteAccess);
  const hasWebsiteBuilder = access?.canEdit ?? false;

  // The preview renderer consumes a Business-shaped identity; the canonical fields it reads
  // (name, logo, contact, socials) are exactly what GET /website-builder returns.
  const previewBusiness = useMemo(
    () => (identity ? ({ ...identity } as unknown as Business) : null),
    [identity],
  );

  // Shopping cart persistence is scoped to the active business. Every scope change hydrates
  // both carts, including empty storage; persistence writes only after Redux confirms the
  // cart belongs to this business.
  const cartStorageKey = businessId ? `zavoia.websiteVariantCart.${businessId}` : null;
  const sectionCartStorageKey = businessId ? `zavoia.websiteSectionCart.${businessId}` : null;
  const hydratedCartScopeRef = useRef<string | null>(null);
  useEffect(() => {
    if (!cartStorageKey || !sectionCartStorageKey) {
      hydratedCartScopeRef.current = null;
      return;
    }
    const cartScope = String(businessId);
    if (hydratedCartScopeRef.current === cartScope) return;
    hydratedCartScopeRef.current = cartScope;
    const readIds = (key: string): number[] => {
      try {
        const stored: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
        return Array.isArray(stored) ? stored.filter((id): id is number => Number.isInteger(id) && id > 0) : [];
      } catch {
        // Corrupted cart — start empty; the next change overwrites it.
        return [];
      }
    };
    const variantIds = readIds(cartStorageKey);
    const sectionIds = readIds(sectionCartStorageKey);
    dispatch(hydrateWebsiteCartAction({ businessId: cartScope, variantIds, sectionIds }));
  }, [businessId, cartStorageKey, sectionCartStorageKey, dispatch]);
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

  // Cart entries resolved against the live catalog. Ids that turned owned, free, or
  // vanished from the catalog are dropped from the cart (stale after a purchase or a
  // catalog change) rather than silently skipped at checkout. Owned-but-deactivated
  // entries (available: false) are not purchasable either.
  const cartEntries = useMemo(
    () =>
      variantCart
        .map((id) => variantCatalog.find((e) => e.id === id))
        .filter((e): e is WebsiteVariantCatalogEntry => !!e && !e.owned && e.priceMinor > 0 && e.available !== false),
    [variantCart, variantCatalog],
  );
  useEffect(() => {
    if (variantCatalog.length === 0) return;
    const valid = new Set(cartEntries.map((e) => e.id));
    variantCart.filter((id) => !valid.has(id)).forEach((id) => {
      // Say WHY a queued item vanished when it turned owned (e.g. bought in another tab) —
      // a silently emptied tray reads as data loss.
      const entry = variantCatalog.find((e) => e.id === id);
      if (entry?.owned) {
        toast.info(t("businessPage.paidVariants.unlocks.alreadyOwnedRemoved", { name: entry.name }));
      }
      dispatch(removeVariantFromCartAction(id));
    });
  }, [variantCatalog, variantCart, cartEntries, dispatch, t]);
  const sectionCartEntries = useMemo(
    () =>
      sectionCart
        .map((id) => sectionCatalog.find((e) => e.id === id))
        .filter((e): e is WebsiteSectionCatalogEntry => !!e && !e.owned && e.priceMinor > 0 && e.available !== false),
    [sectionCart, sectionCatalog],
  );
  useEffect(() => {
    if (sectionCatalog.length === 0) return;
    const valid = new Set(sectionCartEntries.map((e) => e.id));
    sectionCart.filter((id) => !valid.has(id)).forEach((id) => {
      const entry = sectionCatalog.find((e) => e.id === id);
      if (entry?.owned) {
        toast.info(t("businessPage.paidVariants.unlocks.alreadyOwnedRemoved", { name: entry.name }));
      }
      dispatch(removeSectionFromCartAction(id));
    });
  }, [sectionCatalog, sectionCart, sectionCartEntries, dispatch, t]);

  // One unlock tray for both kinds — sections listed first (an unlock is the bigger decision).
  const cartItems = useMemo<UnlockLineItem[]>(
    () => [
      ...sectionCartEntries.map((e) => ({
        key: `section-${e.id}`,
        id: e.id,
        kind: "section" as const,
        name: e.name,
        priceMinor: e.priceMinor,
        currency: e.currency,
      })),
      ...cartEntries.map((e) => ({
        key: `variant-${e.id}`,
        id: e.id,
        kind: "variant" as const,
        name: e.name,
        priceMinor: e.priceMinor,
        currency: e.currency,
      })),
    ],
    [sectionCartEntries, cartEntries],
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
  const checkoutUrls = {
    successUrl: `${window.location.origin}/website?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${window.location.origin}/website?variantPurchase=cancelled`,
  };

  const handleBuyVariant = (variant: WebsiteVariantCatalogEntry) => {
    dispatch(createWebsiteVariantCheckoutAction.request({ variantId: variant.id, ...checkoutUrls }));
  };

  const handleBuySection = (section: WebsiteSectionCatalogEntry) => {
    dispatch(createWebsiteVariantCheckoutAction.request({ sectionIds: [section.id], ...checkoutUrls }));
  };

  const handleToggleCartVariant = (variant: WebsiteVariantCatalogEntry) => {
    if (variantCart.includes(variant.id)) {
      dispatch(removeVariantFromCartAction(variant.id));
    } else {
      dispatch(addVariantToCartAction(variant.id));
    }
  };

  const handleToggleCartSection = (section: WebsiteSectionCatalogEntry) => {
    if (sectionCart.includes(section.id)) {
      dispatch(removeSectionFromCartAction(section.id));
    } else {
      dispatch(addSectionToCartAction(section.id));
    }
  };

  const handleCheckoutCart = () => {
    if (cartEntries.length === 0 && sectionCartEntries.length === 0) return;
    dispatch(
      createWebsiteVariantCheckoutAction.request({
        ...(cartEntries.length > 0 ? { variantIds: cartEntries.map((e) => e.id) } : {}),
        ...(sectionCartEntries.length > 0 ? { sectionIds: sectionCartEntries.map((e) => e.id) } : {}),
        ...checkoutUrls,
      }),
    );
  };

  const teamRatings = useMemo(() => {
    const map: Record<number, { rating: number; count: number }> = {};
    (reviewStats?.teamMembers ?? []).forEach((tm) => {
      if (tm.totalReviews > 0) {
        map[tm.teamMemberId] = {
          rating: tm.averageRating,
          count: tm.totalReviews,
        };
      }
    });
    return map;
  }, [reviewStats]);

  const ratingDistribution = reviewStats?.business?.ratingDistribution as RatingBars | undefined;

  const previewReviews = useMemo<PreviewReview[]>(
    () =>
      highlightReviews
        .filter((r) => (r.comment ?? "").trim())
        .map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: (r.comment ?? "").trim(),
          customerName: [r.customer.firstName, r.customer.lastName].filter(Boolean).join(" ").trim(),
          locationName: r.location?.name ?? null,
          createdAt: r.createdAt,
        })),
    [highlightReviews],
  );

  // Readiness cues (guidance only — a draft with missing copy still saves).
  const aboutVisible = form.layout.some((s) => s.type === "about" && s.visible);
  const aboutReadiness =
    aboutVisible && aboutHeadline(form.aboutContent) === ""
      ? t("businessPage.errors.aboutHeadlineRequired")
      : null;
  const announcementCue =
    form.announcementUrlError || form.announcementScheduleError || form.announcementMessageWarning;

  return (
    <div className="mb-0 md:mb-8">
      <div
        className={!canWrite ? "pointer-events-none opacity-60" : ""}
        aria-disabled={!canWrite}
      >
        <SectionBuilder
          focusSection={focusSection}
          layout={form.layout}
          reorderSections={form.reorderSections}
          toggleSectionVisible={form.toggleSectionVisible}
          moveSectionOfType={form.moveSectionOfType}
          setSectionVisibleByType={form.setSectionVisibleByType}
          setSectionConfigByType={form.setSectionConfigByType}
          setSectionVariant={form.setSectionVariant}
          setSectionConfig={form.setSectionConfig}
          fontKey={form.fontKey}
          faqItems={form.faqItems}
          setFaqItems={form.setFaqItems}
          announcementContent={form.announcementContent}
          setAnnouncementContent={form.setAnnouncementContent}
          aboutContent={form.aboutContent}
          setAboutContent={form.setAboutContent}
          brandPanel={
            <div className="py-1 sm:py-2">
              <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(260px,0.82fr)_minmax(0,1.35fr)] xl:items-start">
                <div className="min-w-0">
                  <BrandingSection
                    business={previewBusiness}
                    pageName={identity.name}
                    fontKey={form.fontKey}
                  />
                </div>
                <div className="min-w-0">
                  <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(220px,0.72fr)_minmax(0,1.28fr)] lg:items-start">
                    <BrandColorControl
                      canWrite={canWrite}
                      brandColorHex={form.brandColorHex}
                      setBrandColorHex={form.setBrandColorHex}
                    />
                    <ThemePanel fontKey={form.fontKey} onFontChange={form.setFontKey} />
                  </div>
                </div>
              </div>
            </div>
          }
          cartControl={
            canWrite && !isNative ? (
              <PendingUnlocksTrigger
                entries={cartItems}
                isLoading={isVariantCheckoutLoading}
                onRemove={(item) =>
                  dispatch(item.kind === "section" ? removeSectionFromCartAction(item.id) : removeVariantFromCartAction(item.id))
                }
                onClear={() => dispatch(clearVariantCartAction())}
                onCheckout={handleCheckoutCart}
              />
            ) : null
          }
          unlockTray={
            canWrite && !isNative ? (
              <PendingUnlocksPanel
                entries={cartItems}
                isLoading={isVariantCheckoutLoading}
                onRemove={(item) =>
                  dispatch(item.kind === "section" ? removeSectionFromCartAction(item.id) : removeVariantFromCartAction(item.id))
                }
                onClear={() => dispatch(clearVariantCartAction())}
                onCheckout={handleCheckoutCart}
              />
            ) : null
          }
          business={previewBusiness}
          locations={locations}
          heroImageUrl={draft?.heroImageUrl ?? null}
          tagline={form.tagline}
          setTagline={form.setTagline}
          taglineError={form.taglineError || undefined}
          aboutError={aboutReadiness}
          announcementError={announcementCue}
          canWrite={canWrite}
          brandColorHex={form.brandColorHex}
          useBusinessEmail={true}
          email={identity.email ?? ""}
          useBusinessPhone={true}
          phone={identity.phone ?? ""}
          reviews={previewReviews}
          teamRatings={teamRatings}
          ratingDistribution={ratingDistribution}
          variantCatalog={variantCatalog}
          sectionCatalog={sectionCatalog}
          hasWebsiteBuilder={hasWebsiteBuilder}
          isCatalogLoading={isCatalogLoading}
          catalogLoaded={catalogLoaded}
          isVariantCheckoutLoading={isVariantCheckoutLoading}
          onBuyVariant={handleBuyVariant}
          onBuySection={handleBuySection}
          cartVariantIds={variantCart}
          cartSectionIds={sectionCart}
          onToggleCartVariant={handleToggleCartVariant}
          onToggleCartSection={handleToggleCartSection}
          isNative={isNative}
        />
      </div>
    </div>
  );
}

export default WebsiteBuilderCore;
