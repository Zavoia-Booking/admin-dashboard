import type { PreviewReview, RatingBars, T } from "../../shared/types";

/** Everything a self-contained Reviews layout renders against. The orchestrator (Reviews.tsx) owns data prep,
 *  the empty state and the section wrapper; each variant under variants/ renders its own head + its own
 *  rating-summary form + its "voices", so no two variants open the same way (mirrors the source `SecReviews`,
 *  where the intro changes shape with the layout). Quotes are already sliced to the variant's own limit. */
export type ReviewsViewProps = {
  /** Curated 5★ quotes, pre-sliced to this variant's quote budget. */
  quotes: PreviewReview[];
  /** Aggregate rating (weighted mean across rated locations). */
  rating: number;
  /** Total verified reviews across the business. */
  count: number;
  /** Per-star counts (5→1) for the showcase histogram; absent when unavailable/toggled off. */
  dist?: RatingBars;
  /** Sum of `dist` (0 when absent). */
  distTotal: number;
  /** Whether the showcase should render the histogram (real distribution present + not hidden). */
  showDist: boolean;
  /** Whether the locale's section heading should be rendered. */
  showHeading: boolean;
  /** Section heading (owner override or default). */
  heading: string;
  /** Numbered eyebrow label ("Reviews") + the section ordinal. */
  kicker: string;
  no: string;
  /** The active display face supports italic (drives the quote style). */
  italic: boolean;
  /** Business name — the deck card's corner brand mark uses its initial. */
  businessName: string;
  t: T;
};
