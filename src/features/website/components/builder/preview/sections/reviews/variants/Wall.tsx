import type { CSSProperties } from "react";
import { ShieldCheck } from "lucide-react";
import { Stars, CountUp } from "../../../shared/primitives";
import { formatReviewDate } from "../../../shared/util";
import type { RatingBars } from "../../../shared/types";
import { RvHead } from "../parts/RvHead";
import type { ReviewsViewProps } from "../types";
import "./wall.css";

/** Wall — the included base. A compact rating chip pinned to the header (the board itself is the proof), over
 *  a CSS-columns pinboard of verified quote cards that rise on mount with a small stagger and lift on hover.
 *  Mirrors the source `RvWall`. */
export function Wall({ quotes, rating, count, dist, distTotal, showHeading, heading, kicker, no, t }: ReviewsViewProps) {
  const fiveShare = dist && distTotal > 0 ? Math.round((dist["5" as keyof RatingBars] / distTotal) * 100) : 0;
  return (
    <>
      <RvHead no={no} kicker={kicker} heading={heading} showHeading={showHeading}>
        {count > 0 && (
          <div className="mc-rv-hrate">
            <span className="mc-rv-hrate-n">
              <CountUp value={rating} decimals={1} />
            </span>
            <span className="mc-rv-hrate-tx">
              <Stars value={rating} size={15} />
              <span className="mc-rv-hrate-cnt">
                <b>{count.toLocaleString()}</b> {t("businessPage.builder.preview.reviewsVerifiedReviews")}
                {fiveShare > 0 && <> · {t("businessPage.builder.preview.reviewsFiveStarShare", { pct: fiveShare })}</>}
              </span>
            </span>
          </div>
        )}
      </RvHead>
      <div className="mc-rvw">
        {quotes.map((r, i) => (
          <figure key={r.id} className="mc-rvw-card mc-mask-in" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` } as CSSProperties}>
            <Stars value={r.rating} size={13} />
            <blockquote className="mc-rvw-q">“{r.comment}”</blockquote>
            <figcaption className="mc-rvw-meta">
              <span className="mc-rvw-ini" aria-hidden>
                {(r.customerName || "?").trim().charAt(0)}
              </span>
              <span className="mc-rvw-txt">
                <span className="mc-rvw-nm">{r.customerName}</span>
                <span className="mc-rvw-sub">{[r.locationName, formatReviewDate(r.createdAt)].filter(Boolean).join(" · ")}</span>
              </span>
              <span className="mc-rvw-vf">
                <ShieldCheck className="h-[11px] w-[11px]" strokeWidth={2} /> {t("businessPage.builder.preview.reviewsVerified")}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
