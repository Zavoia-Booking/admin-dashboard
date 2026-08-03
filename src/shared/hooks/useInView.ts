import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether the referenced element is currently within the viewport.
 *
 * Starts `true` so anything keyed off "has scrolled away" (a sticky action bar,
 * a compact header CTA) stays hidden until the observer has actually reported —
 * otherwise it flashes in for a frame on mount.
 *
 * `rootMargin` is a primitive rather than an options object so callers can pass
 * it inline without re-creating the observer on every render.
 */
export function useInView<T extends HTMLElement>(rootMargin = "0px") {
  const ref = useRef<T | null>(null);
  // `settled` is false whenever the last reading is not a live one: before the
  // observer's first report, and after the element stops being rendered. It
  // lets a caller hold off on acting until what it sees is actually current.
  const [state, setState] = useState({ inView: true, settled: false });

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // An element under a display:none ancestor (an inactive tab panel)
        // reports not-intersecting with a zero-area rect. That means "not
        // rendered", not "scrolled away", so keep the last real reading —
        // otherwise hiding a panel silently flips the caller's state — but
        // mark it stale so the caller knows not to trust it yet.
        const { width, height } = entry.boundingClientRect;
        if (!entry.isIntersecting && width === 0 && height === 0) {
          setState((prev) => (prev.settled ? { ...prev, settled: false } : prev));
          return;
        }
        setState((prev) =>
          prev.settled && prev.inView === entry.isIntersecting
            ? prev
            : { inView: entry.isIntersecting, settled: true },
        );
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView: state.inView, settled: state.settled };
}

export default useInView;
