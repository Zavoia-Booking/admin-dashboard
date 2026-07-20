import type { PreviewData, T } from "../../shared/types";

export interface AboutMedia {
  src: string;
  alt: string;
}

/** Shared real-data contract. Each variant owns its section wrapper, layout, interaction and CSS. */
export type AboutVariantProps = {
  data: PreviewData;
  t: T;
  /** Real-data highlights are visible by default and can be hidden from the About editor. */
  showStats: boolean;
  /** One About-owned location portfolio image, selected explicitly or resolved automatically. */
  media: AboutMedia | null;
  /** Explicit draft blank state. Publishing remains blocked until the required headline is restored or replaced. */
  headlineHidden: boolean;
};
