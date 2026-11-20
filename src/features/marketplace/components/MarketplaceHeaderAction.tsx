import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "../../../shared/lib/utils";
import { Button } from "../../../shared/components/ui/button";
import { Spinner } from "../../../shared/components/ui/spinner";
import { NotificationBell } from "../../../shared/components/common/NotificationBell";

interface MarketplaceHeaderActionProps {
  /** Save / Publish instead of the bell. */
  shown?: boolean;
  label?: string;
  busy?: boolean;
  onAction?: () => void;
  /** Swaps tween; the first paint and the skeleton handover snap. */
  animate?: boolean;
}

/** Right end of the mobile header's tab row: the bell, or Save / Publish. Its
 *  width tweens on the calendar header's morph curve so the tabs give way
 *  smoothly; fixed h-10, so the header height never changes. */
export function MarketplaceHeaderAction({
  shown = false,
  label,
  busy = false,
  onAction,
  animate = false,
}: MarketplaceHeaderActionProps) {
  const bellRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [widths, setWidths] = useState({ bell: 44, action: 0 });

  useLayoutEffect(() => {
    const read = () => {
      const bell = bellRef.current?.offsetWidth ?? 0;
      const action = measureRef.current?.offsetWidth ?? 0;
      setWidths((prev) =>
        prev.bell === bell && prev.action === action ? prev : { bell, action },
      );
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    // Re-measures once the web font lands.
    const observer = new ResizeObserver(read);
    if (bellRef.current) observer.observe(bellRef.current);
    if (measureRef.current) observer.observe(measureRef.current);
    return () => observer.disconnect();
  }, [label]);

  return (
    <div
      className={cn(
        "relative h-10",
        animate &&
          "transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
      )}
      style={{ width: shown ? widths.action : widths.bell }}
    >
      {/* data-navigate: the unsaved-changes guard intercepts the bell like any other way off the page. */}
      <span
        ref={bellRef}
        data-navigate="/notifications"
        inert={shown}
        className={cn(
          "absolute inset-y-0 right-0 flex items-center",
          shown ? "pointer-events-none opacity-0" : "opacity-100",
          animate &&
            (shown
              ? "transition-opacity duration-100 ease-out"
              : "transition-opacity delay-75 duration-200 ease-out"),
        )}
      >
        <NotificationBell variant="header" />
      </span>

      {label !== undefined && (
        <Button
          onClick={onAction}
          disabled={busy}
          aria-busy={busy || undefined}
          inert={!shown}
          rounded="full"
          className={cn(
            // The active tab pill's height, as wide as the slot; after: keeps a 40px tap area.
            "btn-primary absolute inset-x-0 top-1 h-8 !min-h-0 !min-w-0 px-0 py-0 text-sm font-semibold active:scale-[0.98] after:absolute after:-inset-1",
            shown ? "opacity-100" : "pointer-events-none opacity-0",
            animate &&
              (shown
                ? "transition-opacity duration-200 ease-out"
                : "transition-opacity duration-100 ease-out"),
          )}
        >
          {/* Fades in once the pill has widened, so it never spills past it. */}
          <span
            className={cn(
              busy ? "invisible opacity-0" : shown ? "opacity-100" : "opacity-0",
              animate &&
                (shown
                  ? "transition-opacity delay-75 duration-150 ease-out"
                  : "transition-opacity duration-75 ease-out"),
            )}
          >
            {label}
          </span>
          {busy && <Spinner size="sm" color="white" className="absolute" />}
        </Button>
      )}

      {/* The pill's natural width: the label plus the old button's px-4. */}
      <span
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute whitespace-nowrap px-4 text-sm font-semibold"
      >
        {label}
      </span>
    </div>
  );
}
