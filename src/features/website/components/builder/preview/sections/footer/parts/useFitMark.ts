import { useLayoutEffect } from "react";

type FitMarkOptions = {
  base?: number;
  max?: number;
  min?: number;
  wrapMax?: number;
  wrapBelow?: number;
  maxLines?: number;
  onSize?: (fontSize: number, lines: number, element: HTMLElement) => void;
};

/** Fits a large wordmark to its actual container. Long names balance across a bounded number of lines, and
 * the measurement is replayed after font loading, container resize, and preview theme changes. This is the
 * production React equivalent of the design source's `useFitMark`. */
export function useFitMark(
  ref: React.RefObject<HTMLElement | null>,
  dependency: string,
  options: FitMarkOptions = {},
) {
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const base = options.base ?? 240;
    const max = options.max ?? 420;
    const min = options.min ?? 34;
    const wrapMax = options.wrapMax ?? max;
    const wrapBelow = options.wrapBelow ?? 48;
    const onSize = options.onSize;

    const fit = () => {
      element.style.whiteSpace = "nowrap";
      element.style.textWrap = "";
      element.style.lineHeight = "";
      element.style.fontSize = `${base}px`;
      element.style.width = "";

      const available = element.clientWidth;
      element.style.width = "max-content";
      const textWidth = element.offsetWidth;
      element.style.width = "";
      if (!available || !textWidth) return;

      const oneLine = base * ((available * 0.99) / textWidth);
      let fontSize = oneLine;
      let lines = 1;

      if (oneLine >= wrapBelow) {
        fontSize = Math.min(oneLine, max);
      } else {
        const words = (element.textContent ?? "").split(/\s+/).filter(Boolean);
        const probe = document.createElement("span");
        probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:inherit;font-size:${base}px`;
        element.appendChild(probe);
        let widestWord = 1;
        for (const word of words) {
          probe.textContent = word;
          widestWord = Math.max(widestWord, probe.offsetWidth);
        }
        probe.remove();

        const maxLines = options.maxLines ?? (available <= 560 ? 3 : 2);
        const byWord = base * ((available * 0.985) / widestWord);
        const byTotal = base * ((available * maxLines * 0.72) / textWidth);
        fontSize = Math.max(min, Math.min(byWord, byTotal, wrapMax));
        element.style.whiteSpace = "normal";
        element.style.textWrap = "balance";
        element.style.lineHeight = "0.95";
        element.style.fontSize = `${fontSize.toFixed(1)}px`;

        let guard = 6;
        while (guard > 0) {
          guard -= 1;
          const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight) || fontSize;
          lines = Math.max(1, Math.round(element.getBoundingClientRect().height / lineHeight));
          if (lines <= maxLines || fontSize <= min) break;
          fontSize = Math.max(min, fontSize * Math.max(0.7, maxLines / lines));
          element.style.fontSize = `${fontSize.toFixed(1)}px`;
        }
      }

      element.style.fontSize = `${fontSize.toFixed(1)}px`;
      onSize?.(fontSize, lines, element);
    };

    let frame = 0;
    const scheduleFit = () => {
      if (!frame) frame = window.requestAnimationFrame(() => {
        frame = 0;
        fit();
      });
    };

    fit();
    scheduleFit();
    window.addEventListener("resize", scheduleFit);
    void document.fonts?.ready.then(scheduleFit);

    // A ResizeObserver callback must not synchronously resize the element it observes: doing so produces
    // the browser's "undelivered notifications" loop warning. Coalesce all observer work into one frame.
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleFit);
    if (element.parentElement) resizeObserver?.observe(element.parentElement);

    const previewRoot = element.closest<HTMLElement>(".mc-root");
    const mutationObserver = previewRoot ? new MutationObserver(scheduleFit) : null;
    if (previewRoot) mutationObserver?.observe(previewRoot, { attributes: true, attributeFilter: ["style"] });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", scheduleFit);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
    // The options are variant constants; rerender only when the rendered name/font dependency changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependency, ref]);
}
