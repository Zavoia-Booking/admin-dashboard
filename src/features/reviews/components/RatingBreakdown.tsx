import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../shared/lib/utils";
import type { RatingDistribution } from "../types";

interface RatingBreakdownProps {
  distribution: RatingDistribution;
  total: number;
  selectedRating?: number | null;
  onRatingClick?: (rating: number) => void;
}

const ROWS = [5, 4, 3, 2, 1] as const;

export function RatingBreakdown({
  distribution,
  total,
  selectedRating,
  onRatingClick,
}: RatingBreakdownProps) {
  const { t } = useTranslation("reviews");
  const interactive = Boolean(onRatingClick);

  // Stagger the initial bar reveal — 60ms cascade from 5★ down to 1★. On
  // subsequent data changes (filter apply, refetch) mounted is already true
  // and the delay collapses to 0, so the bars retarget instantly without
  // restaging the entrance.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700 dark:text-primary-500">
        {t("stats.distributionEyebrow")}
      </div>

      <ul className="flex flex-col gap-0.5 -mx-1.5">
        {ROWS.map((star, index) => {
          const count =
            distribution[star.toString() as keyof RatingDistribution] ?? 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          const pctLabel = Math.round(pct);
          const isSelected = interactive && selectedRating === star;
          const canClick = interactive && count > 0;

          // Mobile bumps py to ~36px tap height; sm+ collapses back to the
          // compact desktop padding so the sidebar panel doesn't feel chunky.
          const rowBase =
            "relative grid grid-cols-[auto_1fr_auto] items-center gap-3 px-1.5 py-2.5 sm:py-1.5 rounded-lg";

          const rowStateClass = interactive
            ? canClick
              ? cn(
                  "cursor-pointer transition-[background-color,transform] duration-150 ease-out",
                  "active:scale-[0.99]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  isSelected
                    ? "bg-primary/[0.07] hover:bg-primary/[0.095]"
                    : "hover:bg-primary/[0.045]",
                )
              : "cursor-not-allowed opacity-55"
            : "";

          const body = (
            <>
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-full bg-primary"
                />
              )}

              <div
                className={cn(
                  "flex items-center gap-1 text-[11px] tabular-nums",
                  count === 0 ? "text-foreground-3/60" : "text-foreground-2",
                )}
              >
                <span className="w-2 text-right">{star}</span>
                <Star
                  className={cn(
                    "h-2.5 w-2.5 text-amber-400 fill-amber-400",
                    count === 0 && "opacity-45",
                  )}
                  aria-hidden="true"
                />
              </div>

              <div
                className="relative h-1.5 rounded-full bg-foreground-3/12 overflow-hidden shadow-[inset_0_1px_2px_rgba(20,15,12,0.04)]"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full bg-primary/85"
                  style={{
                    width: mounted ? `${pct}%` : "0%",
                    transition: "width 600ms cubic-bezier(0.32, 0.72, 0, 1)",
                    transitionDelay: mounted ? "0ms" : `${index * 60}ms`,
                  }}
                />
              </div>

              <div
                className={cn(
                  "flex items-baseline gap-1.5 text-[11px] tabular-nums min-w-[3.5rem] justify-end",
                  count === 0 ? "text-foreground-3/55" : "text-foreground-3",
                )}
              >
                <span
                  className={
                    count === 0
                      ? "text-foreground-3/55"
                      : "text-foreground-2 font-medium"
                  }
                >
                  {count}
                </span>
                <span
                  className="inline-block h-1 w-1 rounded-full bg-foreground-3/40"
                  aria-hidden="true"
                />
                <span>{pctLabel}%</span>
              </div>
            </>
          );

          if (!interactive) {
            return (
              <li
                key={star}
                className={rowBase}
                title={t("distribution.tooltip", { count, stars: star })}
              >
                {body}
              </li>
            );
          }

          return (
            <li key={star}>
              <button
                type="button"
                disabled={!canClick}
                onClick={() => canClick && onRatingClick?.(star)}
                aria-pressed={isSelected}
                aria-label={t("distribution.tooltip", { count, stars: star })}
                className={cn(rowBase, rowStateClass, "w-full text-left")}
              >
                {body}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
