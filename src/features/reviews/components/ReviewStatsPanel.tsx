import { Star, Info, Building2, Eye, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "../../../shared/components/ui/card";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../../shared/components/ui/avatar";
import { cn } from "../../../shared/lib/utils";
import type { LocationStats, ReviewStatsData, TeamMemberStats } from "../types";

interface ReviewStatsPanelProps {
  stats: ReviewStatsData | null;
  loading: boolean;
  selectedLocationId: number | null;
  selectedTeamMemberId: number | null;
  onLocationClick: (locationId: number) => void;
  onTeamMemberClick: (teamMemberId: number) => void;
}

function StarRow({
  rating,
  size = "sm",
}: {
  rating: number | null;
  size?: "sm" | "md";
}) {
  const cls = size === "md" ? "h-3.5 w-3.5" : "h-2.5 w-2.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${cls} ${
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

function OverallRatingCard({
  rating,
  totalReviews,
  locationCount,
}: {
  rating: number | null;
  totalReviews: number;
  locationCount: number;
}) {
  const { t } = useTranslation("reviews");
  const hasReviews = totalReviews > 0;

  return (
    <Card className="border-border bg-surface shadow-sm relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-transparent to-amber-400/5 pointer-events-none" />
      <CardContent className="px-4 py-3 relative">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex items-center justify-center h-6 w-6 rounded-md bg-amber-400/10">
            <Eye className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <h3 className="text-sm font-semibold text-foreground flex-1">
            {t("stats.overallTitle")}
          </h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 shrink-0">
            <Eye className="h-2.5 w-2.5" />
            {t("stats.overallBadge")}
          </span>
        </div>

        <div className="flex items-end gap-2.5">
          <span className="text-4xl font-bold text-foreground tabular-nums leading-none">
            {hasReviews && rating !== null ? rating.toFixed(1) : "—"}
          </span>
          <div className="flex flex-col gap-0.5 pb-0.5">
            <StarRow rating={rating} size="md" />
            <span className="text-[11px] text-foreground-3">
              {locationCount > 0
                ? t("stats.totalReviewsAcrossLocations", {
                    count: totalReviews,
                    locations: locationCount,
                  })
                : t("stats.totalReviews", { count: totalReviews })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LocationRow({
  location,
  selected,
  onClick,
}: {
  location: LocationStats;
  selected: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation("reviews");
  const hasReviews = location.totalReviews > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
        selected
          ? "bg-primary/10 hover:bg-primary/15"
          : "hover:bg-surface-hover",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center h-8 w-8 rounded-md shrink-0",
          selected ? "bg-primary/20" : "bg-primary/10",
        )}
      >
        <MapPin
          className={cn(
            "h-3.5 w-3.5",
            selected ? "text-primary" : "text-primary/80",
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate leading-tight">
          {location.name}
        </p>
        <p className="text-[11px] text-foreground-3 leading-tight">
          {t("stats.totalReviews", { count: location.totalReviews })}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <span className="text-sm font-bold text-foreground tabular-nums">
          {hasReviews && location.averageRating !== null
            ? location.averageRating.toFixed(1)
            : "—"}
        </span>
        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
      </div>
    </button>
  );
}

function BusinessRatingCard({
  rating,
  totalReviews,
  ratingDistribution,
}: {
  rating: number | null;
  totalReviews: number;
  ratingDistribution: ReviewStatsData["business"]["ratingDistribution"];
}) {
  const { t } = useTranslation("reviews");
  const hasReviews = totalReviews > 0;

  return (
    <Card className="border-border bg-surface shadow-sm h-fit">
      <CardContent className="px-3.5 py-3">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex items-center justify-center h-6 w-6 rounded-md bg-primary/10">
            <Building2 className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {t("stats.businessTitle")}
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-col items-center justify-center gap-0.5 sm:min-w-[80px]">
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {hasReviews && rating !== null ? rating.toFixed(1) : "—"}
            </span>
            <StarRow rating={rating} />
            <span className="text-[11px] text-foreground-3 mt-0.5">
              {t("stats.totalReviews", { count: totalReviews })}
            </span>
          </div>

          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => (
              <RatingBar
                key={star}
                star={star}
                count={
                  ratingDistribution[
                    star.toString() as keyof typeof ratingDistribution
                  ]
                }
                total={totalReviews}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamMemberRow({
  member,
  selected,
  onClick,
}: {
  member: TeamMemberStats;
  selected: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation("reviews");
  const hasReviews = member.totalReviews > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
        selected
          ? "bg-primary/10 hover:bg-primary/15"
          : "hover:bg-surface-hover",
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        {member.profileImage && (
          <AvatarImage
            src={member.profileImage}
            alt={`${member.firstName} ${member.lastName}`}
          />
        )}
        <AvatarFallback className="text-[10px] font-medium bg-primary/10 text-primary">
          {member.firstName[0]}
          {member.lastName[0]}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate leading-tight">
          {member.firstName} {member.lastName}
        </p>
        <p className="text-[11px] text-foreground-3 leading-tight">
          {t("stats.totalReviews", { count: member.totalReviews })}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <span className="text-sm font-bold text-foreground tabular-nums">
          {hasReviews ? member.averageRating.toFixed(1) : "—"}
        </span>
        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
      </div>
    </button>
  );
}

export function ReviewStatsPanel({
  stats,
  loading,
  selectedLocationId,
  selectedTeamMemberId,
  onLocationClick,
  onTeamMemberClick,
}: ReviewStatsPanelProps) {
  const { t } = useTranslation("reviews");

  if (loading) {
    return <ReviewStatsSkeleton />;
  }

  if (!stats) return null;

  const { overall, business, teamMembers, locations = [] } = stats;
  const locationCount = locations.length;

  return (
    <div className="space-y-3">
      <OverallRatingCard
        rating={overall.averageRating}
        totalReviews={overall.totalReviews}
        locationCount={locationCount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <BusinessRatingCard
          rating={business.averageRating}
          totalReviews={business.totalReviews}
          ratingDistribution={business.ratingDistribution}
        />

        {locations.length > 0 && (
          <Card className="border-border bg-surface shadow-sm h-fit">
            <CardContent className="p-0">
              <h3 className="text-sm font-semibold text-foreground px-3.5 pt-3 pb-1.5">
                {t("stats.locationsTitle")}
              </h3>
              <div className="max-h-[220px] overflow-y-auto divide-y divide-border">
                {locations.map((loc) => (
                  <LocationRow
                    key={loc.locationId}
                    location={loc}
                    selected={selectedLocationId === loc.locationId}
                    onClick={() => onLocationClick(loc.locationId)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {teamMembers.length > 0 && (
          <Card className="border-border bg-surface shadow-sm h-fit">
            <CardContent className="p-0">
              <h3 className="text-sm font-semibold text-foreground px-3.5 pt-3 pb-1.5">
                {t("stats.teamTitle")}
              </h3>
              <div className="max-h-[220px] overflow-y-auto divide-y divide-border">
                {teamMembers.map((member) => (
                  <TeamMemberRow
                    key={member.teamMemberId}
                    member={member}
                    selected={selectedTeamMemberId === member.teamMemberId}
                    onClick={() => onTeamMemberClick(member.teamMemberId)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/10">
        <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-[11px] text-foreground-2 leading-relaxed">
          {t("stats.infoText")}
        </p>
      </div>
    </div>
  );
}

function ReviewStatsSkeleton() {
  return (
    <div className="space-y-3">
      <Card className="border-border bg-surface shadow-sm">
        <CardContent className="px-4 py-3">
          <div className="animate-pulse">
            <div className="flex items-center gap-2 mb-2.5">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-4 w-24" />
              <div className="flex-1" />
              <Skeleton className="h-5 w-28 rounded-full" />
            </div>
            <div className="flex items-end gap-2.5">
              <Skeleton className="h-10 w-16" />
              <div className="flex flex-col gap-1 pb-0.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="border-border bg-surface shadow-sm">
          <CardContent className="px-3.5 py-3">
            <div className="animate-pulse">
              <div className="flex items-center gap-2 mb-2.5">
                <Skeleton className="h-6 w-6 rounded-md" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-col items-center gap-1 sm:min-w-[80px]">
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-2.5 w-16" />
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

        <Card className="border-border bg-surface shadow-sm">
          <CardContent className="p-0">
            <Skeleton className="h-4 w-28 mx-3.5 mt-3 mb-1.5" />
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 animate-pulse">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  );
}
