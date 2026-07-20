import type { SectionEntry } from "../../../../../types";
import { displayFontFor } from "../../../theme";
import type { PreviewData } from "../../shared/types";
import { Loop } from "./variants/Loop";
import { Scroll } from "./variants/Scroll";
import type { MarqueeVariantProps } from "./types";
import { marqueeItems, MARQUEE_MIN_ITEMS } from "./model";
import {
  normalizeStripSeparatorStyle,
  normalizeStripSeparatorSize,
  normalizeStripTextSize,
} from "../../../stripSeparator";
import "./marquee.css";

// Kinetic Strip of the services a business offers, in two separately implemented motion styles. `scroll`
// moves only with page scroll position; `loop` is the separate continuous automatic pass.
// The orchestrator owns content prep, the min-items guard and font-personality resolution. Each layout keeps
// its own component, motion engine and CSS under variants/.

// Persisted-layout registry. Unknown legacy values fall back safely to the source `scroll` treatment.
const VARIANTS: Record<string, React.FC<MarqueeVariantProps>> = {
  scroll: Scroll,
  loop: Loop,
};

export function Marquee({ entry, data, chrome }: { entry: SectionEntry; data: PreviewData; chrome: boolean }) {
  const items = marqueeItems(data.locations);
  if (items.length < MARQUEE_MIN_ITEMS) return null;

  const italic = displayFontFor(data.fontKey).italicOk;
  const separatorStyle = normalizeStripSeparatorStyle(entry.config?.separatorStyle);
  const separatorSize = normalizeStripSeparatorSize(entry.config?.separatorSize);
  const textSize = normalizeStripTextSize(entry.config?.textSize);
  const useBrandColorBackground = entry.config?.useBrandColorBackground === true;
  const View = Object.hasOwn(VARIANTS, entry.variant) ? VARIANTS[entry.variant] : Scroll;
  return (
    <View
      items={items}
      scrollDriven={chrome}
      italic={italic}
      separatorStyle={separatorStyle}
      separatorSize={separatorSize}
      textSize={textSize}
      useBrandColorBackground={useBrandColorBackground}
    />
  );
}
