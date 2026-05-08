import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Star,
  ArrowUpDown,
  ChevronDown,
  MessageSquareText,
  X,
  MapPin,
} from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../../shared/components/ui/avatar";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import {
  fetchReviewStatsAction,
  fetchBusinessReviewsAction,
  fetchMoreBusinessReviewsAction,
  fetchTeamMemberReviewsAction,
  fetchMoreTeamMemberReviewsAction,
} from "../actions";
import {
  selectReviewStats,
  selectReviewStatsLoading,
  selectBusinessReviews,
  selectBusinessReviewsTotal,
  selectBusinessReviewsLoading,
  selectTeamMemberReviews,
  selectTeamMemberReviewsTotal,
  selectTeamMemberReviewsLoading,
} from "../selectors";
import { ReviewStatsPanel } from "./ReviewStatsPanel";
import { BusinessReviewCard, TeamMemberReviewCard } from "./ReviewCard";
import type { ReviewSubTab } from "../types";

const PAGE_SIZE = 20;

export function ReviewsTab() {
  const dispatch = useDispatch();
  const { t } = useTranslation("reviews");

  const stats = useSelector(selectReviewStats);
  const statsLoading = useSelector(selectReviewStatsLoading);
  const businessReviews = useSelector(selectBusinessReviews);
  const businessReviewsTotal = useSelector(selectBusinessReviewsTotal);
  const businessReviewsLoading = useSelector(selectBusinessReviewsLoading);
  const teamMemberReviews = useSelector(selectTeamMemberReviews);
  const teamMemberReviewsTotal = useSelector(selectTeamMemberReviewsTotal);
  const teamMemberReviewsLoading = useSelector(selectTeamMemberReviewsLoading);

  const [subTab, setSubTab] = useState<ReviewSubTab>("business");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [teamMemberFilter, setTeamMemberFilter] = useState<number | null>(
    null,
  );
  const [locationFilter, setLocationFilter] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");
  const [teamMemberDropdownOpen, setTeamMemberDropdownOpen] = useState(false);

  // Fetch stats on mount
  useEffect(() => {
    dispatch(fetchReviewStatsAction.request());
  }, [dispatch]);

  // Fetch reviews when filters or sub-tab change
  useEffect(() => {
    if (subTab === "business") {
      dispatch(
        fetchBusinessReviewsAction.request({
          offset: 0,
          limit: PAGE_SIZE,
          rating: ratingFilter ?? undefined,
          locationId: locationFilter ?? undefined,
          sortOrder,
        }),
      );
    } else {
      dispatch(
        fetchTeamMemberReviewsAction.request({
          offset: 0,
          limit: PAGE_SIZE,
          rating: ratingFilter ?? undefined,
          teamMemberId: teamMemberFilter ?? undefined,
          locationId: locationFilter ?? undefined,
          sortOrder,
        }),
      );
    }
  }, [dispatch, subTab, ratingFilter, teamMemberFilter, locationFilter, sortOrder]);

  const handleLoadMore = useCallback(() => {
    if (subTab === "business") {
      dispatch(
        fetchMoreBusinessReviewsAction.request({
          offset: businessReviews.length,
          limit: PAGE_SIZE,
          rating: ratingFilter ?? undefined,
          locationId: locationFilter ?? undefined,
          sortOrder,
        }),
      );
    } else {
      dispatch(
        fetchMoreTeamMemberReviewsAction.request({
          offset: teamMemberReviews.length,
          limit: PAGE_SIZE,
          rating: ratingFilter ?? undefined,
          teamMemberId: teamMemberFilter ?? undefined,
          locationId: locationFilter ?? undefined,
          sortOrder,
        }),
      );
    }
  }, [
    dispatch,
    subTab,
    businessReviews.length,
    teamMemberReviews.length,
    ratingFilter,
    teamMemberFilter,
    locationFilter,
    sortOrder,
  ]);

  const handleRatingFilter = (star: number) => {
    setRatingFilter((prev) => (prev === star ? null : star));
  };

  const handleSubTabChange = (tab: ReviewSubTab) => {
    setSubTab(tab);
    setRatingFilter(null);
    setTeamMemberFilter(null);
    setLocationFilter(null);
  };

  const selectedLocation = stats?.locations?.find(
    (l) => l.locationId === locationFilter,
  );

  const clearAllFilters = () => {
    setRatingFilter(null);
    setTeamMemberFilter(null);
    setLocationFilter(null);
  };

  const reviews = subTab === "business" ? businessReviews : teamMemberReviews;
  const total =
    subTab === "business" ? businessReviewsTotal : teamMemberReviewsTotal;
  const loading =
    subTab === "business" ? businessReviewsLoading : teamMemberReviewsLoading;
  const hasMore = reviews.length < total;

  const selectedTeamMember = stats?.teamMembers.find(
    (tm) => tm.teamMemberId === teamMemberFilter,
  );

  return (
    <div className="max-w-5xl mb-0 md:mb-8 space-y-5">
      {/* Stats Panel */}
      <ReviewStatsPanel
        stats={stats}
        loading={statsLoading}
        selectedLocationId={locationFilter}
        selectedTeamMemberId={teamMemberFilter}
        onLocationClick={(id) =>
          setLocationFilter((prev) => (prev === id ? null : id))
        }
        onTeamMemberClick={(id) => {
          setTeamMemberFilter((prev) => (prev === id ? null : id));
          // Clicking a team member from the panel implies the team-members sub-tab
          if (subTab !== "team-members") setSubTab("team-members");
        }}
      />

      {/* Active filter chips */}
      {(selectedLocation || selectedTeamMember || ratingFilter !== null) && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedLocation && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-primary/30 bg-primary/10 text-primary">
              <MapPin className="h-3 w-3" />
              {selectedLocation.name}
              <button
                type="button"
                onClick={() => setLocationFilter(null)}
                className="hover:bg-primary/20 rounded-full p-0.5"
                aria-label={t("filters.clearLocation")}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedTeamMember && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-primary/30 bg-primary/10 text-primary">
              {selectedTeamMember.firstName} {selectedTeamMember.lastName}
              <button
                type="button"
                onClick={() => setTeamMemberFilter(null)}
                className="hover:bg-primary/20 rounded-full p-0.5"
                aria-label={t("filters.clearTeamMember")}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {ratingFilter !== null && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-amber-300 bg-amber-50 text-amber-700">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {ratingFilter}
              <button
                type="button"
                onClick={() => setRatingFilter(null)}
                className="hover:bg-amber-100 rounded-full p-0.5"
                aria-label={t("filters.clearRating")}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs font-medium text-foreground-3 hover:text-foreground-2 underline underline-offset-2"
          >
            {t("filters.clearAll")}
          </button>
        </div>
      )}

      {/* Sub-tabs: Business Reviews / Team Member Reviews */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleSubTabChange("business")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            subTab === "business"
              ? "bg-primary text-primary-foreground"
              : "bg-surface-hover text-foreground-2 hover:text-foreground"
          }`}
        >
          {t("subTabs.business")}
        </button>
        <button
          onClick={() => handleSubTabChange("team-members")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            subTab === "team-members"
              ? "bg-primary text-primary-foreground"
              : "bg-surface-hover text-foreground-2 hover:text-foreground"
          }`}
        >
          {t("subTabs.teamMembers")}
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Star filter */}
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

        {/* Team member filter (only on team members tab) */}
        {subTab === "team-members" &&
          stats?.teamMembers &&
          stats.teamMembers.length > 0 && (
            <div className="relative ml-auto">
              <button
                onClick={() => setTeamMemberDropdownOpen((o) => !o)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-surface text-foreground-2 hover:bg-surface-hover transition-colors"
              >
                {selectedTeamMember ? (
                  <>
                    <Avatar className="h-4 w-4">
                      {selectedTeamMember.profileImage && (
                        <AvatarImage
                          src={selectedTeamMember.profileImage}
                          alt={selectedTeamMember.firstName}
                        />
                      )}
                      <AvatarFallback className="text-[8px] font-medium">
                        {selectedTeamMember.firstName[0]}
                      </AvatarFallback>
                    </Avatar>
                    {selectedTeamMember.firstName}{" "}
                    {selectedTeamMember.lastName}
                  </>
                ) : (
                  t("filters.allTeamMembers")
                )}
                <ChevronDown className="h-3 w-3" />
              </button>

              {teamMemberDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setTeamMemberDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border border-border bg-surface shadow-lg overflow-hidden">
                    <button
                      onClick={() => {
                        setTeamMemberFilter(null);
                        setTeamMemberDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        teamMemberFilter === null
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground-2 hover:bg-surface-hover"
                      }`}
                    >
                      {t("filters.allTeamMembers")}
                    </button>
                    {stats.teamMembers.map((tm) => (
                      <button
                        key={tm.teamMemberId}
                        onClick={() => {
                          setTeamMemberFilter(tm.teamMemberId);
                          setTeamMemberDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                          teamMemberFilter === tm.teamMemberId
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground-2 hover:bg-surface-hover"
                        }`}
                      >
                        <Avatar className="h-5 w-5">
                          {tm.profileImage && (
                            <AvatarImage
                              src={tm.profileImage}
                              alt={tm.firstName}
                            />
                          )}
                          <AvatarFallback className="text-[9px] font-medium">
                            {tm.firstName[0]}
                            {tm.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 truncate">
                          {tm.firstName} {tm.lastName}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-foreground-2">
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                          {tm.averageRating.toFixed(1)}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

        {/* Sort toggle */}
        <button
          onClick={() =>
            setSortOrder((o) => (o === "DESC" ? "ASC" : "DESC"))
          }
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border border-border bg-surface text-foreground-2 hover:bg-surface-hover transition-colors ${subTab === "team-members" && stats?.teamMembers && stats.teamMembers.length > 0 ? "" : "ml-auto"}`}
        >
          <ArrowUpDown className="h-3 w-3" />
          {sortOrder === "DESC" ? t("filters.newest") : t("filters.oldest")}
        </button>
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {loading && reviews.length === 0 ? (
          <ReviewListSkeleton />
        ) : reviews.length === 0 ? (
          <EmptyReviews />
        ) : (
          <>
            {subTab === "business"
              ? businessReviews.map((review) => (
                  <BusinessReviewCard key={review.id} review={review} />
                ))
              : teamMemberReviews.map((review) => (
                  <TeamMemberReviewCard key={review.id} review={review} />
                ))}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="rounded-full px-6"
                >
                  {loading ? (
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
          {t("empty.description")}
        </p>
      </div>
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
