import { cn } from "../../../../../../../../../shared/lib/utils";
import { SectionHead, Stars, CountUp } from "../../../shared/primitives";
import type { RatingBars } from "../../../shared/types";
import { RvDistRow } from "../parts/RvDistRow";
import { RvShowcase } from "../parts/RvShowcase";
import type { ReviewsVariantProps } from "../types";

/** Default — rating score + real per-star distribution bars, then an auto-playing quote showcase. */
export function Default({ no, t, heading, sublede, rating, count, quotes, italic, dist, distTotal, showDist }: ReviewsVariantProps) {
  return (
    <>
      <SectionHead no={no} kicker={t("businessPage.builder.preview.kicker.reviews")} heading={heading} sublede={sublede} stacked />
      {count > 0 && (
        <div className={cn("mc-rv-sum", !showDist && "mc-rv-sum--solo")}>
          <div className="mc-rv-score">
            <span className="mc-rv-score-n">
              <CountUp value={rating} decimals={1} />
            </span>
            <span className="mc-rv-score-meta">
              <Stars value={rating} size={17} />
              <span className="mc-rv-score-cnt">{t("businessPage.builder.preview.reviewsVerifiedCount", { count })}</span>
              <span className="mc-rv-score-out">{t("businessPage.builder.preview.reviewsOutOf")}</span>
            </span>
          </div>
          {showDist && dist && (
            <>
              <span className="mc-rv-sum-div" aria-hidden />
              <div className="mc-rv-dist">
                {([5, 4, 3, 2, 1] as const).map((s) => (
                  <RvDistRow key={s} stars={s} pct={dist[String(s) as keyof RatingBars] / distTotal} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {quotes.length > 0 && <RvShowcase items={quotes} italic={italic} t={t} />}
    </>
  );
}
