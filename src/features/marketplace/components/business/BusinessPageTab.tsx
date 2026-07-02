import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { LimitedAccessBanner } from "../../../../shared/components/common/subscription/LimitedAccessBanner";
import type { Business, Industry, IndustryTag, LocationWithAssignments, WebsiteVariantCatalogEntry } from "../../types";
import type { useMarketplaceForm } from "../../hooks/useMarketplaceForm";
import { MarketplaceDetailsSection } from "../profile/MarketplaceDetailsSection";
import IndustrySection from "../profile/IndustrySection";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { fetchWebsiteVariantCatalogAction, createWebsiteVariantCheckoutAction } from "../../actions";
import { selectWebsiteVariantCatalog, selectVariantCheckoutCreating } from "../../selectors";
import { selectCurrentUser } from "../../../auth/selectors";
import { BrandingSection } from "./BrandingSection";
import { SectionBuilder } from "./builder/SectionBuilder";
import { ThemePanel } from "./builder/ThemePanel";
import { accentIsPro, fontIsPro } from "./builder/theme";
import type { PreviewReview, RatingBars } from "./builder/LivePreview";

interface BusinessPageTabProps {
  business: Business | null;
  canWrite: boolean;
  heroImageUrl: string | null;
  industries: Industry[];
  industryTags: IndustryTag[];
  locations: LocationWithAssignments[];
  form: ReturnType<typeof useMarketplaceForm>;
  /** Real 5★ quotes + per-member ratings for the live preview (from the reviews store). */
  reviews?: PreviewReview[];
  teamRatings?: Record<number, { rating: number; count: number }>;
  ratingDistribution?: RatingBars;
}

/**
 * Business-level "page" tab — a single scrolling form, top to bottom:
 *  1. Page details   → public contact details (incl. the marketplace-card description) and the
 *     mandatory industry tags.
 *  2. Branding & theme → logo / slug / brand colour + font personality (global identity, reused across
 *     the marketplace).
 *  3. Page sections  → arrange the public page (reorder / show-hide / variant) and edit each section's
 *     own content inline — Hero (tagline + cover) / About / FAQ / Announcement — with the live preview
 *     opened on demand. The remaining sections are a themed *view* over the data above; nothing is
 *     duplicated.
 */
export function BusinessPageTab({
  business,
  canWrite,
  heroImageUrl,
  industries,
  industryTags,
  locations,
  form,
  reviews,
  teamRatings,
  ratingDistribution,
}: BusinessPageTabProps) {
  const { t } = useTranslation("marketplace");
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Paid section variants: catalog with per-business ownership + the checkout in-flight flag.
  const variantCatalog = useSelector(selectWebsiteVariantCatalog);
  const isVariantCheckoutLoading = useSelector(selectVariantCheckoutCreating);
  const currentUser = useSelector(selectCurrentUser);
  const hasWebsiteBuilder = currentUser?.entitlements?.features?.websiteBuilder ?? false;

  // Fetch the paid-variant catalog whenever the builder loads (including the return from a
  // Stripe purchase, which is a fresh page load) so locked/owned pills reflect ownership.
  useEffect(() => {
    dispatch(fetchWebsiteVariantCatalogAction.request());
  }, [dispatch]);

  // Return from Stripe checkout (successUrl = /marketplace?tab=business&variantPurchase=success):
  // toast, strip the marker param, and refetch the catalog once more after a short delay —
  // ownership lands via webhook, which can trail the redirect by a moment.
  const purchaseReturnHandled = useRef(false);
  useEffect(() => {
    if (searchParams.get("variantPurchase") !== "success" || purchaseReturnHandled.current) return;
    purchaseReturnHandled.current = true;
    toast.success(t("businessPage.paidVariants.purchaseSuccessToast"));
    setTimeout(() => dispatch(fetchWebsiteVariantCatalogAction.request()), 3000);
    const next = new URLSearchParams(searchParams);
    next.delete("variantPurchase");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, dispatch, t]);

  const handleBuyVariant = (variant: WebsiteVariantCatalogEntry) => {
    dispatch(
      createWebsiteVariantCheckoutAction.request({
        variantId: variant.id,
        successUrl: `${window.location.origin}/marketplace?tab=business&variantPurchase=success`,
        cancelUrl: `${window.location.origin}/marketplace?tab=business`,
      }),
    );
  };

  // Paywall: a Pro accent/font drives the live preview but can't be saved until the owner upgrades.
  // Today nothing Pro is owned, so an applied Pro pick is always a preview (see theme.accentIsPro).
  const accentPro = accentIsPro(form.brandColorHex);
  const fontPro = fontIsPro(form.fontKey);
  const previewingPro = accentPro || fontPro;
  const previewingLabel =
    accentPro && fontPro
      ? t("businessPage.pro.previewingStyles")
      : accentPro
        ? t("businessPage.pro.previewingColor")
        : t("businessPage.pro.previewingFont");
  // Placeholder until the billing/upgrade flow exists; will route to the subscription page later.
  const handleUpgrade = () => toast(t("businessPage.pro.upgradeToast"));
  return (
    <div className="max-w-7xl mb-0 md:mb-8">
      <LimitedAccessBanner className="!px-0 !pt-0" />
      <div
        className={!canWrite ? "pointer-events-none opacity-60" : ""}
        aria-disabled={!canWrite}
      >
        <div className="space-y-12">
          {/* 1. Page details */}
          <div className="space-y-8">
            <MarketplaceDetailsSection
              business={business}
              useBusinessName={form.useBusinessName}
              setUseBusinessName={form.setUseBusinessName}
              name={form.name}
              setName={form.setName}
              useBusinessEmail={form.useBusinessEmail}
              setUseBusinessEmail={form.setUseBusinessEmail}
              email={form.email}
              setEmail={form.setEmail}
              useBusinessPhone={form.useBusinessPhone}
              setUseBusinessPhone={form.setUseBusinessPhone}
              phone={form.phone}
              setPhone={form.setPhone}
              useBusinessDescription={form.useBusinessDescription}
              setUseBusinessDescription={form.setUseBusinessDescription}
              description={form.description}
              setDescription={form.setDescription}
              nameError={form.nameError || undefined}
              emailError={form.emailError || undefined}
              phoneError={form.phoneError || undefined}
              descriptionError={form.descriptionError || undefined}
            />
            <IndustrySection
              industries={industries}
              industryTags={industryTags}
              selectedTags={form.selectedIndustryTags}
              onTagsChange={form.setSelectedIndustryTags}
              error={form.industryTagsError || undefined}
            />
          </div>

          {/* 2. Studio — section list + brand controls + live preview, in one module */}
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
              // Brand band: three zones (identity lockup · accent · typeface) + a Pro-preview banner that
              // shows when the applied accent/font is a Pro pick (previewable, but save needs an upgrade).
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 items-stretch gap-x-8 gap-y-7 sm:grid-cols-2 2xl:grid-cols-[minmax(260px,1.1fr)_auto_auto]">
                  <BrandingSection
                    business={business}
                    canWrite={canWrite}
                    pageName={form.pageName}
                    brandColorHex={form.brandColorHex}
                    setBrandColorHex={form.setBrandColorHex}
                    fontKey={form.fontKey}
                  />
                  <div className="sm:col-span-2 2xl:col-span-1 2xl:border-l 2xl:border-border-subtle 2xl:pl-8">
                    <ThemePanel fontKey={form.fontKey} onFontChange={form.setFontKey} />
                  </div>
                </div>
                {previewingPro && (
                  <div className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/[0.05] px-4 py-2.5 dark:bg-primary/[0.08]">
                    <Sparkles className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden />
                    <p className="min-w-0 flex-1 text-[13px] leading-snug text-foreground-2">
                      <span className="font-medium text-foreground-1">{previewingLabel}</span>
                      <span className="text-foreground-3"> · {t("businessPage.pro.saveHint")}</span>
                    </p>
                    <button
                      type="button"
                      onClick={handleUpgrade}
                      className="shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-medium text-primary-foreground outline-none transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:opacity-90 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      {t("businessPage.pro.upgrade")}
                    </button>
                  </div>
                )}
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
            reviews={reviews}
            teamRatings={teamRatings}
            ratingDistribution={ratingDistribution}
            variantCatalog={variantCatalog}
            hasWebsiteBuilder={hasWebsiteBuilder}
            isVariantCheckoutLoading={isVariantCheckoutLoading}
            onBuyVariant={handleBuyVariant}
          />
        </div>
      </div>
    </div>
  );
}

export default BusinessPageTab;
