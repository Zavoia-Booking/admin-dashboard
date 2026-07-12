import { useLayoutEffect, useRef, useState } from "react";
import type { SectionEntry } from "../../../types";
import { cn } from "../../../../../shared/lib/utils";
import { LivePreview } from "./Microsite";
import type { PreviewData } from "./shared/types";

interface ScaledPreviewProps {
  layout: SectionEntry[];
  data: PreviewData;
  chrome?: boolean;
  startNumber?: number;
  /** Desktop width the preview renders at before scaling down — must clear every section's container-query
   *  collapse point (the widest is Team at 900px) so a thumbnail always shows the desktop arrangement. */
  virtualWidth?: number;
  /** Fade the bottom edge when the scaled content is taller than the clip box, so a crop reads as
   *  intentional rather than cut off. Opt-in: callers with their own fade (the locked-view teaser) skip it. */
  fadeOverflow?: boolean;
  /** Sizes the clip box (e.g. `aspect-[16/10]` for a gallery card, `h-[420px]` for a teaser). */
  className?: string;
}

/**
 * Renders a real `LivePreview` at a fixed desktop width, then scales it down with `transform: scale()` to
 * fit the caller's clip box — the same trick a browser zoom uses, so a small thumbnail still shows the true
 * desktop layout instead of the mobile-collapsed one a narrow container query would otherwise trigger.
 * `inert` makes the subtree fully non-interactive (pointer, keyboard focus, and assistive tech) — the
 * preview sections contain real links/buttons that must never be reachable from a thumbnail.
 */
export function ScaledPreview({
  layout,
  data,
  chrome = true,
  startNumber = 1,
  virtualWidth = 1000,
  fadeOverflow = false,
  className,
}: ScaledPreviewProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [contentHeight, setContentHeight] = useState(0);

  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => {
      // Fractional width keeps the scale exact — clientWidth rounds to an integer.
      const rect = el.getBoundingClientRect();
      setBox({ width: rect.width, height: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = box.width > 0 ? box.width / virtualWidth : 0;
  const mounted = scale > 0;

  useLayoutEffect(() => {
    if (!fadeOverflow || !mounted) return;
    const el = innerRef.current;
    if (!el) return;
    const update = () => setContentHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fadeOverflow, mounted]);

  const overflows = fadeOverflow && mounted && contentHeight * scale > box.height + 1;

  return (
    <div
      ref={outerRef}
      className={cn("relative overflow-hidden pointer-events-none select-none", className)}
      aria-hidden
      inert
    >
      {mounted && (
        <div
          ref={innerRef}
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: virtualWidth, transform: `scale(${scale})` }}
        >
          <LivePreview layout={layout} data={data} chrome={chrome} startNumber={startNumber} />
        </div>
      )}
      {overflows && (
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent" />
      )}
    </div>
  );
}

export default ScaledPreview;
