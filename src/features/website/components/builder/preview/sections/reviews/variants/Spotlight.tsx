import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Stars } from "../../../shared/primitives";
import { prefersReducedMotion } from "../../../shared/util";
import { useInView } from "../../../shared/hooks";
import { RvHead } from "../parts/RvHead";
import { RvSlide } from "../parts/RvSlide";
import type { ReviewsViewProps } from "../types";
import "./spotlight.css";

/** Empty-star colour on the dark panel — paper on ink. */
const DARK_EMPTY = "color-mix(in oklch, var(--mc-bg) 22%, transparent)";

/** Spotlight — the stage goes dark: one voice at a time on a full-width ink panel. Paper-toned serif, accent
 *  stars, a giant number ornament, a height-locked slide (every voice laid out invisibly so the panel keeps
 *  its tallest quote's height), and an accent progress hairline along the bottom edge. Auto-advances (driven
 *  by setInterval + performance.now, like the showcase, so an idled rAF can't freeze it). Mirrors `RvSpotlight`. */
export function Spotlight({ quotes, rating, count, showHeading, heading, kicker, no, italic, t }: ReviewsViewProps) {
  const n = quotes.length;
  const reduced = prefersReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLSpanElement>(null);
  const elapsedRef = useRef(0);
  const inView = useInView(rootRef, { threshold: 0.25 });

  useEffect(() => {
    const fill = progRef.current;
    const DUR = 6800;
    if (fill) fill.style.transform = `scaleX(${Math.min(1, elapsedRef.current / DUR)})`;
    if (reduced || n <= 1 || paused || !inView) return;
    const start = performance.now() - elapsedRef.current;
    const id = setInterval(() => {
      const e = performance.now() - start;
      elapsedRef.current = e;
      const p = Math.min(1, e / DUR);
      if (fill) fill.style.transform = `scaleX(${p})`;
      if (p >= 1) {
        clearInterval(id);
        elapsedRef.current = 0;
        setActive((a) => (a + 1) % n);
      }
    }, 1000 / 60);
    return () => clearInterval(id);
  }, [active, paused, inView, n, reduced]);

  const select = (i: number) => {
    elapsedRef.current = 0;
    setActive(((i % n) + n) % n);
  };
  const activeIndex = active >= 0 && active < n ? active : 0;
  const cur = quotes[activeIndex];
  const num = (i: number) => String(i + 1).padStart(2, "0");

  // Ratings can exist without written comments (the gate unlocks on rating count, but quotes are the
  // comment-bearing subset): render the head alone rather than a voice-less ink panel. Never crashes on `cur`.
  if (n === 0 || !cur) {
    return <RvHead no={no} kicker={kicker} heading={heading} showHeading={showHeading} />;
  }

  return (
    <>
      <RvHead no={no} kicker={kicker} heading={heading} showHeading={showHeading} />
      <div
        className="mc-rvst"
        ref={rootRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <span className="mc-rvst-orn" aria-hidden>
          {num(activeIndex)}
        </span>
        <div className="mc-rvst-top">
          <span className="mc-rvst-tag">
            <i aria-hidden /> {t("businessPage.builder.preview.reviewsVoice", { n: num(activeIndex) })}
            {cur.locationName ? ` · ${cur.locationName}` : ""}
          </span>
          {count > 0 && (
            <span className="mc-rvst-agg">
              <b>{rating.toFixed(1)}</b> / 5.0 · {t("businessPage.builder.preview.reviewsVerifiedCount", { count })}
            </span>
          )}
        </div>
        <div className="mc-rvst-stars">
          <Stars value={cur.rating} size={16} empty={DARK_EMPTY} />
        </div>
        {/* Height lock — every voice is laid out invisibly in the same grid cell, so the panel keeps the
            height of its tallest quote instead of breathing per slide. */}
        <div className="mc-rv-lock">
          {quotes.map((r, i) => (
            <div key={`g${i}`} className="mc-rv-ghost" aria-hidden>
              <RvSlide item={r} animateIn={false} italic={italic} t={t} starEmpty={DARK_EMPTY} />
            </div>
          ))}
          <div>
            <RvSlide key={activeIndex} item={cur} animateIn={inView && !reduced} italic={italic} t={t} starEmpty={DARK_EMPTY} />
          </div>
        </div>
        <div className="mc-rvst-foot">
          <span className="mc-rvst-count">
            {num(activeIndex)} / {num(n - 1)}
          </span>
          {n > 1 && (
            <div className="mc-rvst-arrows">
              <button
                type="button"
                className="mc-rvst-arr"
                aria-label={t("businessPage.builder.preview.reviewsPrev")}
                onClick={() => select(activeIndex - 1)}
              >
                <ArrowRight className="h-[17px] w-[17px]" strokeWidth={1.6} style={{ transform: "rotate(180deg)" }} />
              </button>
              <button
                type="button"
                className="mc-rvst-arr"
                aria-label={t("businessPage.builder.preview.reviewsNext")}
                onClick={() => select(activeIndex + 1)}
              >
                <ArrowRight className="h-[17px] w-[17px]" strokeWidth={1.6} />
              </button>
            </div>
          )}
        </div>
        <span className="mc-rvst-prog" aria-hidden>
          <span className="mc-rvst-prog-fill" ref={progRef} />
        </span>
      </div>
    </>
  );
}
