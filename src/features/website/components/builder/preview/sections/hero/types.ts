import type { SectionEntry } from "../../../../../types";
import type { PreviewData, T } from "../../shared/types";

/** Section render props for Hero (note: `parallax`, not `no`). Every variant component takes these.
 *  `atRest`: hold the hero still (no self-running motion, layers un-promoted) — the phone's scaled-down
 *  desktop mock; scroll-jack/parallax variants read `parallax` (already false there). */
export type HeroVariantProps = { entry: SectionEntry; data: PreviewData; t: T; parallax: boolean; atRest?: boolean };

/** Shared content bundle every variant derives from its props (see parts/content.tsx#deriveHeroContent). */
export interface HeroContent {
  name: string;
  tagline: string;
  eyebrow: string;
  eyebrowDot: React.ReactNode;
  monogram: string;
  rating: number;
  count: number;
  showRating: boolean;
  ctaLabel: string;
}

/** What the free base's mode parts (CoverPlate / Drenched) render against: the content bundle plus the
 *  render context + refs the Default variant owns. */
export type HeroModeProps = HeroContent & {
  data: PreviewData;
  t: T;
  parallax: boolean;
  headerRef: React.RefObject<HTMLElement | null>;
  parallaxRef: React.RefObject<HTMLDivElement | null>;
};
