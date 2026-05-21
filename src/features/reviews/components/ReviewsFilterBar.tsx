import {
  Star,
  MapPin,
  User,
  ArrowUpDown,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../shared/components/ui/dropdown-menu";
import { PersonAvatar } from "../../../shared/components/common/PersonAvatar";
import { cn } from "../../../shared/lib/utils";
import type { LocationStats, ReviewSubTab, TeamMemberStats } from "../types";

interface ReviewsFilterBarProps {
  subTab: ReviewSubTab;
  ratingFilter: number | null;
  locationFilter: number | null;
  teamMemberFilter: number | null;
  sortOrder: "DESC" | "ASC";
  locations: LocationStats[];
  teamMembers: TeamMemberStats[];
  onRatingChange: (v: number | null) => void;
  onLocationChange: (v: number | null) => void;
  onTeamMemberChange: (v: number | null) => void;
  onSortChange: (v: "DESC" | "ASC") => void;
  onClearAll: () => void;
  className?: string;
}

/* Segment — icon-only below sm, icon + label + chevron at sm+ */
const SEGMENT_BASE = cn(
  "group inline-flex items-center justify-center gap-1.5 h-full px-2.5 sm:px-3",
  "text-xs font-medium text-foreground-2",
  "hover:text-foreground-1 hover:bg-surface-hover",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 focus-visible:ring-inset",
  "first:rounded-l-full last:rounded-r-full",
  "data-[active=true]:bg-info-100/70 data-[active=true]:text-foreground-1",
);
const SEGMENT_TRANSITION = {
  transition:
    "background-color 200ms var(--ease-out-strong, cubic-bezier(0.23, 1, 0.32, 1)), color 200ms var(--ease-out-strong, cubic-bezier(0.23, 1, 0.32, 1))",
};
const SEGMENT_ICON = "h-3.5 w-3.5 text-foreground-3 group-hover:text-primary group-data-[active=true]:text-primary";

export function ReviewsFilterBar({
  subTab,
  ratingFilter,
  locationFilter,
  teamMemberFilter,
  sortOrder,
  locations,
  teamMembers,
  onRatingChange,
  onLocationChange,
  onTeamMemberChange,
  onSortChange,
  onClearAll,
  className,
}: ReviewsFilterBarProps) {
  const { t } = useTranslation("reviews");

  const selectedLocation = locations.find(
    (l) => l.locationId === locationFilter,
  );
  const selectedMember = teamMembers.find(
    (m) => m.teamMemberId === teamMemberFilter,
  );

  const hasFilters =
    ratingFilter !== null ||
    locationFilter !== null ||
    teamMemberFilter !== null;

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div
          className={cn(
            "inline-flex items-stretch h-9 rounded-full border border-border bg-surface shadow-xs overflow-hidden",
            "divide-x divide-border",
          )}
        >
          {/* Stars */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-active={ratingFilter !== null}
                className={SEGMENT_BASE}
                style={SEGMENT_TRANSITION}
                aria-label={t("filter.starsLabel")}
              >
                <Star className={SEGMENT_ICON} />
                <span className="hidden sm:inline">
                  {ratingFilter === null
                    ? t("filter.starsAny")
                    : t("filter.starsValue", { count: ratingFilter })}
                </span>
                {ratingFilter !== null && (
                  <span className="sm:hidden tabular-nums">{ratingFilter}</span>
                )}
                <ChevronDown className="h-3 w-3 text-foreground-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[10rem]">
              <DropdownMenuItem onSelect={() => onRatingChange(null)}>
                <span className="flex-1">{t("filter.starsAny")}</span>
                {ratingFilter === null && <Check className="h-3.5 w-3.5" />}
              </DropdownMenuItem>
              {[5, 4, 3, 2, 1].map((s) => (
                <DropdownMenuItem key={s} onSelect={() => onRatingChange(s)}>
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  <span className="flex-1">
                    {t("filter.starsValue", { count: s })}
                  </span>
                  {ratingFilter === s && <Check className="h-3.5 w-3.5" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Location */}
          {locations.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  data-active={locationFilter !== null}
                  className={SEGMENT_BASE}
                  style={SEGMENT_TRANSITION}
                  aria-label={t("filter.locationLabel")}
                >
                  <MapPin className={SEGMENT_ICON} />
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {selectedLocation
                      ? selectedLocation.name
                      : t("filter.locationAny")}
                  </span>
                  <ChevronDown className="h-3 w-3 text-foreground-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[14rem]">
                <DropdownMenuItem onSelect={() => onLocationChange(null)}>
                  <span className="flex-1">{t("filter.locationAny")}</span>
                  {locationFilter === null && (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </DropdownMenuItem>
                {locations.map((l) => (
                  <DropdownMenuItem
                    key={l.locationId}
                    onSelect={() => onLocationChange(l.locationId)}
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary/70" />
                    <span className="flex-1 truncate">{l.name}</span>
                    <span className="text-[11px] text-foreground-3 tabular-nums">
                      {l.totalReviews}
                    </span>
                    {locationFilter === l.locationId && (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Team member (team-tab only) */}
          {subTab === "team-members" && teamMembers.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  data-active={teamMemberFilter !== null}
                  className={SEGMENT_BASE}
                  style={SEGMENT_TRANSITION}
                  aria-label={t("filter.teamLabel")}
                >
                  <User className={SEGMENT_ICON} />
                  <span className="hidden sm:inline max-w-[140px] truncate">
                    {selectedMember
                      ? `${selectedMember.firstName} ${selectedMember.lastName}`
                      : t("filter.teamAny")}
                  </span>
                  <ChevronDown className="h-3 w-3 text-foreground-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[16rem]">
                <DropdownMenuItem onSelect={() => onTeamMemberChange(null)}>
                  <span className="flex-1">{t("filter.teamAny")}</span>
                  {teamMemberFilter === null && (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </DropdownMenuItem>
                {teamMembers.map((m) => (
                  <DropdownMenuItem
                    key={m.teamMemberId}
                    onSelect={() => onTeamMemberChange(m.teamMemberId)}
                  >
                    <PersonAvatar
                      id={m.teamMemberId}
                      firstName={m.firstName}
                      lastName={m.lastName}
                      profileImage={m.profileImage}
                      className="h-5 w-5"
                      initialsClassName="text-[9px] font-medium"
                    />
                    <span className="flex-1 truncate">
                      {m.firstName} {m.lastName}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-foreground-2 tabular-nums">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      {m.averageRating.toFixed(1)}
                    </span>
                    {teamMemberFilter === m.teamMemberId && (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Sort */}
          <button
            type="button"
            onClick={() => onSortChange(sortOrder === "DESC" ? "ASC" : "DESC")}
            className={SEGMENT_BASE}
            style={SEGMENT_TRANSITION}
            aria-label={t("filter.sortLabel")}
          >
            <ArrowUpDown className={SEGMENT_ICON} />
            <span className="hidden sm:inline">
              {sortOrder === "DESC"
                ? t("filter.sortNewest")
                : t("filter.sortOldest")}
            </span>
          </button>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1 h-9 px-3 rounded-full text-xs font-medium text-foreground-3 hover:text-error transition-colors"
          >
            <X className="h-3 w-3" />
            <span className="hidden sm:inline">{t("filters.clearAll")}</span>
          </button>
        )}
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedLocation && (
            <Chip
              icon={<MapPin className="h-3 w-3" />}
              label={selectedLocation.name}
              onClear={() => onLocationChange(null)}
              ariaLabel={t("filters.clearLocation")}
            />
          )}
          {selectedMember && (
            <Chip
              icon={
                <PersonAvatar
                  id={selectedMember.teamMemberId}
                  firstName={selectedMember.firstName}
                  lastName={selectedMember.lastName}
                  profileImage={selectedMember.profileImage}
                  className="h-3.5 w-3.5"
                  initialsClassName="text-[7px]"
                />
              }
              label={`${selectedMember.firstName} ${selectedMember.lastName}`}
              onClear={() => onTeamMemberChange(null)}
              ariaLabel={t("filters.clearTeamMember")}
            />
          )}
          {ratingFilter !== null && (
            <Chip
              tone="amber"
              icon={
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              }
              label={String(ratingFilter)}
              onClear={() => onRatingChange(null)}
              ariaLabel={t("filters.clearRating")}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Chip({
  icon,
  label,
  onClear,
  ariaLabel,
  tone = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  onClear: () => void;
  ariaLabel: string;
  tone?: "primary" | "amber";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full text-xs font-medium border",
        tone === "amber"
          ? "border-amber-300 bg-amber-50 text-amber-700"
          : "border-primary/30 bg-primary/10 text-primary",
      )}
    >
      {icon}
      <span className="max-w-[160px] truncate">{label}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={ariaLabel}
        className={cn(
          "rounded-full p-0.5",
          tone === "amber" ? "hover:bg-amber-100" : "hover:bg-primary/20",
          "transition-colors",
        )}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
