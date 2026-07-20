import { useLayoutEffect, type RefObject } from "react";
import { findScrollParent, prefersReducedMotion } from "../../shared/util";

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (value: number) => 1 - Math.pow(1 - value, 3);

function previewViewport(scroller: HTMLElement | null) {
  if (!scroller) {
    return { top: 0, height: window.innerHeight };
  }
  const rect = scroller.getBoundingClientRect();
  return { top: rect.top, height: rect.height };
}

/**
 * Source-faithful Reveal/SplitReveal motion, adapted to the builder's element scroller. There is no clock
 * and no artificial delay: each element advances from 38px/transparent to rest as its top travels from
 * 94% to 64% of the preview viewport; title words follow the source's progress-window staggering.
 */
export function useFaqMotion(
  rootRef: RefObject<HTMLElement | null>,
  titleRef: RefObject<HTMLHeadingElement | null>,
  dependency: string,
) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const title = titleRef.current;
    const words = title
      ? Array.from(title.querySelectorAll<HTMLElement>("[data-faq-word]"))
      : [];
    const revealNodes = Array.from(root.querySelectorAll<HTMLElement>("[data-faq-reveal]"));
    const clearReveal = (element: HTMLElement) => {
      element.style.opacity = "";
      element.style.transform = "";
      element.style.willChange = "";
    };
    const clearWords = () => {
      words.forEach((word) => {
        word.style.transform = "none";
        word.style.willChange = "";
      });
    };

    if (prefersReducedMotion()) {
      revealNodes.forEach(clearReveal);
      clearWords();
      return;
    }

    const scroller = findScrollParent(root);
    const thresholds = () => {
      const viewport = previewViewport(scroller);
      return {
        start: viewport.top + viewport.height * 0.94,
        end: viewport.top + viewport.height * 0.64,
      };
    };
    const revealStates = revealNodes.map((element) => {
      const { start } = thresholds();
      const done = element.getBoundingClientRect().top < start;
      if (!done) {
        element.style.opacity = "0";
        element.style.transform = "translateY(38px)";
        element.style.willChange = "opacity, transform";
      }
      return { element, done };
    });

    const count = words.length || 1;
    const segment = Math.min(0.5, 0.55 / count);
    const denominator = 1 - (count - 1) * segment || 1;
    const applyWords = (progress: number) => {
      words.forEach((word, index) => {
        const local = clamp((progress - index * segment) / denominator);
        word.style.transform = `translateY(${(118 * (1 - easeOut(local))).toFixed(2)}%)`;
        word.style.willChange = "transform";
      });
    };
    let titleDone = !title;
    if (title) {
      const { start } = thresholds();
      if (title.getBoundingClientRect().top >= start) applyWords(0);
      else titleDone = true;
    }

    const update = () => {
      const { start, end } = thresholds();
      const distance = Math.max(1, start - end);

      if (title && !titleDone) {
        const progress = clamp((start - title.getBoundingClientRect().top) / distance);
        applyWords(progress);
        if (progress >= 1) {
          clearWords();
          titleDone = true;
        }
      }

      revealStates.forEach((state) => {
        if (state.done) return;
        const progress = clamp((start - state.element.getBoundingClientRect().top) / distance);
        const eased = easeOut(progress);
        state.element.style.opacity = eased.toFixed(3);
        state.element.style.transform = `translateY(${(38 * (1 - eased)).toFixed(2)}px)`;
        if (progress >= 1) {
          clearReveal(state.element);
          state.done = true;
        }
      });
    };

    update();
    if (scroller) scroller.addEventListener("scroll", update, { passive: true });
    else window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    resizeObserver?.observe(root);
    if (scroller) resizeObserver?.observe(scroller);

    return () => {
      if (scroller) scroller.removeEventListener("scroll", update);
      else window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      resizeObserver?.disconnect();
      revealNodes.forEach(clearReveal);
      clearWords();
    };
  }, [dependency, rootRef, titleRef]);
}
