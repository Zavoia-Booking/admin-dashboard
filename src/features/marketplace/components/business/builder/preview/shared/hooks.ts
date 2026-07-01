import { useEffect } from "react";
import { findScrollParent } from "./util";

/** Footer reveal: drive `--mc-reveal` (0 hidden → 1 fully shown) off the preview's scroll container so the
 *  pinned footer dims while covered and lightens to paper as the lifting page uncovers it. Mirrors the
 *  source `useMicroEngine` footer block; the sticky positioning itself is pure CSS, this only adds polish.
 *  Reduced motion (or no scroll container) lands the settled, fully-revealed state. */
export function useFooterReveal(
  rootRef: React.RefObject<HTMLElement | null>,
  footerRef: React.RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    const root = rootRef.current;
    const footer = footerRef.current;
    if (!active || !root || !footer) return;
    const settle = () => root.style.setProperty("--mc-reveal", "1");
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      settle();
      return;
    }
    const sc = findScrollParent(root);
    const win = !sc;
    const target: HTMLElement | Window = sc ?? window;
    let raf = 0;
    const update = () => {
      raf = 0;
      const fh = footer.offsetHeight;
      const top = win ? window.scrollY || document.documentElement.scrollTop : sc!.scrollTop;
      const max = win
        ? document.documentElement.scrollHeight - window.innerHeight
        : sc!.scrollHeight - sc!.clientHeight;
      const r = fh > 0 ? Math.max(0, Math.min(1, (top - (max - fh)) / fh)) : 1;
      root.style.setProperty("--mc-reveal", `${Math.round(r * 1000) / 1000}`);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [active, rootRef, footerRef]);
}
