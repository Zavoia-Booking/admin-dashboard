import { useLayoutEffect } from "react";

/** Fit a single-line wordmark edge-to-edge: measure its natural width at a reference size and scale the font
 *  so the text spans its padded column (mirrors the source footer's fit-to-width closing name). Shared by the
 *  editorial default's closing wordmark and the poster variant's centred name. `dep` re-runs the fit when the
 *  text changes (and an empty `dep` — e.g. the wordmark is hidden — is a harmless no-op: the ref is unattached
 *  so the effect bails). */
export function useFitText(ref: React.RefObject<HTMLElement | null>, dep: string) {
  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const fit = () => {
      el.style.fontSize = "100px";
      const avail = parent.clientWidth;
      const textW = el.scrollWidth;
      if (!avail || !textW) return;
      el.style.fontSize = `${Math.max(34, Math.min((100 * avail) / textW, 240)).toFixed(1)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [ref, dep]);
}
