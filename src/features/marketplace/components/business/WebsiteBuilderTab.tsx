import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { LimitedAccessBanner } from "../../../../shared/components/common/subscription/LimitedAccessBanner";
import type { Business, LocationWithAssignments } from "../../types";
import type { useMarketplaceForm } from "../../hooks/useMarketplaceForm";
import { fetchReviewStatsAction, fetchHighlightReviewsAction } from "../../../reviews/actions";
import { selectReviewStats, selectHighlightReviews } from "../../../reviews/selectors";
import { BrandingSection } from "./BrandingSection";
import { SectionBuilder } from "./builder/SectionBuilder";
import { ThemePanel } from "./builder/ThemePanel";
import { accentIsPro, fontIsPro } from "./builder/theme";
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
  const reviewStats = useSelector(selectReviewStats);
  const highlightReviews = useSelector(selectHighlightReviews);

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
  }, [dispatch]);

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

  const accentPro = accentIsPro(form.brandColorHex);
  const fontPro = fontIsPro(form.fontKey);
  const previewingPro = accentPro || fontPro;
  const previewingLabel =
    accentPro && fontPro
      ? t("businessPage.pro.previewingStyles")
      : accentPro
        ? t("businessPage.pro.previewingColor")
        : t("businessPage.pro.previewingFont");

  const handleUpgrade = () => toast(t("businessPage.pro.upgradeToast"));

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
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(300px,1fr)_minmax(210px,0.58fr)_minmax(360px,1.08fr)]">
                <BrandingSection
                  business={business}
                  canWrite={canWrite}
                  pageName={form.pageName}
                  brandColorHex={form.brandColorHex}
                  setBrandColorHex={form.setBrandColorHex}
                  fontKey={form.fontKey}
                />
                <div className="min-w-0">
                  <ThemePanel fontKey={form.fontKey} onFontChange={form.setFontKey} />
                </div>
              </div>
              {previewingPro && (
                <div className="flex flex-col gap-3 border-t border-border-subtle pt-3 sm:flex-row sm:items-center">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="size-4" strokeWidth={1.8} aria-hidden />
                  </span>
                  <p className="min-w-0 flex-1 text-pretty text-[13px] leading-5 text-foreground-2">
                    <span className="font-medium text-foreground-1">{previewingLabel}</span>
                    <span className="text-foreground-3">. {t("businessPage.pro.saveHint")}</span>
                  </p>
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    className="shrink-0 rounded-full border border-border bg-surface px-4 py-2 text-[13px] font-semibold text-foreground-1 outline-none transition-[transform,border-color,background-color] duration-150 ease-out hover:border-border-strong hover:bg-surface-hover active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-focus"
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
          reviews={previewReviews}
          teamRatings={teamRatings}
          ratingDistribution={ratingDistribution}
        />
      </div>
    </div>
  );
}

export default WebsiteBuilderTab;
