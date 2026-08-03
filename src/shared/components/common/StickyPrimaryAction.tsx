import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

/** Clears the mobile bottom nav (64px — the offset its own drawer uses) plus a
 *  gap, so the action reads as floating above the nav rather than docked to it. */
const FLOAT_OFFSET = "calc(64px + env(safe-area-inset-bottom) + 12px)";

/** Hidden pose: parks the pill fully below the viewport edge, clearing its own
 *  height, the nav it floats above, and its drop shadow, so revealing it reads
 *  as sliding up from off-screen. Set inline rather than via translate-y-* so
 *  it can carry the safe-area inset. */
const HIDDEN_TRANSFORM = "translateY(calc(140px + env(safe-area-inset-bottom)))";

interface StickyPrimaryActionProps {
  /** Usually `!inView` of the in-content action this stands in for. */
  visible: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * A screen's single primary action, floating above the mobile bottom nav and
 * revealed only once the real in-content action has scrolled out of view, so
 * the two are never on screen at the same time.
 *
 * Deliberately has no surface of its own: the child pill carries its own
 * shadow, matching the existing MobileClearFiltersFab language instead of
 * laying a full-width band across the page.
 *
 * Portaled to document.body on purpose: as a `fixed` element it would otherwise
 * be captured by any ancestor carrying a `transform`, which collapses it into
 * that ancestor's box — the containing-block trap MobileCalendarHeader
 * documents. Portaling makes it behave the same wherever it is mounted.
 *
 * Renders an inline spacer at its call site so it can never cover the end of
 * the page. The spacer is unconditional, so revealing the action never shifts
 * layout.
 */
export function StickyPrimaryAction({
  visible,
  children,
  className,
}: StickyPrimaryActionProps) {
  return (
    <>
      <div className="h-16" aria-hidden />
      {createPortal(
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4",
            // transition-transform, not transition-[transform,...]: Tailwind v4
            // compiles translate-y-* to the `translate` property, so a literal
            // `transform` list would not cover it. This utility lists all four.
            "transition-transform duration-400 ease-[var(--ease-out-strong)] motion-reduce:transition-none",
            className,
          )}
          style={{
            bottom: FLOAT_OFFSET,
            transform: visible ? "translateY(0)" : HIDDEN_TRANSFORM,
          }}
          // Hidden from AT while off-screen: the in-content action it mirrors
          // is still in the tree, so exposing both would duplicate it.
          aria-hidden={!visible}
        >
          <div className={visible ? "pointer-events-auto" : "pointer-events-none"}>
            {children}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

export default StickyPrimaryAction;
