import { Star, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../../shared/components/ui/avatar";
import type { BusinessReview, TeamMemberReview } from "../types";

function formatRelativeTime(
  dateStr: string,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t("time.justNow");
  if (diffMins < 60) return t("time.minutesAgo", { count: diffMins });
  if (diffHours < 24) return t("time.hoursAgo", { count: diffHours });
  if (diffDays < 7) return t("time.daysAgo", { count: diffDays });

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= rating
              ? "text-amber-400 fill-amber-400"
              : "text-border fill-border"
          }`}
        />
      ))}
    </div>
  );
}

interface BusinessReviewCardProps {
  review: BusinessReview;
}

export function BusinessReviewCard({ review }: BusinessReviewCardProps) {
  const { t } = useTranslation("reviews");
  const initials =
    (review.customer.firstName?.[0] ?? "") +
    (review.customer.lastName?.[0] ?? "");

  return (
    <div className="flex gap-3 p-4 rounded-xl bg-surface border border-border">
      <Avatar className="h-9 w-9 shrink-0 mt-0.5">
        {review.customer.profileImage && (
          <AvatarImage
            src={review.customer.profileImage}
            alt={review.customer.firstName}
          />
        )}
        <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-sm font-medium text-foreground">
              {review.customer.firstName} {review.customer.lastName}
            </span>
            <StarRating rating={review.rating} />
          </div>
          <span className="text-xs text-foreground-3 shrink-0 pt-0.5">
            {formatRelativeTime(review.createdAt, t)}
          </span>
        </div>

        {review.comment && (
          <p className="text-sm text-foreground-2 leading-relaxed">
            {review.comment}
          </p>
        )}

        {review.location && (
          <div className="inline-flex items-center gap-1 text-[11px] text-foreground-3 mt-1">
            <MapPin className="h-3 w-3" />
            <span>{review.location.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface TeamMemberReviewCardProps {
  review: TeamMemberReview;
}

export function TeamMemberReviewCard({ review }: TeamMemberReviewCardProps) {
  const { t } = useTranslation("reviews");
  const customerInitials =
    (review.customer.firstName?.[0] ?? "") +
    (review.customer.lastName?.[0] ?? "");
  const professionalInitials =
    (review.professional.firstName?.[0] ?? "") +
    (review.professional.lastName?.[0] ?? "");

  return (
    <div className="flex gap-3 p-4 rounded-xl bg-surface border border-border">
      <Avatar className="h-9 w-9 shrink-0 mt-0.5">
        {review.customer.profileImage && (
          <AvatarImage
            src={review.customer.profileImage}
            alt={review.customer.firstName}
          />
        )}
        <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
          {customerInitials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-sm font-medium text-foreground">
              {review.customer.firstName} {review.customer.lastName}
            </span>
            <StarRating rating={review.rating} />
          </div>
          <span className="text-xs text-foreground-3 shrink-0 pt-0.5">
            {formatRelativeTime(review.createdAt, t)}
          </span>
        </div>

        {review.comment && (
          <p className="text-sm text-foreground-2 leading-relaxed">
            {review.comment}
          </p>
        )}

        {/* Team member + location attribution */}
        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-border/50">
          <Avatar className="h-5 w-5">
            {review.professional.profileImage && (
              <AvatarImage
                src={review.professional.profileImage}
                alt={review.professional.firstName}
              />
            )}
            <AvatarFallback className="text-[10px] font-medium bg-secondary text-secondary-foreground">
              {professionalInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-foreground-3">
            {t("card.reviewFor")}{" "}
            <span className="font-medium text-foreground-2">
              {review.professional.firstName} {review.professional.lastName}
            </span>
          </span>
          {review.location && (
            <span className="inline-flex items-center gap-1 text-[11px] text-foreground-3">
              <MapPin className="h-3 w-3" />
              {review.location.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
