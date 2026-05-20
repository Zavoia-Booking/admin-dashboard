import { Eye, Layers, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { cn } from "../../../shared/lib/utils";
import { RatingBreakdown } from "./RatingBreakdown";
import type { ReviewStatsData } from "../types";

interface ReviewsInsightsPanelProps {
  stats: ReviewStatsData | null;
  loading: boolean;
  className?: string;
  selectedRating?: number | null;
  onRatingClick?: (rating: number) => void;
  activeFilterCount?: number;
  onClearAll?: () => void;
}

/**
 * Sidebar surface that mirrors [ReviewsHero]'s recipe: rounded-xl border
 * + bg-surface + subtle tonal wash. Wash uses the brand terracotta so the
 * panel rhymes with the hero's amber wash without competing for it.
 * Inside: distribution → % positive pull-quote → "About this score" footer.
 */
export function ReviewsInsightsPanel({
  stats,
  loading,
  className,
  selectedRating,
  onRatingClick,
  activeFilterCount = 0,
  onClearAll,
}: ReviewsInsightsPanelProps) {
  const { t } = useTranslation("reviews");

  if (loading && !stats) {
    return <InsightsPanelSkeleton className={className} />;
  }

  if (!stats) return null;

  const { business } = stats;
  if (business.totalReviews === 0) return null;

  const positiveCount =
    (business.ratingDistribution["5"] ?? 0) +
    (business.ratingDistribution["4"] ?? 0);
  const positivePct = Math.round((positiveCount / business.totalReviews) * 100);

  return (
    <aside
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-surface",
        "px-4 py-4 sm:px-5 sm:py-5",
        className,
      )}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/[0.035] via-transparent to-primary/[0.035] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-5">
        <RatingBreakdown
          distribution={business.ratingDistribution}
          total={business.totalReviews}
          selectedRating={selectedRating}
          onRatingClick={onRatingClick}
        />

        <div className="h-px bg-border/60" aria-hidden="true" />

        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[34px] leading-none font-semibold tabular-nums tracking-[-0.02em] text-primary-700 dark:text-primary-500">
              {positivePct}%
            </span>
            <span className="text-[12px] font-medium text-foreground-2">
              {t("stats.positiveShareLabel")}
            </span>
          </div>
          <span className="text-[11.5px] text-foreground-3">
            {t("stats.positiveShareCaption", { count: business.totalReviews })}
          </span>
        </div>

        <div className="h-px bg-border/60" aria-hidden="true" />

        <div className="flex flex-col gap-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground-3">
            {t("stats.aboutEyebrow")}
          </div>
          <div className="flex items-start gap-2.5">
            <Layers
              className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p className="text-[11.5px] text-foreground-2 leading-relaxed">
              {t("stats.calculationNote")}
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <Eye
              className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p className="text-[11.5px] text-foreground-2 leading-relaxed">
              {t("stats.audienceNote")}
            </p>
          </div>
        </div>

        {activeFilterCount > 0 && onClearAll && (
          <>
            <div className="h-px bg-border/60" aria-hidden="true" />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClearAll}
                aria-label={t("filters.clearAll")}
                className={cn(
                  "group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
                  "text-[11px] font-medium text-foreground-3",
                  "transition-colors duration-150 ease-out",
                  "hover:text-foreground-1",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  "cursor-pointer",
                )}
              >
                <RotateCcw
                  className="h-3 w-3 shrink-0 transition-colors group-hover:text-primary"
                  aria-hidden="true"
                />
                {t("filters.clearAll")}
                <span
                  className="flex size-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold leading-none text-primary-foreground tabular-nums"
                  aria-hidden="true"
                >
                  {activeFilterCount}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

function InsightsPanelSkeleton({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-surface",
        "px-4 py-4 sm:px-5 sm:py-5",
        className,
      )}
    >
      <div className="flex flex-col gap-5">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          {[1, 2, 3, 4, 5].map((j) => (
            <Skeleton key={j} className="h-4 w-full rounded-full" />
          ))}
        </div>
        <div className="h-px bg-border/60" aria-hidden="true" />
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </aside>
  );
}
