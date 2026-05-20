import { useState, type ReactNode } from "react";
import { ChevronDown, Star, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "../../../shared/components/ui/badge";
import { Skeleton } from "../../../shared/components/ui/skeleton";
import { cn } from "../../../shared/lib/utils";

type HeroTone = "good" | "info" | "warn" | "neutral";

interface ReviewsHeroProps {
  rating: number | null;
  totalReviews: number;
  locationCount: number;
  teamMemberCount: number;
  loading?: boolean;
  /**
   * Optional expandable body (mobile/tablet only — wrapped in `lg:hidden`).
   * When provided, the hero renders a "Show distribution + about" toggle
   * below its meta line; tapping reveals this content via a grid-rows
   * height animation. On desktop the sidebar carries the same content,
   * so this slot is hidden via CSS rather than conditionally rendered.
   */
  expandableContent?: ReactNode;
}

function deriveTone(rating: number | null, totalReviews: number): HeroTone {
  if (rating === null || totalReviews === 0) return "neutral";
  if (rating < 3.5) return "warn";
  if (rating < 4.5) return "info";
  return "good";
}

type StatusStyle = {
  /** Tailwind palette family used for bg + border + dot, matching the
   *  Assignments active-badge recipe verbatim. */
  pill: string;
  dotBg: string;
  key:
    | "hero.statusGood"
    | "hero.statusOk"
    | "hero.statusWarn"
    | "hero.statusNone";
};

/**
 * Canonical pill recipe lifted from the Assignments "active" badge
 * (LocationServicesSection.tsx): pastel `*-50` bg + `*-200` border + dark
 * neutral text + bright 8px `*-500` dot. The dot carries the colour; the
 * text stays readable.
 */
const STATUS: Record<HeroTone, StatusStyle> = {
  good: {
    pill:
      "bg-green-50 border-green-200 hover:bg-green-100 " +
      "text-neutral-900 dark:text-neutral-900",
    dotBg: "bg-green-500",
    key: "hero.statusGood",
  },
  info: {
    pill:
      "bg-sky-50 border-sky-200 hover:bg-sky-100 " +
      "text-neutral-900 dark:text-neutral-900",
    dotBg: "bg-sky-500",
    key: "hero.statusOk",
  },
  warn: {
    pill:
      "bg-amber-50 border-amber-200 hover:bg-amber-100 " +
      "text-neutral-900 dark:text-neutral-900",
    dotBg: "bg-amber-500",
    key: "hero.statusWarn",
  },
  neutral: {
    pill:
      "bg-neutral-100 border-neutral-200 hover:bg-neutral-200 " +
      "text-neutral-900 dark:text-neutral-900",
    dotBg: "bg-neutral-400",
    key: "hero.statusNone",
  },
};

function StarRow({ rating }: { rating: number | null }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "h-5 w-5 sm:h-[22px] sm:w-[22px]",
            rating !== null && s <= Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-amber-400/25 fill-amber-400/25",
          )}
        />
      ))}
    </div>
  );
}

export function ReviewsHero({
  rating,
  totalReviews,
  locationCount,
  teamMemberCount,
  loading,
  expandableContent,
}: ReviewsHeroProps) {
  const { t } = useTranslation("reviews");
  const [expanded, setExpanded] = useState(false);

  if (loading && rating === null && totalReviews === 0) {
    return <ReviewsHeroSkeleton />;
  }

  const tone = deriveTone(rating, totalReviews);
  const status = STATUS[tone];
  const hasReviews = totalReviews > 0;

  // Filter out zero-count stats so we never render "0 team members" — and so
  // the dot separators always sit between actual values, never trailing.
  const stats = [
    totalReviews > 0 && {
      value: totalReviews,
      label: t("hero.metaReviews", { count: totalReviews }),
    },
    locationCount > 0 && {
      value: locationCount,
      label: t("hero.metaLocations", { count: locationCount }),
    },
    teamMemberCount > 0 && {
      value: teamMemberCount,
      label: t("hero.metaTeam", { count: teamMemberCount }),
    },
  ].filter((s): s is { value: number; label: string } => Boolean(s));

  const hasMetaRow = stats.length > 0 || hasReviews;

  // Meta + visibility badge — rendered once, reused both in the desktop
  // always-visible position and inside the mobile collapsible.
  const metaRow = hasMetaRow ? (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] tabular-nums">
      {stats.map((stat, i) => (
        <span
          key={stat.label}
          className={cn(
            "inline-flex items-baseline gap-1.5",
            i > 0 &&
              "before:content-[''] before:inline-block before:h-1 before:w-1 before:rounded-full before:bg-foreground-3/35 before:mr-3 before:self-center",
          )}
        >
          <span className="font-semibold text-foreground-1">{stat.value}</span>
          <span className="text-foreground-3">{stat.label}</span>
        </span>
      ))}

      {hasReviews && (
        <div className="w-full flex justify-center sm:w-auto sm:ml-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 border border-border-subtle text-[11.5px] font-medium text-foreground-2">
            <Eye className="h-3 w-3 text-primary" />
            {t("stats.overallBadge")}
          </span>
        </div>
      )}
    </div>
  ) : null;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-surface",
        // Mobile/tablet: tighter bottom padding so the chevron sits close to
        // the card edge (no dead space below). Desktop keeps the original
        // breathing room because the meta + visibility badge live at the
        // bottom instead of a chevron.
        "px-4 pt-4 pb-1.5 lg:pb-4",
      )}
    >
      {/* Decorative amber wash — same recipe as the profile-page reviews
          banner (MyReviewsTab.tsx). Amber matches the star colour; same look
          regardless of rating tier (the pill carries the tier signal). */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-transparent to-amber-400/5 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-3">
        {/* Row 1: eyebrow (left) + status pill (right). Same baseline so the
            corner reads as a single header strip. */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Eyebrow — `modalEyebrow` recipe (modal-tokens.ts) so the
              terracotta accent matches every modal in the app. */}
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700 dark:text-primary-500">
            {t("stats.overallTitle")}
          </div>

          <Badge
            variant="secondary"
            className={cn(
              "text-xs px-3 py-1 rounded-full font-medium",
              "flex items-center gap-1.5",
              status.pill,
            )}
          >
            <span
              className={cn("h-2 w-2 rounded-full", status.dotBg)}
              aria-hidden="true"
            />
            {t(status.key)}
          </Badge>
        </div>

        {/* Row 2: rating + stars — only when there's an actual rating to
            show. Without reviews, the placeholder ("—" + muted stars) reads
            as broken/loading, so we collapse the hero to status + meta and
            let the empty-state surface below speak for the zero case. */}
        {hasReviews && rating !== null && (
          <div className="flex items-baseline gap-3">
            <span className="text-[44px] sm:text-[46px] leading-none font-semibold tabular-nums tracking-[-0.03em] text-foreground-1">
              {rating.toFixed(1)}
            </span>
            <StarRow rating={rating} />
          </div>
        )}

        {/* Row 3 (desktop only): meta line + visibility badge.
            On mobile/tablet, this content lives inside the collapsible below
            so the collapsed hero stays tight to rating + status. */}
        {metaRow && <div className="hidden lg:block">{metaRow}</div>}

        {/* Mobile + tablet collapsible expansion. Default: collapsed with a
            short peek (~32px of meta line visible) and a chevron-only
            affordance. The peek + bottom fade hints "more below" without
            consuming the row a labeled button would. Tapping the chevron
            row animates `max-height` to reveal meta + visibility + the full
            distribution + about footer. Hidden entirely on desktop where the
            sidebar carries the same content. */}
        {expandableContent && (
          <div className="lg:hidden">
            {/* Collapsible body with peek. Max-height transitions between a
                tight 28px peek (top of the meta line visible, ~10px of empty
                space below) and a comfortable expanded ceiling. Bottom fade
                overlay lives inside this clipping region so it overlays the
                bottom of the visible peek, not the chevron tap target below. */}
            <div
              id="reviews-hero-expansion"
              className={cn(
                "relative overflow-hidden transition-[max-height] duration-350 ease-[cubic-bezier(0.32,0.72,0,1)]",
                expanded ? "max-h-[800px]" : "max-h-[28px]",
              )}
            >
              <div className="pt-2 flex flex-col gap-3">
                {metaRow}
                <div className="h-px bg-border/60" aria-hidden="true" />
                {expandableContent}
              </div>

              {/* Bottom fade — fades the peek into the surface color so the
                  cut-off looks intentional ("more below"), not broken. Fades
                  out as the body expands so expanded content stays sharp. */}
              <div
                className={cn(
                  "pointer-events-none absolute left-0 right-0 bottom-0 h-4",
                  "bg-gradient-to-b from-transparent to-[var(--surface)]",
                  "transition-opacity duration-300 ease-out",
                  expanded ? "opacity-0" : "opacity-100",
                )}
                aria-hidden="true"
              />
            </div>

            {/* Arrow-only tap target — replaces the previous labeled "Show
                distribution + about" button. ChevronDown rotates 180° when
                expanded; the entire row is the tap target for a generous
                touch area without adding visual weight. */}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-controls="reviews-hero-expansion"
              aria-label={
                expanded
                  ? t("stats.insightsExpanded")
                  : t("stats.insightsCollapsed")
              }
              className={cn(
                "w-full mt-1 py-1.5 flex items-center justify-center rounded-md",
                "transition-[colors,transform] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]",
                "active:scale-[0.98] active:bg-foreground-3/[0.05]",
                "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              )}
            >
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-foreground-3 shrink-0",
                  "transition-transform duration-200 ease-out",
                  expanded ? "rotate-180" : "rotate-0",
                )}
                aria-hidden="true"
              />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Mirrors the real [ReviewsHero] frame exactly so the load-in doesn't pop
 * or shift on commit: same padding (`px-4 pt-4 pb-1.5 lg:pb-4`), same
 * `bg-surface` (not `surface-hover/60` — that read as a distinct grey
 * box and broke the rhythm), and the same three-row shape.
 * Mobile (<lg) adds a chevron placeholder where the collapsible toggle
 * lives; desktop (lg+) renders the always-visible meta row instead.
 */
function ReviewsHeroSkeleton() {
  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-surface px-4 pt-4 pb-1.5 lg:pb-4">
      <div className="relative flex flex-col gap-3">
        {/* Row 1: eyebrow (left) + status pill (right) */}
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Row 2: rating big number + stars */}
        <div className="flex items-baseline gap-3">
          <Skeleton className="h-11 w-16" />
          <Skeleton className="h-5 w-32" />
        </div>

        {/* Row 3 (desktop only): meta line + visibility badge */}
        <div className="hidden lg:flex items-center gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-5 w-28 rounded-full" />
        </div>

        {/* Mobile only: chevron-toggle placeholder (collapsed insights row) */}
        <div className="lg:hidden flex items-center justify-center mt-1 py-1.5">
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      </div>
    </section>
  );
}
