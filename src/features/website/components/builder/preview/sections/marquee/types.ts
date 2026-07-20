import type { StripSeparatorStyle } from "../../../../../types";

/** Contract each Strip variant renders against — the orchestrator owns the deduped offering sequence,
 *  type-personality decision and the min-items guard. `scrollDriven` is true only in the full-page preview,
 *  where Scroll couples to the preview's own scroller; the scoped card remains still. */
export type MarqueeVariantProps = {
  items: string[];
  scrollDriven: boolean;
  italic: boolean;
  separatorStyle: StripSeparatorStyle;
  separatorSize: number;
  textSize: number;
  useBrandColorBackground: boolean;
};
