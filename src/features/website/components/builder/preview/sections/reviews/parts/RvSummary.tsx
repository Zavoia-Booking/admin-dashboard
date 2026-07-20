import { cn } from "../../../../../../../../shared/lib/utils";
import { Stars, CountUp } from "../../../shared/primitives";
import type { PreviewData, RatingBars, T } from "../../../shared/types";
import { RvDistRow } from "./RvDistRow";

/** Rating score + real per-star distribution bars — constant across every reviews layout, so the orchestrator
 *  renders it once above the chosen variant's voices (mirrors the source's persistent `lb-rv-sum`). */
export function RvSummary({
  t,
  rating,
  count,
  dist,
  distTotal,
  showDist,
}: {
  t: T;
  rating: number;
  count: number;
  dist: PreviewData["ratingDistribution"];
  distTotal: number;
  showDist: boolean;
}) {
  return (
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
  );
}
