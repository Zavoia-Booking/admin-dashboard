import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Stars } from "../../../shared/primitives";
import { formatReviewDate, prefersReducedMotion } from "../../../shared/util";
import { useInView } from "../../../shared/hooks";
import type { ReviewsVariantProps } from "../types";

/** Deck — a stack of cards; the top steps aside on tap / on a timer to reveal the next (mirrors the source
 *  `RvDeck`). Only the top 3 are painted; the top card reserves the deck height so it never collapses to 0.
 *  Reuses the wall card's initial/name/sub/verified meta. */
export function Deck({ quotes, t }: ReviewsVariantProps) {
  const n = quotes.length;
  const reduced = prefersReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { threshold: 0.3 });

  useEffect(() => {
    if (reduced || n <= 1 || paused || !inView) return;
    const id = setInterval(() => setActive((a) => (a + 1) % n), 5400);
    return () => clearInterval(id);
  }, [paused, inView, n, reduced]);

  useEffect(() => {
    if (active >= n) setActive(0);
  }, [n, active]);

  const num = (i: number) => String(i + 1).padStart(2, "0");

  return (
    <div className="mc-rvk" ref={rootRef} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mc-rvk-deck">
        {quotes.map((r, i) => {
          const d = (i - active + n) % n;
          const vis = d < 3;
          return (
            <figure
              key={r.id}
              className={`mc-rvk-card${d === 0 ? " is-top" : ""}`}
              aria-hidden={d !== 0}
              style={{
                zIndex: n - d,
                opacity: vis ? 1 : 0,
                pointerEvents: d === 0 ? "auto" : "none",
                transform: d === 0 ? "none" : `translateY(${d * 18}px) scale(${(1 - d * 0.05).toFixed(3)})`,
              } as CSSProperties}
              onClick={() => setActive((active + 1) % n)}
            >
              <Stars value={r.rating} size={14} />
              <blockquote className="mc-rvk-q">“{r.comment}”</blockquote>
              <figcaption className="mc-rvk-meta">
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
          );
        })}
      </div>
      <div className="mc-rvk-ctrl">
        <span className="mc-rvk-hint">
          {num(active)} / {num(n - 1)} — {t("businessPage.builder.preview.reviewsDeckHint")}
        </span>
        <div className="mc-rvk-arrows">
          <button
            type="button"
            className="mc-rv-arr"
            aria-label={t("businessPage.builder.preview.reviewsPrev")}
            onClick={() => setActive((active - 1 + n) % n)}
          >
            <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.6} style={{ transform: "rotate(180deg)" }} />
          </button>
          <button
            type="button"
            className="mc-rv-arr"
            aria-label={t("businessPage.builder.preview.reviewsNext")}
            onClick={() => setActive((active + 1) % n)}
          >
            <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </div>
  );
}
