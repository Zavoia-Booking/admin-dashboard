import { RvShowcase } from "../parts/RvShowcase";
import type { ReviewsVariantProps } from "../types";

/** Default (showcase) — an auto-playing quote showcase: a selectable reviewer list beside a large staged
 *  quote with a per-word rise. The orchestrator renders the section head + rating summary above it. */
export function Default({ quotes, italic, t }: ReviewsVariantProps) {
  return <RvShowcase items={quotes} italic={italic} t={t} />;
}
