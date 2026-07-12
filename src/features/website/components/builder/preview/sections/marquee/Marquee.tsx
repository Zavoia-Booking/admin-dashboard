import type { SectionEntry, LocationWithAssignments } from "../../../../../types";
import { displayFontFor } from "../../../theme";
import type { PreviewData } from "../../shared/types";
import { Default } from "./variants/Default";
import type { MarqueeVariantProps } from "./types";
import "./marquee.css";

/** Fewest items the marquee needs to read as an intentional band rather than a stray label or two. Below
 *  this the section is pointless, so the builder hides it entirely (see SectionBuilder) and it self-hides on
 *  render — both gate on `marqueeItems` so they can never disagree. */
export const MARQUEE_MIN_ITEMS = 3;

/** The strip's content for a business: the specific offerings (deduped service names), falling back to the
 *  broader categories when only a couple of services are listed, capped so a service-heavy menu stays calm. */
export function marqueeItems(locations: LocationWithAssignments[]): string[] {
  const svcSeen = new Set<string>();
  const services: string[] = [];
  const catSeen = new Set<string>();
  const categories: string[] = [];
  for (const l of locations) {
    for (const s of l.services ?? []) {
      const name = s.name?.trim();
      if (name && !svcSeen.has(name.toLowerCase())) {
        svcSeen.add(name.toLowerCase());
        services.push(name);
      }
      const cat = s.category?.name?.trim();
      if (cat && !catSeen.has(cat.toLowerCase())) {
        catSeen.add(cat.toLowerCase());
        categories.push(cat);
      }
    }
  }
  return (services.length >= MARQUEE_MIN_ITEMS ? services : categories).slice(0, 16);
}

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
