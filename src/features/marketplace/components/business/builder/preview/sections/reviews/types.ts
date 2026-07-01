import type { PreviewData, PreviewReview, T } from "../../shared/types";

/** Contract every Reviews layout variant renders against — the orchestrator owns data prep + the empty state. */
export type ReviewsVariantProps = {
  no: string;
  t: T;
  heading: string;
  sublede: string;
  rating: number;
  count: number;
  quotes: PreviewReview[];
  italic: boolean;
  dist: PreviewData["ratingDistribution"];
  distTotal: number;
  showDist: boolean;
};
