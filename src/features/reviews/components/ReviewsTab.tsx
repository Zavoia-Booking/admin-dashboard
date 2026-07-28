import { useEffect, useReducer, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Button } from "../../../shared/components/ui/button";
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
  selectBusinessReviewsMoreLoading,
  selectTeamMemberReviews,
  selectTeamMemberReviewsTotal,
  selectTeamMemberReviewsLoading,
  selectTeamMemberReviewsMoreLoading,
  selectReviewStatsError,
  selectReviewsListError,
} from "../selectors";
import { BusinessReviewCard, TeamMemberReviewCard } from "./ReviewCard";
import { ReviewsHero } from "./ReviewsHero";
import { ReviewsFiltersSheet } from "./ReviewsFiltersSheet";
import { ReviewsInsightsPanel } from "./ReviewsInsightsPanel";
import { RatingBreakdown } from "./RatingBreakdown";
import { MobileClearFiltersFab } from "./MobileClearFiltersFab";
import { EmptyReviewsState } from "./EmptyReviewsState";
import { FirstReviewState } from "./FirstReviewState";
import { ReviewListSkeleton } from "./ReviewListSkeleton";
import { ErrorState } from "../../../shared/components/common/ErrorState";
import {
  SortSelect,
  type SortGroup,
} from "../../../shared/components/common/SortSelect";
import {
  CalendarArrowDown,
  CalendarArrowUp,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Eye,
  Layers,
} from "lucide-react";
import type {
  ReviewSubTab,
  ReviewSortBy,
  ReviewSortOrder,
} from "../types";
import type { DatePreset } from "./DateRangeField";
import { cn } from "../../../shared/lib/utils";
import "./Reviews.css";

const PAGE_SIZE = 20;

type FilterState = {
  subTab: ReviewSubTab;
  ratingFilter: number | null;
  teamMemberFilter: number | null;
  locationFilter: number | null;
  datePreset: DatePreset;
  startDate: string | null;
  endDate: string | null;
  withCommentsOnly: boolean;
  sortBy: ReviewSortBy;
  sortOrder: ReviewSortOrder;
};

type FilterAction =
  | { type: "setSubTab"; value: ReviewSubTab }
  | { type: "setRating"; value: number | null }
  | { type: "setLocation"; value: number | null }
  | { type: "setTeamMember"; value: number | null }
  | {
      type: "setDateRange";
      preset: DatePreset;
      startDate: string | null;
      endDate: string | null;
    }
  | { type: "setWithCommentsOnly"; value: boolean }
  | { type: "setSort"; sortBy: ReviewSortBy; sortOrder: ReviewSortOrder }
  | { type: "clearAll" };

const INITIAL_FILTERS: FilterState = {
  subTab: "business",
  ratingFilter: null,
  teamMemberFilter: null,
  locationFilter: null,
  datePreset: "any",
  startDate: null,
  endDate: null,
  withCommentsOnly: false,
  sortBy: "createdAt",
  sortOrder: "DESC",
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "setSubTab":
      // Preserve sort + date + with-comments preferences across sub-tab
      // switches. These aren't tied to which stream you're viewing (Business
      // vs Team) — only star/location/team-member filters are sub-tab-scoped.
      return {
        ...INITIAL_FILTERS,
        subTab: action.value,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        datePreset: state.datePreset,
        startDate: state.startDate,
        endDate: state.endDate,
        withCommentsOnly: state.withCommentsOnly,
      };
    case "setRating":
      return { ...state, ratingFilter: action.value };
    case "setLocation":
      return { ...state, locationFilter: action.value };
    case "setTeamMember":
      return {
        ...state,
        teamMemberFilter: action.value,
        subTab: action.value !== null ? "team-members" : state.subTab,
      };
    case "setDateRange":
      return {
        ...state,
        datePreset: action.preset,
        startDate: action.startDate,
        endDate: action.endDate,
      };
    case "setWithCommentsOnly":
      return { ...state, withCommentsOnly: action.value };
    case "setSort":
      return { ...state, sortBy: action.sortBy, sortOrder: action.sortOrder };
    case "clearAll":
      return {
        ...state,
        ratingFilter: null,
        locationFilter: null,
        teamMemberFilter: null,
        datePreset: "any",
        startDate: null,
        endDate: null,
        withCommentsOnly: false,
      };
    default:
      return state;
  }
}

/**
 * Encode `(sortBy, sortOrder)` as a single string for SortSelect's value
 * prop. Keeps the SortSelect API unchanged (it only takes string values),
 * while letting us decode back into the two reducer fields on change.
 */
const encodeSort = (sortBy: ReviewSortBy, sortOrder: ReviewSortOrder) =>
  `${sortBy}-${sortOrder}`;

const decodeSort = (
  value: string,
): { sortBy: ReviewSortBy; sortOrder: ReviewSortOrder } => {
  const [sortBy, sortOrder] = value.split("-");
  return {
    sortBy: (sortBy === "rating" ? "rating" : "createdAt") as ReviewSortBy,
    sortOrder: (sortOrder === "ASC" ? "ASC" : "DESC") as ReviewSortOrder,
  };
};

export function ReviewsTab({ locationId }: { locationId?: number | null } = {}) {
  const dispatch = useDispatch();
  const { t } = useTranslation("reviews");

  const stats = useSelector(selectReviewStats);
  const statsLoading = useSelector(selectReviewStatsLoading);
  const statsError = useSelector(selectReviewStatsError);
  const listError = useSelector(selectReviewsListError);
  const businessReviews = useSelector(selectBusinessReviews);
  const businessReviewsTotal = useSelector(selectBusinessReviewsTotal);
  const businessReviewsLoading = useSelector(selectBusinessReviewsLoading);
  const businessReviewsMoreLoading = useSelector(
    selectBusinessReviewsMoreLoading,
  );
  const teamMemberReviews = useSelector(selectTeamMemberReviews);
  const teamMemberReviewsTotal = useSelector(selectTeamMemberReviewsTotal);
  const teamMemberReviewsLoading = useSelector(
    selectTeamMemberReviewsLoading,
  );
  const teamMemberReviewsMoreLoading = useSelector(
    selectTeamMemberReviewsMoreLoading,
  );

  const [filters, dispatchFilter] = useReducer(
    filterReducer,
    INITIAL_FILTERS,
    (init) => ({ ...init, locationFilter: locationId ?? null }),
  );
  // Re-scope to the location when navigated in from a location panel (or cleared).
  useEffect(() => {
    dispatchFilter({ type: "setLocation", value: locationId ?? null });
  }, [locationId]);
  const {
    subTab,
    ratingFilter,
    teamMemberFilter,
    locationFilter,
    datePreset,
    startDate,
    endDate,
    withCommentsOnly,
    sortBy,
    sortOrder,
  } = filters;

  useEffect(() => {
    dispatch(fetchReviewStatsAction.request());
  }, [dispatch]);

  useEffect(() => {
    if (subTab === "business") {
      dispatch(
        fetchBusinessReviewsAction.request({
          offset: 0,
          limit: PAGE_SIZE,
          rating: ratingFilter ?? undefined,
          locationId: locationFilter ?? undefined,
          startDate: startDate ?? undefined,
          endDate: endDate ?? undefined,
          withCommentsOnly: withCommentsOnly || undefined,
          sortBy,
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
          startDate: startDate ?? undefined,
          endDate: endDate ?? undefined,
          withCommentsOnly: withCommentsOnly || undefined,
          sortBy,
          sortOrder,
        }),
      );
    }
  }, [
    dispatch,
    subTab,
    ratingFilter,
    teamMemberFilter,
    locationFilter,
    startDate,
    endDate,
    withCommentsOnly,
    sortBy,
    sortOrder,
  ]);

  const handleRetry = useCallback(() => {
    dispatch(fetchReviewStatsAction.request());
    if (subTab === "business") {
      dispatch(
        fetchBusinessReviewsAction.request({
          offset: 0,
          limit: PAGE_SIZE,
          rating: ratingFilter ?? undefined,
          locationId: locationFilter ?? undefined,
          startDate: startDate ?? undefined,
          endDate: endDate ?? undefined,
          withCommentsOnly: withCommentsOnly || undefined,
          sortBy,
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
          startDate: startDate ?? undefined,
          endDate: endDate ?? undefined,
          withCommentsOnly: withCommentsOnly || undefined,
          sortBy,
          sortOrder,
        }),
      );
    }
  }, [
    dispatch,
    subTab,
    ratingFilter,
    teamMemberFilter,
    locationFilter,
    startDate,
    endDate,
    withCommentsOnly,
    sortBy,
    sortOrder,
  ]);

  const handleLoadMore = useCallback(() => {
    if (subTab === "business") {
      dispatch(
        fetchMoreBusinessReviewsAction.request({
          offset: businessReviews.length,
          limit: PAGE_SIZE,
          rating: ratingFilter ?? undefined,
          locationId: locationFilter ?? undefined,
          startDate: startDate ?? undefined,
          endDate: endDate ?? undefined,
          withCommentsOnly: withCommentsOnly || undefined,
          sortBy,
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
          startDate: startDate ?? undefined,
          endDate: endDate ?? undefined,
          withCommentsOnly: withCommentsOnly || undefined,
          sortBy,
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
    startDate,
    endDate,
    withCommentsOnly,
    sortBy,
    sortOrder,
  ]);

  const reviews = subTab === "business" ? businessReviews : teamMemberReviews;
  const total =
    subTab === "business" ? businessReviewsTotal : teamMemberReviewsTotal;
  const loading =
    subTab === "business" ? businessReviewsLoading : teamMemberReviewsLoading;
  const moreLoading =
    subTab === "business"
      ? businessReviewsMoreLoading
      : teamMemberReviewsMoreLoading;
  const hasMore = reviews.length < total;
  const activeFilterCount =
    (ratingFilter !== null ? 1 : 0) +
    (locationFilter !== null ? 1 : 0) +
    (teamMemberFilter !== null ? 1 : 0) +
    (datePreset !== "any" ? 1 : 0) +
    (withCommentsOnly ? 1 : 0);
  const hasFilters = activeFilterCount > 0;

  // When the feed is locked to a location (opened from a location panel), the card
  // location chips must not re-scope the filter — pass undefined so FooterLocation
  // renders them as static, non-interactive text.
  const handleLocationClick =
    locationId != null
      ? undefined
      : (id: number) =>
          dispatchFilter({ type: "setLocation", value: locationFilter === id ? null : id });

  const overall = stats?.overall ?? { averageRating: null, totalReviews: 0 };
  const locations = stats?.locations ?? [];
  const teamMembersData = stats?.teamMembers ?? [];

  // True zero-state: stats loaded, no reviews exist anywhere, no error.
  // Skip the toolbar + grid layout entirely — there's nothing to filter,
  // sort, or scope. Show only the hero and the [FirstReviewState] panel.
  const isTrulyEmpty =
    !statsLoading &&
    stats !== null &&
    overall.totalReviews === 0 &&
    listError === null &&
    statsError === null;

  if (isTrulyEmpty) {
    return (
      <div className="w-full max-w-7xl mb-0 md:mb-8 space-y-5">
        <ReviewsHero
          rating={overall.averageRating}
          totalReviews={overall.totalReviews}
          locationCount={locations.length}
          teamMemberCount={teamMembersData.length}
          loading={statsLoading}
        />
        <FirstReviewState />
      </div>
    );
  }

  // Shared-cause failure: stats AND the feed failed with nothing retained.
  // One consolidated error replaces the layout instead of two error cards
  // (list column + insights sidebar) around a dead toolbar.
  if (statsError && listError && !stats && reviews.length === 0) {
    return (
      <div className="w-full max-w-7xl mb-0 md:mb-8">
        <ErrorState
          variant="page"
          title={t("empty.errorTitle")}
          body={t("empty.errorBody")}
          onRetry={handleRetry}
          retryLabel={t("empty.errorAction")}
        />
      </div>
    );
  }

  // Hoisted so both the desktop toolbar trigger and the mobile band trigger
  // share one source of truth — only the `compact` flag differs between
  // the two renders.
  const sortGroups: SortGroup[] = [
    {
      label: t("filter.sortGroupDate"),
      options: [
        {
          value: encodeSort("createdAt", "DESC"),
          label: t("filter.sortNewest"),
          icon: CalendarArrowDown,
        },
        {
          value: encodeSort("createdAt", "ASC"),
          label: t("filter.sortOldest"),
          icon: CalendarArrowUp,
        },
      ],
    },
    {
      label: t("filter.sortGroupRating"),
      options: [
        {
          value: encodeSort("rating", "DESC"),
          label: t("filter.sortHighest"),
          icon: ArrowDownWideNarrow,
        },
        {
          value: encodeSort("rating", "ASC"),
          label: t("filter.sortLowest"),
          icon: ArrowUpNarrowWide,
        },
      ],
    },
  ];

  const filterSheetProps = {
    subTab,
    ratingFilter,
    locationFilter,
    lockedLocationId: locationId ?? null,
    teamMemberFilter,
    datePreset,
    startDate,
    endDate,
    withCommentsOnly,
    locations,
    teamMembers: teamMembersData,
    onRatingChange: (v: number | null) =>
      dispatchFilter({ type: "setRating", value: v }),
    onLocationChange: (v: number | null) =>
      dispatchFilter({ type: "setLocation", value: v }),
    onTeamMemberChange: (v: number | null) =>
      dispatchFilter({ type: "setTeamMember", value: v }),
    onDateRangeChange: (
      preset: DatePreset,
      start: string | null,
      end: string | null,
    ) =>
      dispatchFilter({
        type: "setDateRange",
        preset,
        startDate: start,
        endDate: end,
      }),
    onWithCommentsChange: (v: boolean) =>
      dispatchFilter({ type: "setWithCommentsOnly", value: v }),
    onClearAll: () => dispatchFilter({ type: "clearAll" }),
  };

  return (
    <div className="w-full max-w-7xl mb-0 md:mb-8 space-y-5">
      <ReviewsHero
        rating={overall.averageRating}
        totalReviews={overall.totalReviews}
        locationCount={locations.length}
        teamMemberCount={teamMembersData.length}
        loading={statsLoading}
        expandableContent={
          stats && overall.totalReviews > 0 ? (
            <div className="flex flex-col gap-4">
              <RatingBreakdown
                distribution={stats.business.ratingDistribution}
                total={stats.business.totalReviews}
                selectedRating={ratingFilter}
                onRatingClick={(star) =>
                  dispatchFilter({
                    type: "setRating",
                    value: ratingFilter === star ? null : star,
                  })
                }
              />

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
                  <p className="text-xs text-foreground-2 leading-relaxed">
                    {t("stats.calculationNote")}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Eye
                    className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-foreground-2 leading-relaxed">
                    {t("stats.audienceNote")}
                  </p>
                </div>
              </div>
            </div>
          ) : undefined
        }
      />

      <section className="rounded-xl border border-border bg-surface px-3 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
        {/* Reviews column */}
        <section className="space-y-4 min-w-0">
          {/* Single toolbar row across all viewports.
              Mobile + tablet (<lg): toggle grows via `flex-1` to dominate
              the row, with compact icon-only sort + filter sitting on the
              right. Distribution + about live inside the hero above (see
              `expandableContent`) so this row stays minimal.
              Desktop (lg+): toggle keeps intrinsic width on the left, sort +
              filter render as labeled pills pushed to the right via
              `ml-auto`. */}
          <div className="flex items-center gap-1">
            <SubTabToggle
              value={subTab}
              onChange={(v) => dispatchFilter({ type: "setSubTab", value: v })}
            />

            {/* Mobile + tablet: sort + filter as a single segmented pill —
                no gap, each half square on its inner edge so they form one
                continuous control surface with a 1px shared divider. Frees
                ~9px for the toggle and reads as a unified "controls" group. */}
            <div className="flex items-center lg:hidden shrink-0">
              <SortSelect
                compact
                value={encodeSort(sortBy, sortOrder)}
                onValueChange={(v) => {
                  const decoded = decodeSort(v);
                  dispatchFilter({ type: "setSort", ...decoded });
                }}
                placeholder={t("filter.sortLabel")}
                groups={sortGroups}
                className="!rounded-r-none !border-r-0 !min-h-0 !h-10"
              />
              <ReviewsFiltersSheet
                compact
                {...filterSheetProps}
                className="!rounded-l-none !min-h-0 !h-10"
              />
            </div>

            <div className="hidden lg:flex items-center gap-2 lg:ml-auto shrink-0">
              <SortSelect
                value={encodeSort(sortBy, sortOrder)}
                onValueChange={(v) => {
                  const decoded = decodeSort(v);
                  dispatchFilter({ type: "setSort", ...decoded });
                }}
                placeholder={t("filter.sortLabel")}
                groups={sortGroups}
              />
              <ReviewsFiltersSheet {...filterSheetProps} />
            </div>
          </div>

          {/* Reviews list — keyed on subTab so the wrapper remounts and
              triggers the auth-card-style fade+settle animation when the
              user switches between Business and Team. */}
          <div key={subTab} className="reviews-content-enter space-y-3">
            {listError ? (
              <ErrorState
                title={t("empty.errorTitle")}
                body={t("empty.errorBody")}
                onRetry={handleRetry}
                retryLabel={t("empty.errorAction")}
              />
            ) : loading ? (
              // Refetch (initial load, filter apply, sort change) — show
              // skeleton over any existing rows so the user gets clear
              // "something is loading" feedback. Load more uses a separate
              // *MoreLoading flag so it never trips this branch.
              <ReviewListSkeleton />
            ) : reviews.length === 0 ? (
              <EmptyReviewsState
                kind={hasFilters ? "filtered" : "none"}
                onClearFilters={() => dispatchFilter({ type: "clearAll" })}
              />
            ) : (
              <>
                <ul className="reviews-list-stagger divide-y divide-border/60">
                  {subTab === "business"
                    ? businessReviews.map((review) => (
                        <BusinessReviewCard
                          key={review.id}
                          review={review}
                          selectedLocationId={locationFilter}
                          onLocationClick={handleLocationClick}
                        />
                      ))
                    : teamMemberReviews.map((review) => (
                        <TeamMemberReviewCard
                          key={review.id}
                          review={review}
                          selectedLocationId={locationFilter}
                          selectedTeamMemberId={teamMemberFilter}
                          onLocationClick={handleLocationClick}
                          onTeamMemberClick={(id) =>
                            dispatchFilter({
                              type: "setTeamMember",
                              value:
                                teamMemberFilter === id ? null : id,
                            })
                          }
                        />
                      ))}
                </ul>

                {hasMore && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      rounded="full"
                      onClick={handleLoadMore}
                      disabled={moreLoading}
                      className="px-6"
                    >
                      {moreLoading ? (
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

        {/* Insights sidebar (lg+) — vertical hairline separates it from the
            reviews column inside the shared card. */}
        <aside className="hidden lg:block lg:sticky lg:top-18 min-w-0 lg:border-l lg:border-border lg:pl-8">
          {statsError && !stats ? (
            <ErrorState
              variant="section"
              body={t("stats.errorBody")}
              onRetry={() => dispatch(fetchReviewStatsAction.request())}
            />
          ) : (
            <ReviewsInsightsPanel
              stats={stats}
              loading={statsLoading}
              selectedRating={ratingFilter}
              onRatingClick={(star) =>
                dispatchFilter({
                  type: "setRating",
                  value: ratingFilter === star ? null : star,
                })
              }
              activeFilterCount={activeFilterCount}
              onClearAll={() => dispatchFilter({ type: "clearAll" })}
            />
          )}
        </aside>
        </div>
      </section>

      {/* Mobile-only floating Clear pill — kept outside the section card so
          it floats over the page chrome instead of being clipped by the card
          surface. Renders only when filters are active. */}
      <MobileClearFiltersFab
        activeFilterCount={activeFilterCount}
        onClearAll={() => dispatchFilter({ type: "clearAll" })}
      />
    </div>
  );
}

/**
 * Sub-tab toggle, lifted verbatim from the Sign in / Create account toggle
 * in [AuthCard.tsx]: `bg-base` pill container, surface-white sliding card,
 * iOS-style cubic-bezier(0.32, 0.72, 0, 1) curve over 500ms. Equal-width
 * buttons via `flex-1` + `min-w-[140px]` so the sliding pill aligns.
 */
function SubTabToggle({
  value,
  onChange,
}: {
  value: ReviewSubTab;
  onChange: (v: ReviewSubTab) => void;
}) {
  const { t } = useTranslation("reviews");
  return (
    <div
      role="tablist"
      aria-label={t("section.reviewsTitle")}
      className="bg-base rounded-full p-1 flex !min-h-0 !h-10 relative flex-1 min-w-0 lg:flex-none lg:w-auto"
    >
      <div
        aria-hidden="true"
        className="absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-card shadow-sm dark:bg-[var(--surface-active)] dark:shadow-none dark:ring-1 dark:ring-border-default transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{
          transform:
            value === "team-members" ? "translateX(100%)" : "translateX(0)",
        }}
      />
      <button
        role="tab"
        type="button"
        aria-selected={value === "business"}
        onClick={() => onChange("business")}
        className={cn(
          "flex-1 min-w-0 lg:min-w-[140px] rounded-full py-2.5 px-4 pt-0 text-sm font-medium text-center",
          "flex items-center justify-center relative z-10 whitespace-nowrap cursor-pointer",
          "transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          "text-foreground-2 hover:text-foreground-1",
          "aria-selected:text-foreground-1",
        )}
      >
        {t("subTabs.business")}
      </button>
      <button
        role="tab"
        type="button"
        aria-selected={value === "team-members"}
        onClick={() => onChange("team-members")}
        className={cn(
          "flex-1 min-w-0 lg:min-w-[140px] rounded-full py-2.5 px-4 pt-0 text-sm font-medium text-center",
          "flex items-center justify-center relative z-10 whitespace-nowrap cursor-pointer",
          "transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          value === "team-members"
            ? "text-foreground-1"
            : "text-foreground-2 hover:text-foreground-1",
        )}
      >
        {t("subTabs.teamMembers")}
      </button>
    </div>
  );
}
