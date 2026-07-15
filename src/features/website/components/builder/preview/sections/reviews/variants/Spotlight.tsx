import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Stars } from "../../../shared/primitives";
import { prefersReducedMotion } from "../../../shared/util";
import { useInView } from "../../../shared/hooks";
import { RvSlide } from "../parts/RvSlide";
import type { ReviewsVariantProps } from "../types";

/** Spotlight — one voice at a time, centre stage, auto-advancing with prev/next arrows (mirrors the source
 *  `RvSpotlight`). Reuses the showcase slide (per-word masked rise) + the shared circular arrow button. */
export function Spotlight({ quotes, italic, t }: ReviewsVariantProps) {
  const n = quotes.length;
  const reduced = prefersReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { threshold: 0.25 });

  useEffect(() => {
    if (reduced || n <= 1 || paused || !inView) return;
    const id = setInterval(() => setActive((a) => (a + 1) % n), 6400);
    return () => clearInterval(id);
  }, [paused, inView, n, reduced]);

  const activeIndex = active >= 0 && active < n ? active : 0;
  const cur = quotes[activeIndex];
  const num = (i: number) => String(i + 1).padStart(2, "0");

  return (
    <div className="mc-rvsp" ref={rootRef} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mc-rvsp-stars">
        <Stars value={cur.rating} size={18} />
      </div>
      <RvSlide key={activeIndex} item={cur} animateIn={inView && !reduced} italic={italic} t={t} />
      {n > 1 && (
        <div className="mc-rvsp-ctrl">
          <button
            type="button"
            className="mc-rv-arr"
            aria-label={t("businessPage.builder.preview.reviewsPrev")}
            onClick={() => setActive((activeIndex - 1 + n) % n)}
          >
            <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.6} style={{ transform: "rotate(180deg)" }} />
          </button>
          <span className="mc-rvsp-count">
            {num(activeIndex)} / {num(n - 1)}
          </span>
          <button
            type="button"
            className="mc-rv-arr"
            aria-label={t("businessPage.builder.preview.reviewsNext")}
            onClick={() => setActive((activeIndex + 1) % n)}
          >
            <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </button>
        </div>
      )}
    </div>
  );
}
