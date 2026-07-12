import type { PreviewReview, T } from "../../shared/types";

/** Contract every Reviews layout variant renders against. The orchestrator owns data prep, the empty state,
 *  the section head and the (constant) rating summary — so a variant renders only its "voices" (the quotes),
 *  already sliced to the variant's own limit. */
export type ReviewsVariantProps = {
  quotes: PreviewReview[];
  italic: boolean;
  t: T;
};
