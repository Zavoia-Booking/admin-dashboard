import type { LocationWithAssignments, HeroConfig } from "../../../../../types";

/** Localized string accessor with EN→RO fallback; empty string when the value is absent. */
export const localized = (v: { en: string; ro: string } | undefined, locale: "en" | "ro") =>
  (v ? v[locale] || v.en || v.ro : "") || "";

/** Weighted average rating + total count across rated locations (mirrors the microsite aggregate). */
export function aggregateReviews(locations: LocationWithAssignments[]) {
  const rated = locations.filter((l) => (l.totalReviews ?? 0) > 0);
  const count = rated.reduce((s, l) => s + (l.totalReviews ?? 0), 0);
  const rating =
    count > 0 ? rated.reduce((s, l) => s + (l.averageRating ?? 0) * (l.totalReviews ?? 0), 0) / count : 0;
  return { rating, count };
}

export type HeroMode = "cinematic" | "coverPlate" | "drenched";
/** Resolve the hero's render mode from its cover photo + the cover-layout toggle. No cover ⇒ the hero
 *  floods with the brand accent (the drenched field). With a cover, the owner's `coverLayout` picks the
 *  full-bleed cinematic cover or the "cover plate" (tall photo bleed + paper card). Shared with the nav:
 *  every cover/accent hero floats the frosted bar; only an announcement ribbon forces the solid paper nav. */
export function heroMode(cfg: HeroConfig, hasImage: boolean): HeroMode {
  if (!hasImage) return "drenched";
  return cfg.coverLayout === "plate" ? "coverPlate" : "cinematic";
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** First scrollable ancestor of `el` (walking up from its parent), or null if none. The preview rides the
 *  dialog's scroller: the nav-frost, the marquee scroll-glide, and the footer reveal all find it this way. */
export function findScrollParent(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement;
  while (node) {
    const oy = getComputedStyle(node).overflowY;
    if (oy === "auto" || oy === "scroll") return node;
    node = node.parentElement;
  }
  return null;
}
