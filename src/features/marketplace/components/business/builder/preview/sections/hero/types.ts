import type { SectionEntry } from "../../../../../../types";
import type { PreviewData, T } from "../../shared/types";

/** Section render props for Hero (note: `parallax`, not `no`). */
export type HeroVariantProps = { entry: SectionEntry; data: PreviewData; t: T; parallax: boolean };

/** Computed bundle the default variant passes down to whichever hero mode it renders
 *  (cinematic / coverPlate / drenched). */
export type HeroModeProps = {
  data: PreviewData;
  t: T;
  parallax: boolean;
  name: string;
  eyebrow: string;
  eyebrowDot: React.ReactNode;
  monogram: string;
  rating: number;
  count: number;
  showRating: boolean;
  ctaLabel: string;
  headerRef: React.RefObject<HTMLElement | null>;
  parallaxRef: React.RefObject<HTMLDivElement | null>;
};
