import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Star, ArrowUpDown, MessageSquareText, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../../shared/components/ui/button";
import { Card, CardContent } from "../../../../shared/components/ui/card";
import { Skeleton } from "../../../../shared/components/ui/skeleton";
import { BusinessReviewCard } from "../../../reviews/components/ReviewCard";
import type { BusinessReview } from "../../../reviews/types";
import type {
  MyStatsData,
  MyReviewsPayload,
} from "../api";
import { getMyReviews, getMyStats } from "../api";

const PAGE_SIZE = 20;

function StarRow({ rating }: { rating: number | null }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3 w-3 ${
            rating !== null && star <= Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-border fill-border"
          }`}
        />
      ))}
    </div>
  );
}

function RatingBar({
  star,
  count,
  total,
}: {
  star: number;
  count: number;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-foreground-2 w-3 text-right tabular-nums">
        {star}
      </span>
      <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400 shrink-0" />
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[11px] text-foreground-3 w-5 text-right tabular-nums">
        {count}
      </span>
    </div>
  );
}

function MyStatsPanel({
  stats,
  loading,
}: {
  stats: MyStatsData | null;
  loading: boolean;
}) {
  const { t } = useTranslation("reviews");

  if (loading) return <MyStatsSkeleton />;
  if (!stats) return null;

  const hasReviews = stats.totalReviews > 0;

  return (
    <div className="space-y-3">
      <Card className="border-border bg-surface shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-transparent to-amber-400/5 pointer-events-none" />
        <CardContent className="px-4 py-3 relative">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex items-center justify-center h-6 w-6 rounded-md bg-amber-400/10">
              <Star className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {t("myStats.title")}
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col items-center justify-center gap-0.5 sm:min-w-[80px]">
              <span className="text-4xl font-bold text-foreground tabular-nums leading-none">
                {hasReviews && stats.averageRating !== null
                  ? stats.averageRating.toFixed(1)
                  : "—"}
              </span>
              <StarRow rating={stats.averageRating} />
              <span className="text-[11px] text-foreground-3 mt-0.5">
                {t("stats.totalReviews", { count: stats.totalReviews })}
              </span>
            </div>

            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <RatingBar
                  key={star}
                  star={star}
                  count={
                    stats.ratingDistribution[
                      star.toString() as keyof typeof stats.ratingDistribution
                    ]
                  }
                  total={stats.totalReviews}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/10">
        <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-[11px] text-foreground-2 leading-relaxed">
          {t("myStats.infoText")}
        </p>
      </div>
    </div>
  );
}

function MyStatsSkeleton() {
  return (
    <div className="space-y-3">
      <Card className="border-border bg-surface shadow-sm">
        <CardContent className="px-4 py-3">
          <div className="animate-pulse">
            <div className="flex items-center gap-2 mb-2.5">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col items-center gap-1 sm:min-w-[80px]">
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-14" />
              </div>
              <div className="flex-1 space-y-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Skeleton className="h-2.5 w-3" />
                    <Skeleton className="h-2.5 w-2.5" />
                    <Skeleton className="h-1.5 flex-1 rounded-full" />
                    <Skeleton className="h-2.5 w-5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  );
}

function ReviewListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex gap-3 p-4 rounded-xl bg-surface border border-border"
        >
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3.5 w-20" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyReviews() {
  const { t } = useTranslation("reviews");

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="h-12 w-12 rounded-full bg-surface-hover flex items-center justify-center">
        <MessageSquareText className="h-6 w-6 text-foreground-3" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground-2">
          {t("empty.title")}
        </p>
        <p className="text-xs text-foreground-3 max-w-xs">
          {t("myStats.emptyDescription")}
        </p>
      </div>
    </div>
  );
}

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

  return (
    <div className="max-w-5xl mb-0 md:mb-8 space-y-5">
      <MyStatsPanel stats={stats} loading={statsLoading} />

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {[5, 4, 3, 2, 1].map((star) => (
          <button
            key={star}
            onClick={() => handleRatingFilter(star)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              ratingFilter === star
                ? "border-amber-400 bg-amber-50 text-amber-700"
                : "border-border bg-surface text-foreground-2 hover:bg-surface-hover"
            }`}
          >
            <Star
              className={`h-3 w-3 ${
                ratingFilter === star
                  ? "text-amber-400 fill-amber-400"
                  : "text-foreground-3"
              }`}
            />
            {star}
          </button>
        ))}

        <button
          onClick={() =>
            setSortOrder((o) => (o === "DESC" ? "ASC" : "DESC"))
          }
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border border-border bg-surface text-foreground-2 hover:bg-surface-hover transition-colors ml-auto"
        >
          <ArrowUpDown className="h-3 w-3" />
          {sortOrder === "DESC" ? t("filters.newest") : t("filters.oldest")}
        </button>
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {reviewsLoading && reviews.length === 0 ? (
          <ReviewListSkeleton />
        ) : reviews.length === 0 ? (
          <EmptyReviews />
        ) : (
          <>
            {reviews.map((review) => (
              <BusinessReviewCard key={review.id} review={review} />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="rounded-full px-6"
                >
                  {loadingMore ? (
                    <div className="rounded-full border-2 border-foreground-3/30 border-t-foreground-3 animate-spin h-3.5 w-3.5" />
                  ) : (
                    t("loadMore")
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
