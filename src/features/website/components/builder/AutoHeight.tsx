import { useEffect, useRef, type ReactNode } from "react";

/**
 * Holds an open Radix collapsible to its *live* content height. Radix measures
 * `--radix-collapsible-content-height` only at open time, so content that grows afterwards (e.g. a
 * field revealed by a toggle) would stay frozen and clip under `overflow:hidden`. A ResizeObserver
 * re-sets the var on the nearest collapsible-content ancestor so the panel tracks growth and shrink.
 * Nest it directly inside a `CollapsibleContent`.
 */
export function AutoHeight({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const box = el?.closest('[data-slot="collapsible-content"]') as HTMLElement | null;
    if (!el || !box) return;
    const update = () =>
      box.style.setProperty("--radix-collapsible-content-height", `${el.scrollHeight}px`);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
