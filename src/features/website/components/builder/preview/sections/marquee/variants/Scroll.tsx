import { useEffect, useRef } from "react";
import { findScrollParent } from "../../../shared/util";
import { StripTrack } from "../StripTrack";
import type { MarqueeVariantProps } from "../types";
import "./scroll.css";

/** Pixels the Strip advances for each pixel the page scrolls. */
const SCROLL_SPEED = 0.7;

/**
 * Scroll — movement is driven exclusively by page scroll position. It stays still between scroll events and
 * in the scoped style card, keeping continuous automatic motion exclusive to the Loop variant.
 */
export function Scroll({
  items,
  scrollDriven,
  italic,
  separatorStyle,
  separatorSize,
  textSize,
  useBrandColorBackground,
}: MarqueeVariantProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !scrollDriven) return;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const scroller = findScrollParent(track);
    const scrollTarget: HTMLElement | Window = scroller ?? window;
    let setWidth = track.scrollWidth / 3 || 1;
    let frame = 0;
    let inView = typeof IntersectionObserver === "undefined";

    const paint = () => {
      frame = 0;
      if (reducedMotion?.matches || !inView) {
        track.style.transform = "";
        return;
      }

      const scrollOffset = (scroller?.scrollTop ?? window.scrollY) * SCROLL_SPEED;
      const offset = -(scrollOffset % setWidth);
      track.style.transform = `translateX(${offset.toFixed(1)}px)`;
    };
    const requestPaint = () => {
      if (!frame && inView && !reducedMotion?.matches) {
        frame = requestAnimationFrame(paint);
      }
    };
    const measure = () => {
      const copies = Number(track.dataset.stripCopies) || 3;
      setWidth = track.scrollWidth / copies || 1;
      requestPaint();
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
    const onMotionPreferenceChange = () => {
      if (reducedMotion?.matches) {
        stop();
        track.style.transform = "";
      } else {
        requestPaint();
      }
    };

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    const intersectionObserver = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) => {
          inView = entry?.isIntersecting ?? true;
          if (inView) requestPaint();
          else stop();
        });
    resizeObserver?.observe(track);
    intersectionObserver?.observe(track);
    scrollTarget.addEventListener("scroll", requestPaint, { passive: true });
    reducedMotion?.addEventListener?.("change", onMotionPreferenceChange);
    measure();
    requestPaint();

    return () => {
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      scrollTarget.removeEventListener("scroll", requestPaint);
      reducedMotion?.removeEventListener?.("change", onMotionPreferenceChange);
      stop();
      track.style.transform = "";
      track.style.willChange = "";
    };
  }, [items.length, scrollDriven]);

  return (
    <div
      className={`mc-strip mc-strip--scroll${italic ? "" : " mc-strip--roman"}${
        useBrandColorBackground ? " mc-strip--brand-background" : ""
      }`}
    >
      <StripTrack
        items={items}
        trackRef={trackRef}
        className="mc-strip-track--scroll"
        separatorStyle={separatorStyle}
        separatorSize={separatorSize}
        textSize={textSize}
      />
    </div>
  );
}
