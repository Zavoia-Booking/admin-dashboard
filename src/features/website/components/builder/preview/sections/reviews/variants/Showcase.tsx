import { RvHead } from "../parts/RvHead";
import { RvSummary } from "../parts/RvSummary";
import { RvShowcase } from "../parts/RvShowcase";
import type { ReviewsViewProps } from "../types";
import "./showcase.css";

/** Showcase (catalog key `default`) — the canonical big score + per-star histogram over an interactive,
 *  auto-playing quote index: a selectable reviewer list beside a large staged quote with a per-word masked
 *  rise. Mirrors the source `RvShowcase` intro + body. */
export function Showcase({ quotes, rating, count, dist, distTotal, showDist, showHeading, heading, kicker, no, italic, t }: ReviewsViewProps) {
  return (
    <>
      <RvHead no={no} kicker={kicker} heading={heading} showHeading={showHeading} />
      {count > 0 && <RvSummary t={t} rating={rating} count={count} dist={dist} distTotal={distTotal} showDist={showDist} />}
      {quotes.length > 0 && <RvShowcase items={quotes} italic={italic} t={t} />}
    </>
  );
}
