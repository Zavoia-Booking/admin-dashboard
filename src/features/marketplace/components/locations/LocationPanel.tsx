import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Star, ArrowRight } from "lucide-react";
import type { LocationWithAssignments } from "../../types";
import { LocationVisibilitySection } from "../profile/LocationVisibilitySection";
import { MarketplaceImagesSection } from "../MarketplaceImagesSection";
import { usePortfolioManagement } from "../../hooks/usePortfolioManagement";
import { SectionDivider } from "../../../../shared/components/common/SectionDivider";
import { Button } from "../../../../shared/components/ui/button";
import { cn } from "../../../../shared/lib/utils";

interface LocationPanelProps {
  location: LocationWithAssignments;
}

/**
 * Per-location detail panel: visibility/booking toggles + identity (reused
 * LocationVisibilitySection single card), portfolio gallery, and a reviews
 * summary that deep-links into the location-scoped Reviews tab.
 */
export function LocationPanel({ location }: LocationPanelProps) {
  const { t } = useTranslation("marketplace");
  const navigate = useNavigate();

  // Per-location portfolio state, keyed on this location's id (same hook the
  // Portfolio flow uses). Passing a single-element catalog is enough since the
  // hook looks the active location up by id.
  const portfolio = usePortfolioManagement({
    locationId: location.id,
    locationsWithAssignments: [location],
  });

  const rating = location.averageRating ?? null;
  const totalReviews = location.totalReviews ?? 0;
  const roundedRating = rating != null ? Math.round(rating) : 0;

  return (
    <div className="space-y-10">
      {/* Visibility, booking, identity, assignments — reused single card */}
      <LocationVisibilitySection locations={[location]} />

      {/* Portfolio gallery for this location */}
      <MarketplaceImagesSection
        locationId={location.id}
        featuredImageId={portfolio.featuredImageId}
        portfolioImages={portfolio.portfolio}
        onFeaturedImageChange={portfolio.setFeaturedImageId}
        onPortfolioImagesChange={portfolio.setPortfolio}
      />

      {/* Reviews summary */}
      <div className="max-w-5xl space-y-6">
        <SectionDivider
          title={t("locations.reviews.title")}
          className="uppercase tracking-wider text-foreground-2"
        />
        <div className="rounded-2xl p-4 border border-border bg-white dark:bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    rating != null && i < roundedRating
                      ? "fill-amber-400 text-amber-400"
                      : "fill-muted text-muted-foreground/40",
                  )}
                />
              ))}
            </div>
            <div className="space-y-0.5">
              {rating != null ? (
                <p className="text-sm font-semibold text-foreground-1">
                  {rating.toFixed(1)}
                  <span className="ml-2 text-xs font-normal text-foreground-3 dark:text-foreground-2">
                    {t("locations.reviews.count", { count: totalReviews })}
                  </span>
                </p>
              ) : (
                <p className="text-sm font-medium text-foreground-3 dark:text-foreground-2">
                  {t("locations.reviews.empty")}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            rounded="full"
            size="sm"
            onClick={() => navigate(`/marketplace?tab=reviews&locationId=${location.id}`)}
            className="group !min-h-0 h-8 !px-4 border border-border hover:border-border-strong text-foreground-2 hover:text-primary flex items-center gap-1 w-full sm:w-auto justify-center"
          >
            <span className="text-xs font-medium">{t("locations.reviews.view")}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LocationPanel;
