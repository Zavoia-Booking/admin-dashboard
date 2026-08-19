import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { findScrollParent, prefersReducedMotion } from "./util";

/** True inside a static snapshot of the page (ScaledPreview: mobile peek, locked-view teaser, variant
 *  thumbnails). Those render the page scaled-down and non-interactive, so nothing in them should move. */
export const StaticPreviewContext = createContext(false);

/** True when the full-page preview renders its choreography settled while staying scrollable — the phone's
 *  scaled-down desktop mock. Self-running JS motion (marquees, physics, scroll-jacks) parks on its end
 *  state there: a ~27%-scale page can't afford promoted layers (Chrome rasterises them at native size and
 *  evicts tiles — the checkerboard flashes), and motion can't be judged at that size anyway. */
export const PreviewAtRestContext = createContext(false);

/** Reduced-motion for the preview tree: the OS preference, a static preview scope, or an at-rest full-page
 *  preview. Every effect that settles under reduced motion (parallax, scroll-jacks, reveals, marquees,
 *  count-ups) reads this so those surfaces land on the settled state instead of replaying — or
 *  scroll-driving — the choreography. */
export function useReducedMotion(): boolean {
  const staticPreview = useContext(StaticPreviewContext);
  const atRest = useContext(PreviewAtRestContext);
  return staticPreview || atRest || prefersReducedMotion();
}

/** IntersectionObserver gate (F5): tracks whether `ref` is in view (continuously, so callers can pause motion
 *  when scrolled away), defaulting to true where IO is unavailable. `once` latches true on first intersect
 *  (for entrance reveals like the rating-distribution bars). Shared by the reviews marquee/spotlight/deck.
 *  A static preview reports "in view" straight away — the observer would otherwise fire off the *page*
 *  scroll (the thumbnail's own box never scrolls) and pop entrances in as the card scrolls by. */
export function useInView(
  ref: React.RefObject<HTMLElement | null>,
  { threshold = 0.25, once = false }: { threshold?: number; once?: boolean } = {},
): boolean {
  const staticPreview = useContext(StaticPreviewContext);
  const [inView, setInView] = useState(staticPreview);
  useEffect(() => {
    if (staticPreview) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (once) {
            if (e.isIntersecting) {
              setInView(true);
              io.disconnect();
            }
          } else {
            setInView(e.isIntersecting);
          }
        }),
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, once, staticPreview]);
  return inView;
}

/** Footer reveal: drive `--mc-reveal` (0 hidden → 1 fully shown) off the preview's scroll container so the
 *  pinned footer dims while covered and lightens to paper as the lifting page uncovers it. The builder uses
 *  an element scroller (often in a transformed logical viewport), so the source engine is reproduced in
 *  that coordinate system: exact footer-height reservation on tablet/desktop and top-in-view progress on
 *  phones. Reduced motion lands directly in the settled state. */
export function useFooterReveal(
  rootRef: React.RefObject<HTMLElement | null>,
  footerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
) {
  const reducedMotion = useReducedMotion();
  useLayoutEffect(() => {
    const root = rootRef.current;
    const footer = footerRef.current;
    if (!root) return;
    if (!active || !footer) {
      root.style.setProperty("--mc-reveal", "1");
      root.style.removeProperty("--mc-footer-height");
      return;
    }

    const reduced = reducedMotion;
    const sc = findScrollParent(root);
    const win = !sc;
    const target: HTMLElement | Window = sc ?? window;
    let raf = 0;

    const update = () => {
      raf = 0;
      const fh = footer.offsetHeight;
      const phone = root.clientWidth <= 560;

      if (phone) root.style.removeProperty("--mc-footer-height");
      else if (fh > 0) root.style.setProperty("--mc-footer-height", `${fh}px`);

      if (reduced) {
        root.style.setProperty("--mc-reveal", "1");
        return;
      }

      let r = 0;
      if (phone) {
        const vh = win ? window.innerHeight : sc!.clientHeight;
        const footerRect = footer.getBoundingClientRect();
        const scrollRect = win ? null : sc!.getBoundingClientRect();
        const scale = scrollRect && sc!.clientHeight > 0 ? scrollRect.height / sc!.clientHeight : 1;
        const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
        const footerTop = win ? footerRect.top : (footerRect.top - scrollRect!.top) / safeScale;
        const from = vh;
        const to = vh * 0.35;
        r = from > to ? Math.max(0, Math.min(1, (from - footerTop) / (from - to))) : 1;
      } else {
        const top = win ? window.scrollY || document.documentElement.scrollTop : sc!.scrollTop;
        const max = win
          ? document.documentElement.scrollHeight - window.innerHeight
          : sc!.scrollHeight - sc!.clientHeight;
        r = fh > 0 ? Math.max(0, Math.min(1, (top - (max - fh)) / fh)) : 0;
      }
      root.style.setProperty("--mc-reveal", `${Math.round(r * 1000) / 1000}`);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onScroll);
    observer?.observe(root);
    observer?.observe(footer);
    update();
    raf = requestAnimationFrame(update);
    return () => {
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      observer?.disconnect();
      if (raf) cancelAnimationFrame(raf);
      root.style.removeProperty("--mc-footer-height");
    };
  }, [active, rootRef, footerRef, reducedMotion]);
}
