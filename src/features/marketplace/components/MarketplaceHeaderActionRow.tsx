import type { ReactNode } from "react";
import { cn } from "../../../shared/lib/utils";

interface MarketplaceHeaderActionRowProps {
  shown: boolean;
  children: ReactNode;
}

/**
 * Marketplace mobile header row 1 (primary action + bell), projected above the
 * tab switcher. Collapses by animating its grid row to 0 - no transform: iOS
 * WebKit can leave a transformed header unpainted (see MobileCalendarLayout).
 *
 * The page uses AppLayout's mobileViewport layout, so the header sits above the
 * scrolling column: the row's height change resizes that column and the
 * content glides with it, without moving the scroll position. (Inside the
 * scroll content, the same change shifted everything under the finger, fought
 * Chromium's scroll anchoring, and moved the strip's publish button across the
 * viewport edge it is observed against.)
 */
export function MarketplaceHeaderActionRow({ shown, children }: MarketplaceHeaderActionRowProps) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
        shown ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
      inert={!shown}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="flex h-14 items-center justify-between gap-3 px-3">{children}</div>
      </div>
    </div>
  );
}

export default MarketplaceHeaderActionRow;
