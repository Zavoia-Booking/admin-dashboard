import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Star } from 'lucide-react';

interface RatingDistribution {
  '5': number;
  '4': number;
  '3': number;
  '2': number;
  '1': number;
}

interface ReviewsRatingsProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
}

export function ReviewsRatings({
  averageRating,
  totalReviews,
  ratingDistribution
}: ReviewsRatingsProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating 
                ? 'text-warning fill-warning' 
                : 'text-foreground-3'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-foreground-1">Reviews & Ratings</h2>

      {/* Average Rating */}
      <Card className="py-3">
        <CardContent className="p-0 px-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-warning-bg border border-warning-border flex flex-col items-center justify-center">
              <Star className="h-4 w-4 text-warning fill-warning" />
              <span className="text-base font-bold text-warning">{averageRating}</span>
            </div>
            <div>
              <p className="text-xs text-foreground-3">Average Rating</p>
              <div className="flex items-center gap-1 mt-0.5">
                {renderStars(Math.round(averageRating))}
              </div>
              <p className="text-[10px] text-foreground-3 mt-0.5">Based on {totalReviews} reviews</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating Distribution - Visual */}
      <Card>
        <CardHeader className="pb-1 pt-3 px-3">
          <CardTitle className="text-sm text-foreground-1">Rating Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((rating) => {
              const distribution = ratingDistribution[rating.toString() as keyof RatingDistribution];
              return (
                <div key={rating} className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 w-10">
                    <span className="text-xs font-medium text-foreground-2">{rating}</span>
                    <Star className="h-3 w-3 text-warning fill-warning" />
                  </div>
                  <div className="flex-1 h-1.5 bg-surface-active rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-warning rounded-full transition-all"
                      style={{ width: `${distribution}%` }}
                    />
                  </div>
                  <span className="text-xs text-foreground-3 w-10 text-right">{distribution}%</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
