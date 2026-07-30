import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { LocationWithAssignments } from "../../types";

const EASE_EXIT = "cubic-bezier(0.23, 1, 0.32, 1)";
// Ease-in-out for the container morph: a strong ease-out would land a fifth of
// a large height delta in the first frame and read as a snap.
const EASE_HEIGHT = "cubic-bezier(0.4, 0, 0.2, 1)";
const EXIT_DURATION = 120;
const REDUCED_EXIT_DURATION = 60;
const HEIGHT_DURATION = 350;
const EXIT_SHIFT = 6;
const EXIT_BLUR = 4;
const ENTER_SHIFT = 16;

interface DisplayedLocation {
  location: LocationWithAssignments;
  orderIndex: number;
}

interface SwapState {
  count: number;
  dir: 1 | -1;
}

interface LocationWorkspaceTransitionProps {
  location: LocationWithAssignments;
  /** Position in the rail, so the cascade travels in the direction of the click. */
  orderIndex: number;
  enabled: boolean;
  children: (location: LocationWithAssignments) => ReactNode;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Choreographed workspace swap: the outgoing panel drops away in a fast fade,
 * then the incoming panel's sections cascade in with a slight stagger (see the
 * `ws-section-in` rules in globals.css) while the container morphs between the
 * two panel heights. The rail and page chrome never move; only the content
 * that actually changed does.
 */
export function LocationWorkspaceTransition({
  location,
  orderIndex,
  enabled,
  children,
}: LocationWorkspaceTransitionProps) {
  const [displayed, setDisplayed] = useState<DisplayedLocation>({
    location,
    orderIndex,
  });
  const [swap, setSwap] = useState<SwapState>({ count: 0, dir: 1 });

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<DisplayedLocation>({ location, orderIndex });
  const exitRef = useRef<Animation | null>(null);
  const heightRef = useRef<Animation | null>(null);
  const pinnedHeightRef = useRef<number | null>(null);

  // A selection made while an exit is in flight is revealed by that exit's
  // completion rather than starting a competing one.
  useEffect(() => {
    pendingRef.current = { location, orderIndex };
  }, [location, orderIndex]);

  // Pure state syncs that need no DOM measurement are adjusted during render.
  if (!enabled) {
    if (swap.count !== 0) setSwap({ count: 0, dir: 1 });
    if (displayed.location !== location) setDisplayed({ location, orderIndex });
  } else if (
    displayed.location.id === location.id &&
    displayed.location !== location
  ) {
    // Same location, fresher object (a portfolio or visibility update landed).
    setDisplayed({ location, orderIndex });
  }

  useEffect(() => {
    if (enabled) return;
    exitRef.current?.cancel();
    exitRef.current = null;
    heightRef.current?.cancel();
    heightRef.current = null;
    pinnedHeightRef.current = null;
    const container = containerRef.current;
    if (container) {
      container.style.height = "";
      container.style.overflow = "";
    }
    const content = contentRef.current;
    if (content) content.style.pointerEvents = "";
  }, [enabled]);

  useEffect(
    () => () => {
      exitRef.current?.cancel();
      heightRef.current?.cancel();
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;
    if (displayed.location.id === location.id) return;
    if (exitRef.current) return;

    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const reduced = prefersReducedMotion();
    const dir: 1 | -1 = orderIndex >= displayed.orderIndex ? 1 : -1;

    // Hold the height the panel is actually at (mid-morph when interrupted),
    // so the next morph continues from there instead of snapping.
    const fromHeight = container.getBoundingClientRect().height;
    heightRef.current?.cancel();
    heightRef.current = null;
    pinnedHeightRef.current = fromHeight;
    container.style.height = `${fromHeight}px`;
    container.style.overflow = "hidden";
    content.style.pointerEvents = "none";

    // The old panel defocuses out in the direction of travel; the same blur
    // language the entrance resolves from, so the swap reads as one gesture.
    const exit = content.animate(
      [
        { opacity: 1, transform: "none", filter: "blur(0px)" },
        {
          opacity: 0,
          transform: reduced ? "none" : `translateY(${-EXIT_SHIFT * dir}px)`,
          filter: reduced ? "none" : `blur(${EXIT_BLUR}px)`,
        },
      ],
      {
        duration: reduced ? REDUCED_EXIT_DURATION : EXIT_DURATION,
        easing: EASE_EXIT,
        fill: "forwards",
      },
    );
    exitRef.current = exit;

    exit.finished
      .then(() => {
        if (exitRef.current !== exit) return;
        exitRef.current = null;
        setDisplayed(pendingRef.current);
        setSwap((previous) => ({ count: previous.count + 1, dir }));
      })
      .catch(() => {
        // Cancelled: the split workspace collapsed or unmounted.
      });
  }, [displayed, enabled, location, orderIndex]);

  useLayoutEffect(() => {
    const fromHeight = pinnedHeightRef.current;
    if (fromHeight == null) return;
    pinnedHeightRef.current = null;

    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    // Drop the exit's forward-fill before paint so the cascade is visible.
    for (const animation of content.getAnimations()) animation.cancel();
    content.style.pointerEvents = "";

    const release = () => {
      container.style.height = "";
      container.style.overflow = "";
    };

    if (prefersReducedMotion()) {
      release();
      return;
    }

    container.style.height = "";
    const toHeight = container.getBoundingClientRect().height;
    if (Math.round(toHeight) === Math.round(fromHeight)) {
      release();
      return;
    }

    const morph = container.animate(
      [{ height: `${fromHeight}px` }, { height: `${toHeight}px` }],
      { duration: HEIGHT_DURATION, easing: EASE_HEIGHT, fill: "both" },
    );
    heightRef.current = morph;

    morph.finished
      .then(() => {
        if (heightRef.current !== morph) return;
        heightRef.current = null;
        morph.cancel();
        release();
      })
      .catch(() => {
        // Superseded by a newer selection.
      });
  }, [displayed]);

  return (
    // No persistent transform or filter on these wrappers: they would become
    // the containing block for the gallery's fixed-position carousel.
    <div ref={containerRef}>
      <div
        ref={contentRef}
        data-ws-swap={enabled && swap.count > 0 ? "" : undefined}
        style={
          enabled
            ? ({ "--ws-shift": `${ENTER_SHIFT * swap.dir}px` } as CSSProperties)
            : undefined
        }
        className="space-y-4"
      >
        {children(enabled ? displayed.location : location)}
      </div>
    </div>
  );
}

export default LocationWorkspaceTransition;
