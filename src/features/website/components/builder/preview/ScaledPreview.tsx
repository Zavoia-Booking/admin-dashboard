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
  /** Keeps the compact Atelier peek aligned with the section selected in the editor. The
   *  supplied design drives its embedded preview to the selected section as soon as a row opens. */
  focusType?: string;
  selectedLocationId?: number | null;
  onSelectedLocationChange?: (locationId: number | null) => void;
  /** Desktop width the preview renders at before scaling down — must clear every section's container-query
   *  collapse point (the widest are the 1024px tablet rules in about/gallery-fan/hero-tumble/locations-panorama/
   *  footer-masthead/team-carousel) so a thumbnail always shows the desktop arrangement. */
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
  focusType,
  selectedLocationId,
  onSelectedLocationChange,
  virtualWidth = 1040,
  fadeOverflow = false,
  className,
}: ScaledPreviewProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [contentHeight, setContentHeight] = useState(0);
  const [focusOffset, setFocusOffset] = useState(0);

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

  useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner || !mounted) return;

    const update = () => {
      if (!focusType || focusType === "top" || focusType === "nav" || focusType === "announcement" || focusType === "hero") {
        setFocusOffset(0);
        return;
      }

      if (focusType === "footer") {
        const logicalViewportHeight = box.height / scale;
        setFocusOffset(Math.max(0, inner.scrollHeight - logicalViewportHeight));
        return;
      }

      const target = Array.from(
        inner.querySelectorAll<HTMLElement>("[data-preview-section]"),
      ).find((node) => node.dataset.previewSection === focusType);
      if (!target) {
        setFocusOffset(0);
        return;
      }

      const innerRect = inner.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      // The Atelier source keeps 56 logical pixels of context above an in-flow section.
      setFocusOffset(Math.max(0, (targetRect.top - innerRect.top) / scale - 56));
    };

    update();
    const frame = window.requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(inner);
    inner
      .querySelectorAll<HTMLElement>("[data-preview-section]")
      .forEach((section) => observer.observe(section));
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [box.height, data, focusType, layout, mounted, scale]);

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
          className={cn(
            "absolute left-0 top-0 origin-top-left",
            focusType &&
              "transition-transform duration-[420ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
          )}
          style={{
            width: virtualWidth,
            transform: `scale(${scale}) translate3d(0, ${-focusOffset}px, 0)`,
          }}
        >
          <LivePreview
            layout={layout}
            data={data}
            chrome={chrome}
            startNumber={startNumber}
            focusType={focusType}
            selectedLocationId={selectedLocationId}
            onSelectedLocationChange={onSelectedLocationChange}
          />
        </div>
      )}
      {overflows && (
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#fbfaf7] to-transparent" />
      )}
    </div>
  );
}

export default ScaledPreview;
