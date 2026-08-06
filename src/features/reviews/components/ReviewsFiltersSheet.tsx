import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal, RotateCcw, Star } from "lucide-react";
import { format, parseISO } from "date-fns";
import { enUS, ro } from "date-fns/locale";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "../../../shared/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../../../shared/components/ui/dialog";
import { Switch } from "../../../shared/components/ui/switch";
import { Button } from "../../../shared/components/ui/button";
import { useIsMobile } from "../../../shared/hooks/use-mobile";
import { cn } from "../../../shared/lib/utils";
import type { LocationStats, ReviewSubTab, TeamMemberStats } from "../types";
import { DateRangeField, type DatePreset } from "./DateRangeField";
import { PersonAvatar } from "../../../shared/components/common/PersonAvatar";

interface Props {
  className?: string;
  /**
   * When true, render a 36×36 icon-only trigger (SlidersHorizontal only) for
   * tight horizontal layouts like the mobile insights band. The label is still
   * announced via aria-label so screen readers keep parity; the count badge
   * still floats over the top-right corner.
   */
  compact?: boolean;
  subTab: ReviewSubTab;
  ratingFilter: number | null;
  locationFilter: number | null;
  teamMemberFilter: number | null;
  datePreset: DatePreset;
  startDate: string | null;
  endDate: string | null;
  withCommentsOnly: boolean;
  locations: LocationStats[];
  teamMembers: TeamMemberStats[];
  onRatingChange: (v: number | null) => void;
  onLocationChange: (v: number | null) => void;
  onTeamMemberChange: (v: number | null) => void;
  onDateRangeChange: (
    preset: DatePreset,
    startDate: string | null,
    endDate: string | null,
  ) => void;
  onWithCommentsChange: (v: boolean) => void;
  onClearAll: () => void;
}

/**
 * Trigger pill — same base recipe as Calendar's `filterPillClass`, plus a
 * pressed-state scale (emil-design-eng: buttons must feel pressable).
 */
const triggerPillClass = (isOpen: boolean) =>
  cn(
    "relative inline-flex items-center justify-center h-9 px-3 gap-1.5 rounded-full border outline-none",
    "transition-[transform,colors,box-shadow,background-color,color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer",
    "active:scale-[0.97]",
    "focus-visible:ring-2 focus-visible:ring-focus/40 focus-visible:ring-offset-0",
    isOpen
      ? "bg-info-100 border-border-strong text-foreground-1"
      : "bg-surface-hover border-border text-foreground-1 shadow-xs hover:bg-surface-active hover:border-border-strong",
  );

/**
 * Chip recipe — matches the calendar filter pill (`h-10`, `px-4`) so chips
 * across the app feel like the same control. `relative` so the floating
 * corner checkmark on selected state can position over the top-right edge.
 * iOS-curve press scale for physical feedback.
 */
const chipClass = (selected: boolean) =>
  cn(
    "relative inline-flex items-center gap-1.5 h-10 px-4 rounded-full border text-xs font-medium",
    "transition-[transform,colors,box-shadow] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer",
    "active:scale-[0.97]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 focus-visible:ring-offset-2",
    selected
      ? "border-neutral-500 bg-info-100 text-neutral-900 shadow-xs hover:border-neutral-500 hover:bg-info-100"
      : "border-border bg-surface text-foreground-1 hover:border-neutral-500 hover:bg-info-100 hover:text-neutral-900",
  );

/**
 * Floating green corner stamp shown on a selected chip. Matches the
 * Calendar filter pill convention — keeps chip width stable across selected
 * state and reads as a deliberate "this one's picked" affordance.
 */
function ChipCheckmark() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -right-0 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-green-400 shadow-sm dark:bg-success"
    >
      <svg
        className="h-3 w-3 text-foreground-inverse"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

export function ReviewsFiltersSheet({
  className,
  compact = false,
  subTab,
  ratingFilter,
  locationFilter,
  teamMemberFilter,
  datePreset,
  startDate,
  endDate,
  withCommentsOnly,
  locations,
  teamMembers,
  onRatingChange,
  onLocationChange,
  onTeamMemberChange,
  onDateRangeChange,
  onWithCommentsChange,
  onClearAll,
}: Props) {
  const { t, i18n } = useTranslation("reviews");
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Draft state — pending filter values that only commit on Apply.
  // Matches Calendar/Services pattern: local edits, single commit point.
  const [draftRating, setDraftRating] = useState<number | null>(ratingFilter);
  const [draftLocation, setDraftLocation] = useState<number | null>(
    locationFilter,
  );
  const [draftTeam, setDraftTeam] = useState<number | null>(teamMemberFilter);
  const [draftDatePreset, setDraftDatePreset] = useState<DatePreset>(datePreset);
  const [draftStartDate, setDraftStartDate] = useState<string | null>(startDate);
  const [draftEndDate, setDraftEndDate] = useState<string | null>(endDate);
  const [draftWithComments, setDraftWithComments] =
    useState<boolean>(withCommentsOnly);

  // Re-sync drafts with committed values whenever the sheet (re)opens. Lets
  // users abandon mid-edit by closing without Apply — next open is fresh.
  useEffect(() => {
    if (open) {
      setDraftRating(ratingFilter);
      setDraftLocation(locationFilter);
      setDraftTeam(teamMemberFilter);
      setDraftDatePreset(datePreset);
      setDraftStartDate(startDate);
      setDraftEndDate(endDate);
      setDraftWithComments(withCommentsOnly);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // A date filter only counts as "active" if it actually narrows the query.
  // Picking "Custom" but no dates yet should not bump the badge — backend
  // sees no startDate/endDate in that case.
  const dateCommitted =
    datePreset !== "any" && (startDate !== null || endDate !== null);
  const dateDraft =
    draftDatePreset !== "any" &&
    (draftStartDate !== null || draftEndDate !== null);

  // Badge on the trigger reflects committed filters (not drafts) so the
  // chip count doesn't flicker as the user experiments inside the sheet.
  // Team filter contributes regardless of sub-tab — picking a team member
  // auto-switches the sub-tab via the reducer, so the filter is always
  // meaningful when set.
  const committedActiveCount =
    (ratingFilter !== null ? 1 : 0) +
    (locationFilter !== null ? 1 : 0) +
    (teamMemberFilter !== null ? 1 : 0) +
    (dateCommitted ? 1 : 0) +
    (withCommentsOnly ? 1 : 0);

  const draftActiveCount =
    (draftRating !== null ? 1 : 0) +
    (draftLocation !== null ? 1 : 0) +
    (draftTeam !== null ? 1 : 0) +
    (dateDraft ? 1 : 0) +
    (draftWithComments ? 1 : 0);

  const hasChanges =
    draftRating !== ratingFilter ||
    draftLocation !== locationFilter ||
    draftTeam !== teamMemberFilter ||
    draftDatePreset !== datePreset ||
    draftStartDate !== startDate ||
    draftEndDate !== endDate ||
    draftWithComments !== withCommentsOnly;

  const handleApply = () => {
    if (draftRating !== ratingFilter) onRatingChange(draftRating);
    if (draftLocation !== locationFilter) onLocationChange(draftLocation);
    if (draftTeam !== teamMemberFilter) onTeamMemberChange(draftTeam);
    if (
      draftDatePreset !== datePreset ||
      draftStartDate !== startDate ||
      draftEndDate !== endDate
    ) {
      onDateRangeChange(draftDatePreset, draftStartDate, draftEndDate);
    }
    if (draftWithComments !== withCommentsOnly) {
      onWithCommentsChange(draftWithComments);
    }
    setOpen(false);
  };

  const handleClearAll = () => {
    setDraftRating(null);
    setDraftLocation(null);
    setDraftTeam(null);
    setDraftDatePreset("any");
    setDraftStartDate(null);
    setDraftEndDate(null);
    setDraftWithComments(false);
    // Also commit upstream so the committed state matches the visible drafts.
    onClearAll();
  };

  // Locale-aware date formatter for the Period summary chip.
  const dateLocale = i18n.language === "ro" ? ro : enUS;
  const formatShortDate = (iso: string) =>
    format(parseISO(iso), "d MMM", { locale: dateLocale });

  /** Compact label shown on the Period section header (right-aligned). */
  const datePeriodSummary = (() => {
    if (draftDatePreset === "any") return null;
    if (draftDatePreset === "7d") return t("filter.dateLast7Days");
    if (draftDatePreset === "30d") return t("filter.dateLast30Days");
    if (draftDatePreset === "90d") return t("filter.dateLast90Days");
    // custom
    if (draftStartDate && draftEndDate) {
      return `${formatShortDate(draftStartDate)} – ${formatShortDate(draftEndDate)}`;
    }
    if (draftStartDate) return `${t("filter.dateCustom")} · ${formatShortDate(draftStartDate)}`;
    return t("filter.dateCustom");
  })();

  const ratingSummary =
    draftRating !== null ? (
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: draftRating }).map((_, i) => (
          <Star
            key={i}
            className="h-3 w-3 fill-amber-400 text-amber-400"
          />
        ))}
      </span>
    ) : null;

  const locationSummary =
    draftLocation !== null
      ? locations.find((l) => l.locationId === draftLocation)?.name ?? null
      : null;

  const teamSummary =
    draftTeam !== null
      ? (() => {
          const m = teamMembers.find((tm) => tm.teamMemberId === draftTeam);
          return m ? `${m.firstName} ${m.lastName}` : null;
        })()
      : null;
  void subTab; // kept in Props for future use; team gating no longer reads it

  const trigger = compact ? (
    <button
      type="button"
      className={cn(
        triggerPillClass(open),
        "!w-9 !px-0 !gap-0 justify-center shrink-0",
        className,
      )}
      aria-label={t("filter.button")}
    >
      <SlidersHorizontal className="h-4 w-4 text-foreground-3" />
      {committedActiveCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow">
          {committedActiveCount}
        </span>
      )}
    </button>
  ) : (
    <button
      type="button"
      className={cn(triggerPillClass(open), className)}
      aria-label={t("filter.button")}
    >
      <SlidersHorizontal className="h-3.5 w-3.5 text-foreground-3" />
      <span className="text-xs font-medium">{t("filter.button")}</span>
      {committedActiveCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow">
          {committedActiveCount}
        </span>
      )}
    </button>
  );

  const body = (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className="px-3">
        <Section
          title={t("filter.dateLabel")}
          summary={datePeriodSummary}
          isFirst
        >
          <DateRangeField
            preset={draftDatePreset}
            startDate={draftStartDate}
            endDate={draftEndDate}
            onChange={(preset, start, end) => {
              setDraftDatePreset(preset);
              setDraftStartDate(start);
              setDraftEndDate(end);
            }}
          />
        </Section>

        <Section
          title={t("filter.starsLabel")}
          summary={ratingSummary}
        >
          <StarRatingPicker
            value={draftRating}
            onChange={setDraftRating}
          />
        </Section>

        <Section title={t("filter.withCommentsLabel")}>
          <label className="flex items-center justify-between gap-3 cursor-pointer group">
            <span className="text-xs text-foreground-2 group-hover:text-foreground-1 transition-colors leading-relaxed">
              {t("filter.withCommentsHelper")}
            </span>
            <Switch
              checked={draftWithComments}
              onCheckedChange={setDraftWithComments}
              aria-label={t("filter.withCommentsLabel")}
            />
          </label>
        </Section>

        {locations.length > 0 && (
          <Section
            title={t("filter.locationLabel")}
            summary={locationSummary}
          >
            <div className="flex flex-wrap gap-2">
              <Chip
                selected={draftLocation === null}
                onClick={() => setDraftLocation(null)}
              >
                {t("filter.locationAny")}
              </Chip>
              {locations.map((loc) => (
                <Chip
                  key={loc.locationId}
                  selected={draftLocation === loc.locationId}
                  onClick={() => setDraftLocation(loc.locationId)}
                >
                  {loc.name}
                </Chip>
              ))}
            </div>
          </Section>
        )}

        {teamMembers.length > 0 && (
          <Section
            title={t("filter.teamLabel")}
            summary={teamSummary}
          >
            <div className="flex flex-wrap gap-2">
              <Chip
                selected={draftTeam === null}
                onClick={() => setDraftTeam(null)}
              >
                {t("filter.teamAny")}
              </Chip>
              {teamMembers.map((m) => (
                <TeamMemberChip
                  key={m.teamMemberId}
                  member={m}
                  selected={draftTeam === m.teamMemberId}
                  onClick={() => setDraftTeam(m.teamMemberId)}
                />
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );

  // Footer recipe lifted verbatim from [CalendarHeaderFilters]'s mobile
  // drawer footer so Reviews + Calendar filter sheets feel identical:
  // sticky bottom strip, `!h-9` buttons, Clear is replaced with an empty
  // `<div />` placeholder (preserving `justify-between`) when no filters
  // are active so Apply slides to the right without a disabled-Clear stub.
  const footer = (
    <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3">
      {draftActiveCount > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          rounded="full"
          className="group !h-9 !min-h-0 gap-1.5 px-3 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          onClick={handleClearAll}
        >
          <RotateCcw
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
            aria-hidden
          />
          {t("filters.clearAll")}
        </Button>
      ) : (
        <div />
      )}
      <Button
        type="button"
        size="sm"
        rounded="full"
        disabled={!hasChanges}
        className="!h-9 !min-h-0 shrink-0 px-16 text-xs font-semibold transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        onClick={handleApply}
      >
        {t("filter.apply")}
      </Button>
    </footer>
  );

  /**
   * Header content shared by mobile drawer + desktop dialog. Anchored with a
   * 36×36 rounded square containing the sliders icon (Billing-style icon
   * crest), then the title. The Dialog primitive renders its own × close at
   * top-right; per-section state is already surfaced in section summaries.
   * Hairline bottom border separates header from the scrollable section list.
   */
  const renderHeader = (
    TitleComponent:
      | typeof DrawerTitle
      | typeof DialogTitle,
    DescriptionComponent:
      | typeof DrawerDescription
      | typeof DialogDescription,
  ) => (
    <div className="flex items-center gap-3 px-3 pt-5 pb-4 pr-12 shrink-0 border-b border-border-subtle">
      <div className="flex items-center justify-center h-9 w-9 rounded-xl border border-border bg-surface-hover shrink-0">
        <SlidersHorizontal className="h-4 w-4 text-foreground-1" />
      </div>
      <TitleComponent className="text-[15px] font-semibold text-foreground-1 leading-tight flex-1 min-w-0">
        {t("filter.button")}
      </TitleComponent>
      {/* Screen-reader-only description — Radix Dialog/Drawer require it
          for a11y. Visible header doesn't need a subtitle, so we hide it. */}
      <DescriptionComponent className="sr-only">
        {t("filter.dialogDescription")}
      </DescriptionComponent>
    </div>
  );

  // Mobile: bottom Vaul drawer (iOS-style sheet). Desktop: centered Radix
  // Dialog (modal) — same pattern as [ManageServicesSheet]. The popover
  // didn't have enough vertical room once the date range calendar moved in.
  if (isMobile) {
    return (
      // `autoFocus` moves focus into the drawer when it opens — without
      // it, focus stays on the trigger button. Radix then marks the app
      // root with `aria-hidden`, putting the still-focused trigger inside
      // a hidden tree, which the browser blocks for a11y. Same fix as
      // [SortSelect]'s Drawer.
      // Layout mirrors [CalendarHeaderFilters]'s mobile drawer — fixed
      // outer height (`h-[70vh]`), inner `min-h-0 flex-1 flex flex-col
      // overflow-hidden` wrapper, scrollable body, and sticky footer with
      // `z-10` so Apply/Clear stay anchored to the visible bottom edge.
      <Drawer autoFocus open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent
          className="outline-none !z-[100] !bg-surface"
          overlayClassName="!z-[95]"
        >
          <DrawerTitle className="sr-only">{t("filter.button")}</DrawerTitle>
          <DrawerDescription className="sr-only">
            {t("filter.dialogDescription")}
          </DrawerDescription>
          <div className="h-[70vh] flex flex-col p-0">
            <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
              {body}
              {footer}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        // Override the default DialogContent padding/gap; we manage internal
        // layout (header + scrollable body + sticky footer) ourselves. Sized
        // a bit wider than the old popover so the calendar breathes.
        className="!p-0 !gap-0 sm:!max-w-md !w-[min(460px,calc(100vw-2rem))] !max-h-[min(680px,calc(100vh-4rem))] flex flex-col overflow-hidden bg-surface"
      >
        {renderHeader(DialogTitle, DialogDescription)}
        {body}
        {footer}
      </DialogContent>
    </Dialog>
  );
}

/**
 * One filter section. Title is rendered as an eyebrow — terracotta
 * `text-primary-700` uppercase with wide tracking, matching the recipe used
 * in [ReviewsHero] so the hero band and the filter sheet read as the same
 * design language. Optional `summary` (right-aligned, tertiary) surfaces
 * the current selection so users can see active state without scanning the
 * chips. Sections are separated by hairline `border-t` dividers, skipped on
 * the first.
 */
function Section({
  title,
  summary,
  isFirst,
  children,
}: {
  title: string;
  summary?: React.ReactNode;
  isFirst?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "py-4",
        !isFirst && "border-t border-border-subtle",
      )}
    >
      <header className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700 dark:text-primary-500">
          {title}
        </span>
        {summary != null && summary !== "" && (
          <span className="text-[11px] font-medium text-foreground-2 truncate max-w-[55%]">
            {summary}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

function Chip({
  selected,
  onClick,
  ariaLabel,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={chipClass(selected)}
    >
      {children}
      {selected && <ChipCheckmark />}
    </button>
  );
}

/**
 * Team-member chip — same recipe as the Calendar staff filter
 * ([CalendarStaffFilter]): leading avatar + name + green corner stamp when
 * selected. Tighter left padding (`pl-1.5`) anchors the avatar against the
 * pill's curve; normal right padding gives the name comfortable spacing.
 */
function TeamMemberChip({
  member,
  selected,
  onClick,
}: {
  member: TeamMemberStats;
  selected: boolean;
  onClick: () => void;
}) {
  const fullName = `${member.firstName} ${member.lastName}`.trim();
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-2 h-10 pl-1.5 pr-4 rounded-full border text-xs font-medium",
        "transition-[transform,colors,box-shadow] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer",
        "active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 focus-visible:ring-offset-2",
        selected
          ? "border-neutral-500 bg-info-100 text-neutral-900 shadow-xs hover:border-neutral-500 hover:bg-info-100"
          : "border-border bg-surface text-foreground-1 hover:border-neutral-500 hover:bg-info-100 hover:text-neutral-900",
      )}
    >
      <PersonAvatar
        id={member.teamMemberId}
        firstName={member.firstName}
        lastName={member.lastName}
        profileImage={member.profileImage}
        className="size-7"
        initialsClassName="text-[10px] font-semibold"
      />
      <span className="truncate">{fullName}</span>
      {selected && <ChipCheckmark />}
    </button>
  );
}

/**
 * Compact interactive star bar — five star buttons with hover preview.
 *
 * Design pulls:
 * - emil-design-eng: per-star `transition-delay` produces a 30ms cascade so
 *   the fill feels alive instead of snapping; iOS curve everywhere; the
 *   hovered star itself gets a subtle scale(1.1) preview; press feedback at
 *   `active:scale-[0.85]` so taps feel physical.
 * - impeccable: hierarchy via state — when a rating is committed, the whole
 *   bar carries a soft amber wash so "filter active" reads at a glance,
 *   without piling on chrome. Avoids the card-grid monotony of 6 chips.
 * - ui-ux-pro-max: 40×40 touch targets clear Apple HIG (44pt with the gap
 *   between adjacent targets included), aria-label per star, hover preview
 *   mirrored to keyboard focus for parity.
 *
 * Pattern: Trustpilot / Yelp / Google. Hover star N to preview cumulative
 * fill 1..n; click to commit; click again to clear.
 */
function StarRatingPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const { t } = useTranslation("reviews");
  const [hover, setHover] = useState<number | null>(null);
  // Visual fill follows hover preview when hovering, falls back to committed
  // value otherwise (no fill if neither is set — that's the "Any" state).
  const fillTo = hover ?? value ?? 0;
  const isActive = value !== null;

  return (
    <div
      className="flex items-center gap-4 flex-wrap"
      onMouseLeave={() => setHover(null)}
    >
      {/* "Any rating" as a real chip — same recipe as the chips in other
          sections (Location, Team, Period) so the option reads as a
          first-class filter choice. Selected (= no rating committed) shows
          the same floating green corner stamp as elsewhere in the sheet. */}
      <Chip
        selected={!isActive}
        onClick={() => onChange(null)}
      >
        {t("filter.starsAny")}
      </Chip>

      {/* Hairline divider — same recipe as the Calendar SubTabToggle so the
          two halves of the rating control read as one group. */}
      <span className="w-px h-6 bg-border shrink-0" aria-hidden />

      <div className="inline-flex items-center -mx-1">
        {[1, 2, 3, 4, 5].map((n, i) => {
          const filled = n <= fillTo;
          const isHovered = hover === n;
          const isSelected = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => {
                onChange(value === n ? null : n);
                // Mobile/touch: tap fires synthetic mouseenter but never a
                // mouseleave, so without clearing here the hover state
                // lingers at `n` after a deselect and the fill snaps back
                // visually filled to `n`. Desktop is unaffected because the
                // row's onMouseLeave clears hover when the cursor moves out.
                setHover(null);
              }}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(null)}
              aria-label={t("filter.starsValue", { count: n })}
              aria-pressed={isSelected}
              className={cn(
                "p-2.5 inline-flex items-center justify-center cursor-pointer",
                "transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
                "active:scale-[0.85]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 focus-visible:ring-offset-2 focus-visible:rounded-md",
              )}
            >
              <Star
                // `transitionDelay` indexed by position gives the cumulative
                // fill a 30ms cascade — works in both directions for free
                // (fill + unfill). The hovered star itself scales 1.15 so
                // the user sees exactly which one they're picking.
                style={{ transitionDelay: `${i * 30}ms` }}
                className={cn(
                  "h-6 w-6",
                  "transition-[color,transform,fill] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  filled
                    ? "fill-amber-400 text-amber-400"
                    : "fill-transparent text-border-strong",
                  isHovered && "scale-[1.15]",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
