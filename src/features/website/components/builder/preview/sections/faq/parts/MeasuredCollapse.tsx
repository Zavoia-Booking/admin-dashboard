import { useLayoutEffect, useRef } from "react";

/**
 * Height-measured disclosure panel. The open height is refreshed when its text changes, its content or
 * preview viewport resizes, and web fonts finish loading, so localized answers never clip mid-transition.
 */
export function MeasuredCollapse({
  open,
  id,
  labelledBy,
  className,
  innerClassName,
  measureKey,
  children,
}: {
  open: boolean;
  id: string;
  labelledBy: string;
  className: string;
  innerClassName: string;
  measureKey: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const content = contentRef.current;
    if (!panel || !content) return;

    let active = true;
    const measure = () => {
      if (!active) return;
      panel.style.maxHeight = open ? `${content.scrollHeight}px` : "0px";
    };

    measure();
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    resizeObserver?.observe(content);
    window.addEventListener("resize", measure, { passive: true });

    const fonts = document.fonts;
    void fonts?.ready.then(measure);
    fonts?.addEventListener?.("loadingdone", measure);

    return () => {
      active = false;
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
      fonts?.removeEventListener?.("loadingdone", measure);
    };
  }, [measureKey, open]);

  return (
    <div
      ref={panelRef}
      id={id}
      className={className}
      role="region"
      aria-labelledby={labelledBy}
      aria-hidden={!open}
      style={{ maxHeight: 0 }}
    >
      <div ref={contentRef} className={innerClassName}>
        {children}
      </div>
    </div>
  );
}
