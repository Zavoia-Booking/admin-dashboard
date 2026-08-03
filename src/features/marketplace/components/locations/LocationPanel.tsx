import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, ArrowUpRight, Star } from "lucide-react";
import type { LocationWithAssignments } from "../../types";
import { LocationVisibilitySection } from "../profile/LocationVisibilitySection";
import { MarketplaceImagesSection } from "../MarketplaceImagesSection";
import { usePortfolioManagement } from "../../hooks/usePortfolioManagement";
import { Button } from "../../../../shared/components/ui/button";
import { cn } from "../../../../shared/lib/utils";

interface LocationPanelProps {
  location: LocationWithAssignments;
  compactGallery?: boolean;
  onPortfolioBusyChange?: (isBusy: boolean) => void;
}

/**
 * Per-location Marketplace workspace. Canonical location data and assignment
 * ownership stay linked to their respective product areas.
 */
export function LocationPanel({
  location,
  compactGallery = false,
  onPortfolioBusyChange,
}: LocationPanelProps) {
  const { t } = useTranslation("marketplace");
  const navigate = useNavigate();
  const routeLocation = useLocation();

  // Per-location portfolio state, keyed on this location's id (same hook the
  // Portfolio flow uses). Passing a single-element catalog is enough since the
  // hook looks the active location up by id.
  const portfolio = usePortfolioManagement({
    locationId: location.id,
    locationsWithAssignments: [location],
  });
  const isPortfolioBusy = portfolio.portfolio.some(
    (image) =>
      image.isUploading ||
      image.isDeleting ||
      image.isSettingFeatured,
  );

  useEffect(() => {
    onPortfolioBusyChange?.(isPortfolioBusy);
    return () => onPortfolioBusyChange?.(false);
  }, [isPortfolioBusy, onPortfolioBusyChange]);

  const rating =
    typeof location.averageRating === "number" &&
    Number.isFinite(location.averageRating)
      ? location.averageRating
      : null;
  const totalReviews =
    typeof location.totalReviews === "number" &&
    Number.isSafeInteger(location.totalReviews) &&
    location.totalReviews >= 0
      ? location.totalReviews
      : 0;
  const roundedRating = rating != null ? Math.round(rating) : 0;

  return (
    <div className="space-y-6">
      <section
        className="rounded-2xl border border-border bg-surface px-4 py-4 shadow-sm md:px-5 md:py-5"
        aria-labelledby={`marketplace-location-title-${location.id}`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2
                id={`marketplace-location-title-${location.id}`}
                tabIndex={-1}
                className="truncate text-xl font-semibold tracking-tight text-foreground-1 focus:outline-none"
              >
                {location.name}
              </h2>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  location.isPublic
                    ? "border-success-border bg-success-bg text-success"
                    : "border-border bg-muted/30 text-foreground-3 dark:text-foreground-2",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    location.isPublic ? "bg-success" : "bg-border-strong",
                  )}
                  aria-hidden="true"
                />
                {location.isPublic
                  ? t("locations.visible")
                  : t("locations.hidden")}
              </span>
            </div>
            <p className="mt-1.5 truncate text-sm leading-6 text-foreground-3 dark:text-foreground-2">
              {location.address}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-navigate-to={`/locations?locationId=${location.id}`}
              onClick={() => navigate(`/locations?locationId=${location.id}`)}
              className="h-11 w-full justify-between gap-3 rounded-xl border border-border px-4 text-sm font-semibold text-foreground-1 hover:border-border-strong hover:text-primary sm:w-auto"
            >
              {t("locations.workspace.locationDetails")}
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-navigate-to={`/assignments?locationId=${location.id}`}
              onClick={() => navigate(`/assignments?locationId=${location.id}`)}
              className="h-11 w-full justify-between gap-3 rounded-xl border border-border px-4 text-sm font-semibold text-foreground-1 hover:border-border-strong hover:text-primary sm:w-auto"
            >
              {t("locations.workspace.servicesAndTeam")}
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

      <LocationVisibilitySection location={location} />

      {/* Portfolio gallery for this location */}
      <MarketplaceImagesSection
        locationId={location.id}
        featuredImageId={portfolio.featuredImageId}
        portfolioImages={portfolio.portfolio}
        onFeaturedImageChange={portfolio.setFeaturedImageId}
        onPortfolioImagesChange={portfolio.setPortfolio}
        compact={compactGallery}
      />

      {/* Reviews summary — same card family as the workspace header: title
          inside the card, meta below, action on the right. */}
      <section
        className="rounded-2xl border border-border bg-surface px-4 py-4 shadow-sm md:px-5 md:py-5"
        aria-labelledby={`marketplace-location-reviews-${location.id}`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <h3
              id={`marketplace-location-reviews-${location.id}`}
              className="text-lg font-semibold tracking-tight text-foreground-1"
            >
              {t("locations.reviews.title")}
            </h3>
            <div className="mt-1.5 flex items-center gap-3">
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
              {rating != null ? (
                <p className="text-sm font-semibold text-foreground-1">
                  {rating.toFixed(1)}
                  <span className="ml-2 text-sm font-normal text-foreground-3 dark:text-foreground-2">
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
            size="sm"
            onClick={() => {
              const existingState =
                routeLocation.state && typeof routeLocation.state === "object"
                  ? routeLocation.state
                  : {};
              navigate(
                `/marketplace?tab=reviews&locationId=${location.id}`,
                {
                  replace: true,
                  state: {
                    ...existingState,
                    marketplaceReviewReturnLocationId: location.id,
                  },
                },
              );
            }}
            className="group h-11 w-full justify-between gap-3 rounded-xl border border-border px-4 text-sm font-semibold text-foreground-1 hover:border-border-strong hover:text-primary sm:w-auto lg:shrink-0"
          >
            {t("locations.reviews.view")}
            <ArrowRight className="size-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </Button>
        </div>
      </section>
    </div>
  );
}

export default LocationPanel;
