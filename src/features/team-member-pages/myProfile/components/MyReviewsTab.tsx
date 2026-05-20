import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CalendarArrowDown, CalendarArrowUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../../shared/components/ui/button";
import { BusinessReviewCard } from "../../../reviews/components/ReviewCard";
import { ReviewsHero } from "../../../reviews/components/ReviewsHero";
import { RatingBreakdown } from "../../../reviews/components/RatingBreakdown";
import { ReviewsInsightsPanel } from "../../../reviews/components/ReviewsInsightsPanel";
import { EmptyReviewsState } from "../../../reviews/components/EmptyReviewsState";
import { FirstReviewState } from "../../../reviews/components/FirstReviewState";
import { MobileClearFiltersFab } from "../../../reviews/components/MobileClearFiltersFab";
import { ReviewListSkeleton } from "../../../reviews/components/ReviewListSkeleton";
import {
  SortSelect,
  type SortGroup,
} from "../../../../shared/components/common/SortSelect";
import type { BusinessReview, ReviewStatsData } from "../../../reviews/types";
import type { MyStatsData, MyReviewsPayload } from "../api";
import { getMyReviews, getMyStats } from "../api";
import "../../../reviews/components/Reviews.css";

const PAGE_SIZE = 20;

/**
 * Team-member reviews tab (`/my-profile?tab=reviews`).
 *
 * Shares the redesigned reviews UI with the owner page ([ReviewsTab]):
 * `ReviewsHero` on top, then a two-column card — review list + sticky
 * insights sidebar. The data layer stays team-member-scoped (local state +
 * `getMyReviews`/`getMyStats`); only rating + sort filtering is supported
 * because the team-member API doesn't expose date/location filters.
 */
export function MyReviewsTab() {
  const { t } = useTranslation("reviews");

  const [stats, setStats] = useState<MyStatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [reviews, setReviews] = useState<BusinessReview[]>([]);
  const [total, setTotal] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const response = await getMyStats();
        if (!cancelled) setStats(response.data);
      } catch (error: any) {
        if (!cancelled) {
          console.error("Failed to fetch my stats:", error);
          toast.error(error?.response?.data?.error || t("common:errors.failedToLoadStats"));
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const params: MyReviewsPayload = {
          offset: 0,
          limit: PAGE_SIZE,
          sortOrder,
          rating: ratingFilter ?? undefined,
        };
        const response = await getMyReviews(params);
        if (!cancelled) {
          setReviews(response.data as BusinessReview[]);
          setTotal(response.pagination.total);
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error("Failed to fetch my reviews:", error);
          toast.error(
            error?.response?.data?.error || t("common:errors.failedToLoadReviews"),
          );
        }
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    };
    fetchReviews();
    return () => { cancelled = true; };
  }, [ratingFilter, sortOrder]);

  const handleLoadMore = useCallback(async () => {
    try {
      setLoadingMore(true);
      const params: MyReviewsPayload = {
        offset: reviews.length,
        limit: PAGE_SIZE,
        sortOrder,
        rating: ratingFilter ?? undefined,
      };
      const response = await getMyReviews(params);
      setReviews((prev) => [...prev, ...(response.data as BusinessReview[])]);
      setTotal(response.pagination.total);
    } catch (error: any) {
      console.error("Failed to load more reviews:", error);
      toast.error(error?.response?.data?.error || t("common:errors.failedToLoadReviews"));
    } finally {
      setLoadingMore(false);
    }
  }, [reviews.length, ratingFilter, sortOrder]);

  const handleRatingFilter = (star: number) => {
    setRatingFilter((prev) => (prev === star ? null : star));
  };

  const hasMore = reviews.length < total;
  const loading = reviewsLoading || loadingMore;
  const activeFilterCount = ratingFilter !== null ? 1 : 0;

  // `ReviewsInsightsPanel` expects the owner page's nested `ReviewStatsData`
  // shape; the team-member API returns a flat `MyStatsData`. Adapt it — the
  // panel only reads `business.ratingDistribution` + `business.totalReviews`,
  // so the empty `locations`/`teamMembers` arrays are never touched.
  const adaptedStats: ReviewStatsData | null = stats
    ? {
        overall: {
          averageRating: stats.averageRating,
          totalReviews: stats.totalReviews,
        },
        business: {
          averageRating: stats.averageRating,
          totalReviews: stats.totalReviews,
          ratingDistribution: stats.ratingDistribution,
        },
        locations: [],
        teamMembers: [],
      }
    : null;

  // Only date sort is offered — the team-member reviews API supports
  // `sortOrder` (newest/oldest) but not a `sortBy` axis, so unlike the owner
  // page there's no rating-sort group and the value IS the sort order.
  const sortGroups: SortGroup[] = [
    {
      label: t("filter.sortGroupDate"),
      options: [
        { value: "DESC", label: t("filter.sortNewest"), icon: CalendarArrowDown },
        { value: "ASC", label: t("filter.sortOldest"), icon: CalendarArrowUp },
      ],
    },
  ];

  // True zero-state: stats loaded and the professional has never received a
  // review. Skip the toolbar + sidebar — just the hero and a first-review CTA.
  const isTrulyEmpty =
    !statsLoading && stats !== null && stats.totalReviews === 0;

  if (isTrulyEmpty) {
    return (
      <div className="w-full max-w-5xl mb-0 md:mb-8 space-y-5">
        <ReviewsHero
          rating={null}
          totalReviews={0}
          locationCount={0}
          teamMemberCount={0}
          loading={false}
        />
        <FirstReviewState />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mb-0 md:mb-8 space-y-5">
      {/* Hero — personal reviews, so location/team counts are 0 (the hero
          hides zero-count stats). Mobile gets the distribution inside the
          collapsible; desktop carries it in the sidebar instead. */}
      <ReviewsHero
        rating={stats?.averageRating ?? null}
        totalReviews={stats?.totalReviews ?? 0}
        locationCount={0}
        teamMemberCount={0}
        loading={statsLoading && !stats}
        expandableContent={
          stats && stats.totalReviews > 0 ? (
            <RatingBreakdown
              distribution={stats.ratingDistribution}
              total={stats.totalReviews}
              selectedRating={ratingFilter}
              onRatingClick={handleRatingFilter}
            />
          ) : undefined
        }
      />

      <section className="rounded-xl border border-border bg-surface px-3 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
          {/* Reviews column */}
          <section className="space-y-4 min-w-0">
            {/* Toolbar — sort only (team-member API has no date/location
                filters; rating is filtered by clicking the distribution). */}
            <div className="flex items-center justify-end">
              <SortSelect
                value={sortOrder}
                onValueChange={(v) => setSortOrder(v as "DESC" | "ASC")}
                placeholder={t("filter.sortLabel")}
                groups={sortGroups}
              />
            </div>

            {/* Reviews list — keyed on the rating filter so the wrapper
                remounts and re-triggers the fade+settle animation on apply. */}
            <div
              key={ratingFilter ?? "all"}
              className="reviews-content-enter space-y-3"
            >
              {reviewsLoading ? (
                <ReviewListSkeleton />
              ) : reviews.length === 0 ? (
                <EmptyReviewsState
                  kind={ratingFilter !== null ? "filtered" : "none"}
                  variant="personal"
                  onClearFilters={
                    ratingFilter !== null
                      ? () => setRatingFilter(null)
                      : undefined
                  }
                />
              ) : (
                <>
                  <ul className="reviews-list-stagger divide-y divide-border/60">
                    {reviews.map((review) => (
                      <BusinessReviewCard key={review.id} review={review} />
                    ))}
                  </ul>

                  {hasMore && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        rounded="full"
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="px-6"
                      >
                        {loadingMore ? (
                          <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-foreground-3/30 border-t-foreground-3 animate-spin" />
                        ) : (
                          t("loadMore")
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Insights sidebar (lg+) — sticky, hairline-separated from the
              reviews column inside the shared card. */}
          <aside className="hidden lg:block lg:sticky lg:top-18 min-w-0 lg:border-l lg:border-border lg:pl-8">
            <ReviewsInsightsPanel
              stats={adaptedStats}
              loading={statsLoading}
              variant="personal"
              selectedRating={ratingFilter}
              onRatingClick={handleRatingFilter}
              activeFilterCount={activeFilterCount}
              onClearAll={() => setRatingFilter(null)}
            />
          </aside>
        </div>
      </section>

      {/* Mobile-only floating Clear pill — outside the card so it floats over
          page chrome. Renders only when a rating filter is active. */}
      <MobileClearFiltersFab
        activeFilterCount={activeFilterCount}
        onClearAll={() => setRatingFilter(null)}
      />
    </div>
  );
}
