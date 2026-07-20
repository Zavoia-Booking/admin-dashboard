import { useEffect, type RefObject } from "react";
import { findScrollParent } from "../../../shared/util";
import { HERO_PARALLAX } from "../constants";

/**
 * Cover parallax tied to the preview's scroll container (full-page preview only; skipped under
 * reduced-motion / no image / scoped one-section preview). Shared by the cover-plate and cinematic heroes:
 * the `parallaxRef` element drifts vertically within the header's overscan buffer as the hero scrolls.
 *
 * `skipWhenNarrow` matches the stacked cover-plate, whose photo fills an exact ratio box with no overscan —
 * any shift would bare an edge, so it stays static below 720px. The cinematic cover keeps its overscan at
 * every width and passes `false`.
 */
export function useCoverParallax(
  headerRef: RefObject<HTMLElement | null>,
  parallaxRef: RefObject<HTMLDivElement | null>,
  { enabled, skipWhenNarrow }: { enabled: boolean; skipWhenNarrow: boolean },
): void {
  useEffect(() => {
    const host = parallaxRef.current;
    const header = headerRef.current;
    if (!enabled || !host || !header || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const scroller = findScrollParent(header);
    if (!scroller) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      // Stacked cover-plate (narrow container, ≤720px) drops the image overscan — its photo fills an exact
      // box — so any parallax shift would bare an edge. Keep it static there; the cinematic cover keeps its
      // overscan at every width.
      if (skipWhenNarrow && header.getBoundingClientRect().width <= 720) {
        host.style.transform = "";
        return;
      }
      const r = host.getBoundingClientRect();
      const cr = scroller.getBoundingClientRect();
      const d = r.top + r.height / 2 - (cr.top + cr.height / 2);
      // Clamp inside the image overscan (top:-14% / height:128%) so an edge can never enter the frame.
      const buffer = header.getBoundingClientRect().height * 0.13;
      const ty = Math.max(-buffer, Math.min(buffer, -d * HERO_PARALLAX));
      host.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    // Recompute on resize too, so toggling the preview between desktop and mobile re-evaluates the stacked
    // guard above (the component doesn't remount on toggle, so a scroll-only listener would go stale).
    const ro = new ResizeObserver(() => {
      if (!raf) raf = requestAnimationFrame(update);
    });
    ro.observe(header);
    update();
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [headerRef, parallaxRef, enabled, skipWhenNarrow]);
}
