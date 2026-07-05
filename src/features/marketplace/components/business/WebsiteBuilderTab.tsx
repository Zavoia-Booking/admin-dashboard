import { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { LimitedAccessBanner } from "../../../../shared/components/common/subscription/LimitedAccessBanner";
import { usePlatform } from "../../../../shared/hooks/usePlatform";
import type { Business, LocationWithAssignments, WebsiteSectionCatalogEntry, WebsiteVariantCatalogEntry } from "../../types";
import type { useMarketplaceForm } from "../../hooks/useMarketplaceForm";
import { fetchReviewStatsAction, fetchHighlightReviewsAction } from "../../../reviews/actions";
import { selectReviewStats, selectHighlightReviews } from "../../../reviews/selectors";
import {
  fetchWebsiteVariantCatalogAction,
  createWebsiteVariantCheckoutAction,
  addVariantToCartAction,
  removeVariantFromCartAction,
  addSectionToCartAction,
  removeSectionFromCartAction,
  clearVariantCartAction,
  hydrateVariantCartAction,
  hydrateSectionCartAction,
} from "../../actions";
import {
  selectWebsiteVariantCatalog,
  selectWebsiteSectionCatalog,
  selectVariantCatalogLoading,
  selectVariantCheckoutCreating,
  selectVariantCart,
  selectSectionCart,
} from "../../selectors";
import { selectHasWebsiteBuilder } from "../../../auth/selectors";
import { BrandColorControl, BrandingSection } from "./BrandingSection";
import { SectionBuilder } from "./builder/SectionBuilder";
import { VariantCartBar, type CartLineItem } from "./builder/VariantCartBar";
import { ThemePanel } from "./builder/ThemePanel";
import type { PreviewReview, RatingBars } from "./builder/LivePreview";

interface WebsiteBuilderTabProps {
  business: Business | null;
  canWrite: boolean;
  heroImageUrl: string | null;
  locations: LocationWithAssignments[];
  form: ReturnType<typeof useMarketplaceForm>;
}

export function WebsiteBuilderTab({
  business,
  canWrite,
  heroImageUrl,
  locations,
  form,
}: WebsiteBuilderTabProps) {
  const { t } = useTranslation("marketplace");
  const dispatch = useDispatch();
  const { isNative } = usePlatform();
  const [searchParams, setSearchParams] = useSearchParams();
  const reviewStats = useSelector(selectReviewStats);
  const highlightReviews = useSelector(selectHighlightReviews);

  // Server-driven builder offering: section + variant catalogs with per-business
  // ownership + the checkout in-flight flag.
  const variantCatalog = useSelector(selectWebsiteVariantCatalog);
  const sectionCatalog = useSelector(selectWebsiteSectionCatalog);
  const isCatalogLoading = useSelector(selectVariantCatalogLoading);
  const isVariantCheckoutLoading = useSelector(selectVariantCheckoutCreating);
  const variantCart = useSelector(selectVariantCart);
  const sectionCart = useSelector(selectSectionCart);
  const hasWebsiteBuilder = useSelector(selectHasWebsiteBuilder);

  // Shopping cart persistence: hydrate once per page load from localStorage (keyed per
  // business so switching accounts never leaks a cart), then mirror every change back.
  // Variants and section unlocks keep separate keys but share the one cart bar/session.
  const cartStorageKey = business ? `zavoia.websiteVariantCart.${business.id}` : null;
  const sectionCartStorageKey = business ? `zavoia.websiteSectionCart.${business.id}` : null;
  const cartHydrated = useRef(false);
  useEffect(() => {
    if (!cartStorageKey || !sectionCartStorageKey || cartHydrated.current) return;
    cartHydrated.current = true;
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
    if (variantIds.length > 0) dispatch(hydrateVariantCartAction(variantIds));
    const sectionIds = readIds(sectionCartStorageKey);
    if (sectionIds.length > 0) dispatch(hydrateSectionCartAction(sectionIds));
  }, [cartStorageKey, sectionCartStorageKey, dispatch]);
  useEffect(() => {
    if (!cartStorageKey || !cartHydrated.current) return;
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(variantCart));
    } catch {
      // Storage full/unavailable — the cart still works for this session.
    }
  }, [cartStorageKey, variantCart]);
  useEffect(() => {
    if (!sectionCartStorageKey || !cartHydrated.current) return;
    try {
      localStorage.setItem(sectionCartStorageKey, JSON.stringify(sectionCart));
    } catch {
      // Storage full/unavailable — the cart still works for this session.
    }
  }, [sectionCartStorageKey, sectionCart]);

  // Cart entries resolved against the live catalog. Ids that turned owned, free, or
  // vanished from the catalog are dropped from the cart (stale after a purchase or a
  // catalog change) rather than silently skipped at checkout.
  const cartEntries = useMemo(
    () =>
      variantCart
        .map((id) => variantCatalog.find((e) => e.id === id))
        .filter((e): e is WebsiteVariantCatalogEntry => !!e && !e.owned && e.priceMinor > 0),
    [variantCart, variantCatalog],
  );
  useEffect(() => {
    if (variantCatalog.length === 0) return;
    const valid = new Set(cartEntries.map((e) => e.id));
    variantCart.filter((id) => !valid.has(id)).forEach((id) => dispatch(removeVariantFromCartAction(id)));
  }, [variantCatalog, variantCart, cartEntries, dispatch]);
  const sectionCartEntries = useMemo(
    () =>
      sectionCart
        .map((id) => sectionCatalog.find((e) => e.id === id))
        .filter((e): e is WebsiteSectionCatalogEntry => !!e && !e.owned && e.priceMinor > 0),
    [sectionCart, sectionCatalog],
  );
  useEffect(() => {
    if (sectionCatalog.length === 0) return;
    const valid = new Set(sectionCartEntries.map((e) => e.id));
    sectionCart.filter((id) => !valid.has(id)).forEach((id) => dispatch(removeSectionFromCartAction(id)));
  }, [sectionCatalog, sectionCart, sectionCartEntries, dispatch]);

  // One cart bar for both kinds — sections listed first (an unlock is the bigger decision).
  const cartItems = useMemo<CartLineItem[]>(
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

  // Fetch the paid-variant catalog whenever the builder loads (including the return from a
  // Stripe purchase, which is a fresh page load) so locked/owned pills reflect ownership.
  useEffect(() => {
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
  }, [dispatch]);

  // Return from Stripe checkout (successUrl = /marketplace?tab=website&variantPurchase=success):
  // toast, strip the marker param (keeping tab=website), and refetch the catalog once more after
  // a short delay — ownership lands via webhook, which can trail the redirect by a moment.
  const purchaseReturnHandled = useRef(false);
  useEffect(() => {
    if (searchParams.get("variantPurchase") !== "success" || purchaseReturnHandled.current) return;
    purchaseReturnHandled.current = true;
    toast.success(t("businessPage.paidVariants.purchaseSuccessToast"));
    // The paid session covered whatever was bought (single variant or the whole cart) —
    // the cart is done either way; the catalog refetch flips the entries to owned.
    dispatch(clearVariantCartAction());
    setTimeout(() => dispatch(fetchWebsiteVariantCatalogAction.request()), 3000);
    const next = new URLSearchParams(searchParams);
    next.delete("variantPurchase");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, dispatch, t]);

  const checkoutUrls = {
    successUrl: `${window.location.origin}/marketplace?tab=website&variantPurchase=success`,
    cancelUrl: `${window.location.origin}/marketplace?tab=website`,
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

  return (
    <div className="max-w-7xl mb-0 md:mb-8">
      <LimitedAccessBanner className="!px-0 !pt-0" />
      <div
        className={!canWrite ? "pointer-events-none opacity-60" : ""}
        aria-disabled={!canWrite}
      >
        <SectionBuilder
          layout={form.layout}
          reorderSections={form.reorderSections}
          toggleSectionVisible={form.toggleSectionVisible}
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
            <div className="rounded-[1.25rem] border border-border bg-surface p-4 shadow-xs sm:p-5">
              <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(260px,0.82fr)_minmax(0,1.35fr)] xl:items-start">
                <div className="min-w-0">
                  <BrandingSection
                    business={business}
                    canWrite={canWrite}
                    pageName={form.pageName}
                    brandColorHex={form.brandColorHex}
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
          business={business}
          locations={locations}
          heroImageUrl={heroImageUrl}
          tagline={form.tagline}
          setTagline={form.setTagline}
          taglineError={form.taglineError || undefined}
          aboutError={form.aboutError}
          announcementError={form.announcementError}
          canWrite={canWrite}
          brandColorHex={form.brandColorHex}
          useBusinessEmail={form.useBusinessEmail}
          email={form.email}
          useBusinessPhone={form.useBusinessPhone}
          phone={form.phone}
          reviews={previewReviews}
          teamRatings={teamRatings}
          ratingDistribution={ratingDistribution}
          variantCatalog={variantCatalog}
          sectionCatalog={sectionCatalog}
          hasWebsiteBuilder={hasWebsiteBuilder}
          isCatalogLoading={isCatalogLoading}
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
      {canWrite && !isNative && (
        <VariantCartBar
          entries={cartItems}
          isLoading={isVariantCheckoutLoading}
          onRemove={(item) =>
            dispatch(item.kind === "section" ? removeSectionFromCartAction(item.id) : removeVariantFromCartAction(item.id))
          }
          onClear={() => dispatch(clearVariantCartAction())}
          onCheckout={handleCheckoutCart}
        />
      )}
    </div>
  );
}

export default WebsiteBuilderTab;
