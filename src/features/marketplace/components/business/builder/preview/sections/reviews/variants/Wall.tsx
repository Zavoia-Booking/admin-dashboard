import type { CSSProperties } from "react";
import { ShieldCheck } from "lucide-react";
import { Stars } from "../../../shared/primitives";
import { formatReviewDate } from "../../../shared/util";
import type { ReviewsVariantProps } from "../types";

/** Wall — a pinboard of quote cards (CSS-columns masonry). Every curated quote is a verified booking, so the
 *  verified badge is unconditional. Cards rise on mount with a small stagger. Mirrors the source `RvWall`. */
export function Wall({ quotes, t }: ReviewsVariantProps) {
  return (
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
  );
}
