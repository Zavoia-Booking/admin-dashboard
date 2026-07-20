import { useEffect, useRef, useState, type RefObject } from "react";
import { findScrollParent, prefersReducedMotion } from "../../shared/util";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function viewport(scroller: HTMLElement | null) {
  if (!scroller) {
    const height = window.innerHeight;
    return { top: 0, bottom: height, height };
  }
  const rect = scroller.getBoundingClientRect();
  return { top: rect.top, bottom: rect.bottom, height: rect.height };
}

function scrollOffset(scroller: HTMLElement | null) {
  return scroller ? scroller.scrollTop : window.scrollY;
}

function observeMotion(node: HTMLElement, update: (scroller: HTMLElement | null) => void) {
  const scroller = findScrollParent(node);
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      update(scroller);
    });
  };
  if (scroller) scroller.addEventListener("scroll", schedule, { passive: true });
  else window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
  resizeObserver?.observe(node);
  if (scroller) resizeObserver?.observe(scroller);
  schedule();
  return () => {
    if (scroller) scroller.removeEventListener("scroll", schedule);
    else window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    resizeObserver?.disconnect();
    if (frame) cancelAnimationFrame(frame);
  };
}

/** One-shot design-source Reveal treatment, rooted in the builder preview scroller. */
export function useAboutReveal<T extends HTMLElement>(rootRef: RefObject<T | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-about-reveal]"));
    if (!elements.length) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      elements.forEach((element) => element.setAttribute("data-in", "true"));
      return;
    }
    const scroller = findScrollParent(root);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).setAttribute("data-in", "true");
          observer.unobserve(entry.target);
        });
      },
      { root: scroller, rootMargin: "0px 0px -6% 0px", threshold: 0.01 },
    );
    const vp = viewport(scroller);
    elements.forEach((element) => {
      if (element.getBoundingClientRect().bottom <= vp.top) element.setAttribute("data-in", "true");
      else observer.observe(element);
    });
    return () => observer.disconnect();
  });
}

/** SplitReveal: words rise through a clipped line as the statement enters the viewport. */
export function useRisingWords(ref: RefObject<HTMLElement | null>, text: string) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const words = Array.from(element.querySelectorAll<HTMLElement>("[data-about-word]"));
    if (!words.length) return;
    if (prefersReducedMotion()) {
      words.forEach((word) => {
        word.style.opacity = "1";
        word.style.transform = "none";
      });
      return;
    }
    return observeMotion(element, (scroller) => {
      const rect = element.getBoundingClientRect();
      const vp = viewport(scroller);
      const start = vp.top + vp.height * 0.94;
      const end = vp.top + vp.height * 0.64;
      const progress = clamp((start - rect.top) / Math.max(1, start - end));
      const stagger = Math.min(0.5, 0.55 / words.length);
      const available = Math.max(0.2, 1 - stagger * (words.length - 1));
      words.forEach((word, index) => {
        const local = clamp((progress - index * stagger) / available);
        const eased = 1 - Math.pow(1 - local, 3);
        word.style.opacity = local.toFixed(3);
        word.style.transform = `translate3d(0, ${(118 * (1 - eased)).toFixed(2)}%, 0)`;
      });
    });
  }, [ref, text]);
}

/** Manifesto's persistent word-by-word ink illumination. */
export function useManifestoWords(ref: RefObject<HTMLElement | null>, text: string) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const words = Array.from(element.querySelectorAll<HTMLElement>("[data-about-word]"));
    if (!words.length) return;
    if (prefersReducedMotion()) {
      words.forEach((word) => { word.style.opacity = "1"; });
      return;
    }
    return observeMotion(element, (scroller) => {
      const rect = element.getBoundingClientRect();
      const vp = viewport(scroller);
      const start = vp.top + vp.height * 0.9;
      const end = vp.top + vp.height * 0.42 - rect.height * 0.5;
      const progress = clamp((start - rect.top) / Math.max(1, start - end));
      words.forEach((word, index) => {
        const local = clamp(progress * words.length - index);
        word.style.opacity = (0.14 + 0.86 * local).toFixed(3);
      });
    });
  }, [ref, text]);
}

/** Story's reading rail and nearest-beat activation. */
export function useStoryProgress(ref: RefObject<HTMLElement | null>, beatCount: number) {
  useEffect(() => {
    const flow = ref.current;
    if (!flow) return;
    const fill = flow.querySelector<HTMLElement>("[data-about-rail-fill]");
    const beats = Array.from(flow.querySelectorAll<HTMLElement>("[data-about-beat]"));
    if (!fill || !beats.length) return;
    if (prefersReducedMotion()) {
      beats.forEach((beat) => beat.setAttribute("data-on", "true"));
      fill.style.transform = "scaleY(1)";
      return;
    }
    return observeMotion(flow, (scroller) => {
      const vp = viewport(scroller);
      const rect = flow.getBoundingClientRect();
      const gateHeight = scroller?.clientHeight ?? window.innerHeight;
      const gate = clamp(scrollOffset(scroller) / Math.max(1, gateHeight * 0.4));
      const progress = clamp((vp.top + vp.height * 0.44 - rect.top) / Math.max(1, rect.height)) * gate;
      const focusY = rect.top + progress * rect.height;
      let activeIndex = 0;
      let nearest = Number.POSITIVE_INFINITY;
      beats.forEach((beat, index) => {
        const beatRect = beat.getBoundingClientRect();
        const distance = Math.abs(beatRect.top + beatRect.height / 2 - focusY);
        if (distance < nearest) {
          nearest = distance;
          activeIndex = index;
        }
      });
      beats.forEach((beat, index) => beat.setAttribute("data-on", index === activeIndex ? "true" : "false"));
      fill.style.transform = `scaleY(${progress.toFixed(4)})`;
    });
  }, [beatCount, ref]);
}

export function useAboutParallax(ref: RefObject<HTMLElement | null>, speed = 0.05) {
  useEffect(() => {
    const frame = ref.current;
    const move = frame?.querySelector<HTMLElement>("[data-about-parallax]");
    if (!frame || !move || prefersReducedMotion()) return;
    return observeMotion(frame, (scroller) => {
      const vp = viewport(scroller);
      const rect = frame.getBoundingClientRect();
      const shift = clamp(
        (vp.top + vp.height / 2 - (rect.top + rect.height / 2)) * speed,
        -rect.height * 0.05,
        rect.height * 0.05,
      );
      move.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
    });
  }, [ref, speed]);
}

export function useAboutCounter(value: number, decimals: number, delayMs: number, raw = false) {
  const reduced = prefersReducedMotion();
  const [shown, setShown] = useState(raw || reduced ? value : 0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || raw || reduced) {
      setShown(value);
      return;
    }
    let frame = 0;
    let delay = 0;
    let startedAt = 0;
    let started = false;
    const run = (now: number) => {
      if (!startedAt) startedAt = now;
      const progress = clamp((now - startedAt) / 760);
      setShown(value * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(run);
      else setShown(value);
    };
    const start = () => {
      if (started) return;
      started = true;
      delay = window.setTimeout(() => { frame = requestAnimationFrame(run); }, delayMs);
    };
    if (typeof IntersectionObserver === "undefined") {
      start();
      return () => {
        window.clearTimeout(delay);
        if (frame) cancelAnimationFrame(frame);
      };
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          start();
          observer.disconnect();
        }
      },
      { root: findScrollParent(element), threshold: 0.2 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.clearTimeout(delay);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [delayMs, raw, reduced, value]);

  return { ref, shown: shown.toFixed(decimals) };
}
