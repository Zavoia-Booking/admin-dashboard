import { useTranslation } from 'react-i18next';
import { Star, MessageSquare } from 'lucide-react';

interface RatingDistribution {
  '5': number;
  '4': number;
  '3': number;
  '2': number;
  '1': number;
}

interface ReviewsWidgetProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= rating ? 'text-warning fill-warning' : 'text-foreground-3'}`}
        />
      ))}
    </div>
  );
}

export function ReviewsWidget({
  averageRating,
  totalReviews,
  ratingDistribution,
}: ReviewsWidgetProps) {
  const { t } = useTranslation('dashboard');
  const isEmpty = totalReviews === 0;
  const maxCount = Math.max(...Object.values(ratingDistribution), 1);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-warning-bg flex items-center justify-center">
          <Star className="h-3.5 w-3.5 text-warning" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-3">
          {t('reviews.title')}
        </p>
      </div>

      {isEmpty ? (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4">
          <div className="flex items-center gap-0.5 opacity-30">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className="h-5 w-5 text-foreground-3" />
            ))}
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground-2">{t('reviews.noReviews')}</p>
            <p className="text-xs text-foreground-3 max-w-[180px] leading-relaxed">
              {t('reviews.noReviewsDescription')}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-active border border-border-subtle">
            <MessageSquare className="h-3 w-3 text-foreground-3" />
            <span className="text-[10px] text-foreground-3">{t('reviews.totalReviews')}</span>
          </div>
        </div>
      ) : (
        <>
          {/* Rating hero */}
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-warning-bg border border-warning-border flex flex-col items-center justify-center shrink-0">
              <p className="text-xl font-bold text-warning tabular-nums leading-none">
                {averageRating.toFixed(1)}
              </p>
              <Star className="h-3 w-3 text-warning fill-warning mt-0.5" />
            </div>
            <div className="flex flex-col gap-1">
              <StarRating rating={Math.round(averageRating)} />
              <p className="text-[10px] text-foreground-3">
                {totalReviews === 1 ? t('reviews.basedOnReview', { count: totalReviews }) : t('reviews.basedOnReviews', { count: totalReviews })}
              </p>
            </div>
          </div>

          {/* Distribution bars */}
          <div className="flex flex-col gap-1.5">
            {[5, 4, 3, 2, 1].map(star => {
              const count = ratingDistribution[String(star) as keyof RatingDistribution];
              const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
              const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 w-8 shrink-0">
                    <span className="text-[10px] font-medium text-foreground-2">{star}</span>
                    <Star className="h-2.5 w-2.5 text-warning fill-warning" />
                  </div>
                  <div className="flex-1 h-1.5 rounded-full bg-surface-active overflow-hidden">
                    <div
                      className="h-full bg-warning rounded-full transition-all duration-700"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-foreground-3 tabular-nums w-7 text-right">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
