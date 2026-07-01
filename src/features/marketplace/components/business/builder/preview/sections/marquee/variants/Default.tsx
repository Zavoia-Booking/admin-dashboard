import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "../../../../../../../../../shared/lib/utils";
import { DISPLAY } from "../../../shared/constants";
import { findScrollParent } from "../../../shared/util";
import type { MarqueeVariantProps } from "../types";

/** Pixels the scroll-driven band glides per pixel of page scroll (matches the editorial source's coupling). */
const MARQUEE_SCROLL_SPEED = 0.35;

/** Default — the kinetic strip: "scroll" glides the band with page scroll (the editorial source's
 *  behaviour), "loop" runs an always-on auto drift (CSS). The track holds three copies of the (identical)
 *  item set, so any translation reads as a seamless periodic loop. */
export function Default({ items, loopMode, scrollDriven, italic }: MarqueeVariantProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollDriven) return;
    const track = trackRef.current;
    if (!track) return;
    // Reduced motion: leave the band still rather than tie movement to scroll (mirrors the hero parallax bail).
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Ride the same scroll container the nav-frost does (the dialog's scroller) — the first scrollable ancestor.
    const sc = findScrollParent(track);
    if (!sc) return;
    let setWidth = track.scrollWidth / 3 || 1;
    const ro = new ResizeObserver(() => {
      setWidth = track.scrollWidth / 3 || 1;
    });
    ro.observe(track);
    let raf = 0;
    const update = () => {
      raf = 0;
      // Modulo one set width keeps the offset bounded; the three identical copies make the wrap invisible.
      const off = -((sc.scrollTop * MARQUEE_SCROLL_SPEED) % setWidth);
      track.style.transform = `translateX(${off.toFixed(1)}px)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      sc.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      track.style.transform = "";
    };
  }, [scrollDriven, items.length]);

  // Three copies so translating by exactly one set width loops seamlessly. In loop mode the glide pace is
  // held constant by scaling the CSS duration with the count (~3s to cross per item — a calm editorial pace).
  const loop = [...items, ...items, ...items];

  return (
    <div className="overflow-hidden" style={{ background: "var(--mc-fg)", color: "var(--mc-bg)" }}>
      <div
        ref={trackRef}
        className={cn(
          "flex w-max items-center whitespace-nowrap py-[clamp(12px,1.7cqw,20px)] [will-change:transform]",
          loopMode && "mc-band-track",
        )}
        style={{ "--mc-band-dur": `${items.length * 3}s` } as CSSProperties}
      >
        {loop.map((it, i) => (
          <span
            key={i}
            className={cn("inline-flex items-center gap-[0.6em] px-[0.45em]", italic && "italic")}
            style={{ ...DISPLAY, fontSize: "clamp(18px,2.6cqw,34px)" }}
          >
            {it}
            <span className="not-italic" style={{ color: "var(--mc-accent)" }} aria-hidden>
              ·
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
