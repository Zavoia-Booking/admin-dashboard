import { useLayoutEffect, type RefObject } from "react";
import { findScrollParent } from "../../shared/util";
import { useReducedMotion } from "../../shared/hooks";

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
  const reduced = useReducedMotion();
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

    if (reduced) {
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
    // Read the initial geometry together before applying any reveal transforms.
    const { start: initialStart } = thresholds();
    const initialTitleTop = title?.getBoundingClientRect().top;
    const revealStates = revealNodes.map((element) => ({
      element,
      done: element.getBoundingClientRect().top < initialStart,
    }));
    revealStates.forEach(({ element, done }) => {
      if (done) return;
      element.style.opacity = "0";
      element.style.transform = "translateY(38px)";
      element.style.willChange = "opacity, transform";
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
    let titleDone = initialTitleTop === undefined || initialTitleTop < initialStart;
    if (!titleDone) applyWords(0);

    let frame = 0;
    let resizeObserver: ResizeObserver | null = null;
    const queueUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const detach = () => {
      if (scroller) scroller.removeEventListener("scroll", queueUpdate);
      else window.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
      resizeObserver?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
    const update = () => {
      frame = 0;
      const { start, end } = thresholds();
      const distance = Math.max(1, start - end);
      // Keep layout reads before all style writes, once per frame even when scroll/resize coalesce.
      const titleProgress = title && !titleDone
        ? clamp((start - title.getBoundingClientRect().top) / distance)
        : null;
      const pending = revealStates.filter((state) => !state.done).map((state) => ({
        state,
        progress: clamp((start - state.element.getBoundingClientRect().top) / distance),
      }));

      if (titleProgress !== null) {
        applyWords(titleProgress);
        if (titleProgress >= 1) {
          clearWords();
          titleDone = true;
        }
      }
      pending.forEach(({ state, progress }) => {
        if (progress >= 1) {
          clearReveal(state.element);
          state.done = true;
        } else {
          const eased = easeOut(progress);
          state.element.style.opacity = eased.toFixed(3);
          state.element.style.transform = `translateY(${(38 * (1 - eased)).toFixed(2)}px)`;
        }
      });
      // These entrances play once. Completed sections need no continuing scroll measurements.
      if (titleDone && revealStates.every((state) => state.done)) detach();
    };

    if (scroller) scroller.addEventListener("scroll", queueUpdate, { passive: true });
    else window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate, { passive: true });
    resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(queueUpdate);
    resizeObserver?.observe(root);
    if (scroller) resizeObserver?.observe(scroller);
    update();

    return () => {
      detach();
      revealNodes.forEach(clearReveal);
      clearWords();
    };
  }, [dependency, reduced, rootRef, titleRef]);
}
