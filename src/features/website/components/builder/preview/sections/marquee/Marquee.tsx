import type { SectionEntry } from "../../../../../types";
import { displayFontFor } from "../../../theme";
import type { PreviewData } from "../../shared/types";
import { Default } from "./variants/Default";
import type { MarqueeVariantProps } from "./types";
import { marqueeItems, MARQUEE_MIN_ITEMS } from "./model";
import "./marquee.css";

// Kinetic strip of the services a business offers, in one of two motion modes (the section's variant):
// "scroll" (default) glides the band with page scroll — the editorial source's behaviour — and "loop" runs
// an always-on auto drift. Scroll coupling needs a page to scroll, so it only applies in the full-page
// preview (chrome); in the scoped one-section card the scroll mode simply sits still. The orchestrator owns
// the content prep + the min-items guard; the layout renders under variants/.

// Layout registry — add a variant by adding its component file + a catalog entry (sectionCatalog). The
// resolver below maps the saved variant to its component, falling back to the default layout.
const VARIANTS: Record<string, React.FC<MarqueeVariantProps>> = {
  scroll: Default,
  loop: Default,
};

export function Marquee({ entry, data, chrome }: { entry: SectionEntry; data: PreviewData; chrome: boolean }) {
  const items = marqueeItems(data.locations);
  const loopMode = entry.variant === "loop";
  const scrollDriven = chrome && !loopMode;
  if (items.length < MARQUEE_MIN_ITEMS) return null;

  const italic = displayFontFor(data.fontKey).italicOk;
  // Variant resolver — renderer seam for future paid variants: a not-entitled variant falls back to the free default here.
  const View = Object.hasOwn(VARIANTS, entry.variant) ? VARIANTS[entry.variant] : Default;
  return <View items={items} loopMode={loopMode} scrollDriven={scrollDriven} italic={italic} />;
}
