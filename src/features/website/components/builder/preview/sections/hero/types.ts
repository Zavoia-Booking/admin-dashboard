import type { SectionEntry } from "../../../../../types";
import type { PreviewData, T } from "../../shared/types";

/** Section render props for Hero (note: `parallax`, not `no`). Every variant component takes these. */
export type HeroVariantProps = { entry: SectionEntry; data: PreviewData; t: T; parallax: boolean };

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

/** What the free base's Drenched treatment renders against: content plus the Default variant's refs. */
export type HeroModeProps = HeroContent & {
  data: PreviewData;
  t: T;
  parallax: boolean;
  headerRef: React.RefObject<HTMLElement | null>;
  parallaxRef: React.RefObject<HTMLDivElement | null>;
};
