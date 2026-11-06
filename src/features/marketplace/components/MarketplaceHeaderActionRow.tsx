import { useLayoutEffect, useRef, type MutableRefObject, type ReactNode } from "react";
import { cn } from "../../../shared/lib/utils";
import { APP_SCROLL_CONTAINER_ATTR } from "../../../shared/utils/scroll";

interface MarketplaceHeaderActionRowProps {
  shown: boolean;
  /** Animate the change (scroll-driven) instead of applying it at once with
   *  the page scroll compensated (edit-driven). */
  animated: boolean;
  /** The page's scroll-direction tracker, moved along with a compensation so
   *  the tracker doesn't read it as a user scroll. */
  lastScrollYRef: MutableRefObject<number>;
  children: ReactNode;
}

/**
 * Marketplace mobile header row 1 (primary action + bell), projected above the
 * tab switcher. Collapses by animating its grid row to 0 - no transform: iOS
 * WebKit can leave a transformed header unpainted (see MobileCalendarLayout).
 *
 * The header sits at the top of the page's scroll content, so the row
 * appearing or leaving because of an edit would push the field being typed in
 * down (or pull it up). In the commit that changes the row - this component
 * renders inside the header, a commit after the page - the page scrolls by the
 * row's height, so nothing under the finger moves.
 */
export function MarketplaceHeaderActionRow({
  shown,
  animated,
  lastScrollYRef,
  children,
}: MarketplaceHeaderActionRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const shownBeforeRef = useRef(shown);

  useLayoutEffect(() => {
    if (shownBeforeRef.current === shown) return;
    shownBeforeRef.current = shown;
    if (animated) return;
    const scroller = document.querySelector<HTMLElement>(`[${APP_SCROLL_CONTAINER_ATTR}]`);
    const height = rowRef.current?.offsetHeight ?? 0;
    if (!scroller || !height) return;
    scroller.scrollTop += shown ? height : -height;
    lastScrollYRef.current = Math.max(0, scroller.scrollTop);
  }, [shown, animated, lastScrollYRef]);

  return (
    <div
      className={cn(
        "grid",
        animated && "transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
        shown ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
      inert={!shown}
    >
      <div className="min-h-0 overflow-hidden">
        <div ref={rowRef} className="flex h-14 items-center justify-between gap-3 px-3">
          {children}
        </div>
      </div>
    </div>
  );
}

export default MarketplaceHeaderActionRow;
