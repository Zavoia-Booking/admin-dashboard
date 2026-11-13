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

/** Optical-size fonts change their proportions with font size. Measure the candidate sizes instead of
 * assuming that a width measured at the base size scales linearly. Use logical pixels in scaled previews. */
function fitMeasuredWidth(
  estimate: number,
  max: number,
  available: number,
  measure: (size: number) => number,
) {
  let lower = 0;
  let upper = max;
  let size = Math.min(estimate, max);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const width = measure(size);
    if (width <= available) {
      lower = size;
      if (available - width < 0.5 || size === max) break;
    } else {
      upper = size;
    }
    if (upper - lower < 0.1) break;
    size = (lower + upper) / 2;
  }

  return Math.floor(lower * 10) / 10;
}

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
      if (!available) return;
      element.style.width = "max-content";
      const textWidth = element.offsetWidth;
      if (!textWidth) {
        element.style.width = "";
        return;
      }

      const measureText = (size: number) => {
        element.style.fontSize = `${size}px`;
        return element.offsetWidth;
      };
      const oneLine = fitMeasuredWidth(
        base * ((available * 0.99) / textWidth), max, available * 0.99, measureText,
      );
      let fontSize = oneLine;
      let lines = 1;

      if (oneLine >= wrapBelow) {
        fontSize = Math.min(oneLine, max);
      } else {
        const words = (element.textContent ?? "").split(/\s+/).filter(Boolean);
        const probe = document.createElement("span");
        probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;font:inherit";
        element.appendChild(probe);
        const measureWord = (size: number) => {
          element.style.fontSize = `${size}px`;
          let widest = 1;
          for (const word of words) {
            probe.textContent = word;
            widest = Math.max(widest, probe.offsetWidth);
          }
          return widest;
        };

        const maxLines = options.maxLines ?? (available <= 560 ? 3 : 2);
        const byWord = fitMeasuredWidth(
          base * ((available * 0.985) / measureWord(base)), wrapMax, available * 0.985, measureWord,
        );
        const byTotal = fitMeasuredWidth(
          base * ((available * maxLines * 0.72) / textWidth), wrapMax, available * maxLines * 0.72, measureText,
        );
        probe.remove();
        fontSize = Math.max(min, Math.min(byWord, byTotal, wrapMax));
        element.style.width = "";
        element.style.whiteSpace = "normal";
        element.style.textWrap = "balance";
        element.style.lineHeight = "0.95";
        element.style.fontSize = `${fontSize.toFixed(1)}px`;

        let guard = 6;
        while (guard > 0) {
          guard -= 1;
          const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight) || fontSize;
          // Font metrics are logical CSS pixels; a scaled editor preview's visual rect is not.
          lines = Math.max(1, Math.round(element.clientHeight / lineHeight));
          if (lines <= maxLines || fontSize <= min) break;
          fontSize = Math.max(min, fontSize * Math.max(0.7, maxLines / lines));
          element.style.fontSize = `${fontSize.toFixed(1)}px`;
        }
      }

      element.style.width = "";
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
