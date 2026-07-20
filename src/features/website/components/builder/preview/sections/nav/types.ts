import type { Ref } from "react";
import type { SectionEntry } from "../../../../../types";
import type { PreviewData, T } from "../../shared/types";

/** Contract the Nav layout variant renders against — the full set of chrome inputs LivePreview computes
 *  (frost progress, over-hero state, sticky-wrapper ownership, and the shared element ref). */
export type NavVariantProps = {
  data: PreviewData;
  layout: SectionEntry[];
  t: T;
  overHero: boolean;
  /** Ink tone the nav renders in while floating over the hero (before it frosts): dark heroes take light
   *  chrome; paper heroes (Portal · Tumble) take dark ink. Defaults to "dark". */
  overHeroTone?: "light" | "dark";
  /** Over a drenched (accent-coloured) hero, frost the CTA white→accent so it doesn't blend into the field. */
  ctaFrost?: boolean;
  progress: number;
  navRef: Ref<HTMLElement>;
  /** False when wrapped in the announcement+nav sticky group (the wrapper owns the sticky). */
  sticky?: boolean;
};
