import type { WebsiteBuilderLocation } from "../../../../types";

/** Localized string accessor with EN→RO fallback; empty string when the value is absent. */
export const localized = (v: { en: string; ro: string } | undefined, locale: "en" | "ro") =>
  (v ? v[locale] || v.en || v.ro : "") || "";

/** Weighted average rating + total count across rated locations (mirrors the microsite aggregate). */
export function aggregateReviews(locations: WebsiteBuilderLocation[]) {
  const rated = locations.filter((l) => (l.totalReviews ?? 0) > 0);
  const count = rated.reduce((s, l) => s + (l.totalReviews ?? 0), 0);
  const rating =
    count > 0 ? rated.reduce((s, l) => s + (l.averageRating ?? 0) * (l.totalReviews ?? 0), 0) / count : 0;
  return { rating, count };
}

/** A review's ISO timestamp → a short "Mon YYYY" label (visitor locale); empty on an unparseable date.
 *  Shared by the reviews showcase slide + the wall/deck cards. */
export function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export type HeroMode = "coverPlate" | "drenched";
/** Free base hero resolution from the cover photo alone: no cover ⇒ the drenched accent field; a cover ⇒
 *  the text-panel cover plate. Full-bleed cinematic is now a separate paid variant, not a free mode. */
export function heroMode(hasImage: boolean): HeroMode {
  return hasImage ? "coverPlate" : "drenched";
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
