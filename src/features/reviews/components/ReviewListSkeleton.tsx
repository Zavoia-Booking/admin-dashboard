import { Skeleton } from "../../../shared/components/ui/skeleton";

/**
 * Mirrors [ReviewCard]'s shape exactly so the load-in doesn't visually
 * shift on commit. Avatar height + gap match `ITEM_BASE` / `AVATAR_BASE`,
 * and the header collapses to one row on `sm+` / stacks into two rows on
 * mobile (stars + time on row 1, name on row 2) just like the real card.
 * Spacing rhythm follows the real card too (`mt-3` between header/comment
 * and comment/footer).
 *
 * Shared by the owner reviews page ([ReviewsTab]) and the team-member
 * reviews page ([MyReviewsTab]) so both render an identical loading list.
 */
export function ReviewListSkeleton() {
  return (
    <ul className="divide-y divide-border/60 animate-pulse">
      {[1, 2, 3].map((i) => (
        <li key={i} className="flex gap-3.5 py-4 sm:py-5">
          <Skeleton className="h-10 w-10 rounded-full shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            {/* Header — matches the responsive 2-row mobile / 1-row desktop
                shape from [BusinessReviewCard] + [TeamMemberReviewCard]. */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-1 sm:gap-3">
              <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
                <Skeleton className="h-4 w-[88px] rounded-sm" />
                {/* Desktop only: customer name inline next to stars */}
                <Skeleton className="hidden sm:block h-3.5 w-28" />
                {/* Mobile only: date sits to the right of the stars */}
                <Skeleton className="sm:hidden h-3 w-16" />
              </div>

              {/* Mobile only: customer name on row 2 */}
              <Skeleton className="sm:hidden h-3.5 w-28" />

              {/* Desktop only: date on the far right of the header row */}
              <Skeleton className="hidden sm:block h-3 w-16" />
            </div>

            {/* Comment — two lines, matches `COMMENT_BASE`'s mt-3 spacing */}
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Footer — single chip placeholder, mirrors `FOOTER_BASE`'s
                mt-3 spacing. Real card may show a stacked footer on mobile
                (team member + location) but a single line is a safe
                approximation for the skeleton phase. */}
            <Skeleton className="mt-3 h-3 w-32" />
          </div>
        </li>
      ))}
    </ul>
  );
}
