import { useLayoutEffect, useRef } from "react";
import { StripTrack } from "../StripTrack";
import type { MarqueeVariantProps } from "../types";
import "./loop.css";

/** Dedicated automatic Loop pace: 18px per second. */
const LOOP_SPEED_PX_PER_SECOND = 18;

/** Loop — an automatic-only pass over the same exact Strip treatment, measured so its pace remains a calm
 *  18px/s regardless of how long the service names are. Repeated sequences make the one-set wrap seamless. */
export function Loop({
  items,
  italic,
  separatorStyle,
  separatorSize,
  textSize,
  useBrandColorBackground,
}: MarqueeVariantProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let inView = typeof IntersectionObserver === "undefined";

    const measure = () => {
      const copies = Number(track.dataset.stripCopies) || 3;
      const setWidth = track.scrollWidth / copies;
      if (setWidth > 0) {
        track.style.setProperty("--mc-strip-loop-duration", `${setWidth / LOOP_SPEED_PX_PER_SECOND}s`);
        track.style.setProperty("--mc-strip-loop-distance", `-${setWidth}px`);
      }
    };
    const syncMotion = () => {
      const running = inView && !reducedMotion?.matches;
      track.style.animationPlayState = running ? "running" : "paused";
      track.style.willChange = running ? "transform" : "auto";
    };
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    const intersectionObserver = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) => {
          inView = entry?.isIntersecting ?? true;
          syncMotion();
        });
    resizeObserver?.observe(track);
    intersectionObserver?.observe(track);
    reducedMotion?.addEventListener?.("change", syncMotion);
    measure();
    syncMotion();

    return () => {
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      reducedMotion?.removeEventListener?.("change", syncMotion);
      track.style.removeProperty("--mc-strip-loop-duration");
      track.style.removeProperty("--mc-strip-loop-distance");
      track.style.animationPlayState = "";
      track.style.willChange = "";
    };
  }, [items.length]);

  return (
    <div
      className={`mc-strip mc-strip--loop${italic ? "" : " mc-strip--roman"}${
        useBrandColorBackground ? " mc-strip--brand-background" : ""
      }`}
    >
      <StripTrack
        items={items}
        trackRef={trackRef}
        className="mc-strip-track--loop"
        separatorStyle={separatorStyle}
        separatorSize={separatorSize}
        textSize={textSize}
      />
    </div>
  );
}
