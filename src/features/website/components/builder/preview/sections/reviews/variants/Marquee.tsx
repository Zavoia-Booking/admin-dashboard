import { useEffect, useRef, useState } from "react";
import { Stars } from "../../../shared/primitives";
import { prefersReducedMotion } from "../../../shared/util";
import { useInView } from "../../../shared/hooks";
import { RvHead } from "../parts/RvHead";
import type { PreviewReview } from "../../../shared/types";
import type { ReviewsViewProps } from "../types";
import "./marquee.css";

/** One drifting lane — a doubled row of quote cards translated by a time-based tween (setInterval +
 *  performance.now, like the showcase progress) so the preview's idled rAF clock can't freeze it; pauses on
 *  hover / out of view. Doubling + wrapping the offset by half the track width makes it seamless. */
function RvLane({ items, dir, speed }: { items: PreviewReview[]; dir: 1 | -1; speed: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const inView = useInView(rootRef, { threshold: 0.1 });
  const reduced = prefersReducedMotion();

  useEffect(() => {
    const track = trackRef.current;
    if (!track || reduced || paused || !inView) return;
    let off = parseFloat(track.dataset.off || "0") || 0;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const half = track.scrollWidth / 2;
      if (!half) {
        last = now;
        return;
      }
      off += ((now - last) / 1000) * speed * dir;
      last = now;
      if (off <= -half) off += half;
      if (off > 0) off -= half;
      track.dataset.off = String(off);
      track.style.transform = `translate3d(${off.toFixed(1)}px,0,0)`;
    }, 1000 / 60);
    return () => clearInterval(id);
  }, [paused, inView, dir, speed, reduced]);

  const seq = items.concat(items);
  return (
    <div
      className="mc-rvm-row"
      ref={rootRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="mc-rvm-track" ref={trackRef}>
        {seq.map((r, i) => (
          <figure key={i} className="mc-rvm-card">
            <Stars value={r.rating} size={12} />
            <blockquote className="mc-rvm-q">“{r.comment}”</blockquote>
            <figcaption className="mc-rvm-meta">
              <b>{r.customerName}</b>
              {r.locationName && <span>{r.locationName}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/** Marquee — a centred one-line aggregate over two counter-drifting lanes; the motion carries the section.
 *  Mirrors the source `RvMarquee`. */
export function Marquee({ quotes, rating, count, showHeading, heading, kicker, no, t }: ReviewsViewProps) {
  const cut = Math.ceil(quotes.length / 2);
  const a = quotes.slice(0, cut);
  const b = quotes.slice(cut);
  return (
    <>
      <RvHead no={no} kicker={kicker} heading={heading} showHeading={showHeading} center>
        {count > 0 && (
          <div className="mc-rv-line">
            <Stars value={rating} size={14} />
            <span>
              <b>{rating.toFixed(1)}</b> {t("businessPage.builder.preview.reviewsAverageWord")}
            </span>
            <span className="mc-rv-line-dot" aria-hidden>
              ·
            </span>
            <span>
              <b>{count.toLocaleString()}</b> {t("businessPage.builder.preview.reviewsVerifiedReviews")}
            </span>
          </div>
        )}
      </RvHead>
      <div className="mc-rvm">
        <RvLane items={a} dir={-1} speed={24} />
        <RvLane items={b.length > 1 ? b : a} dir={1} speed={19} />
      </div>
    </>
  );
}
