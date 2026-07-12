import type { SectionEntry } from "../../../../../types";
import type { PreviewData, T } from "../../shared/types";
import { Default } from "./variants/Default";
import type { InterludeVariantProps } from "./types";

// Interlude — a cinematic full-bleed photo break; self-hides if the business has no photos. Single layout,
// so the orchestrator owns the photo guard and dispatches to the one variant.

// Layout registry — add a variant by adding its component file + a catalog entry (sectionCatalog). The
// resolver below maps the saved variant to its component, falling back to the default layout.
const VARIANTS: Record<string, React.FC<InterludeVariantProps>> = {
  default: Default,
};

export function Interlude({ entry, data, t }: { entry: SectionEntry; data: PreviewData; t: T }) {
  const images = data.locations.flatMap((l) => l.portfolioImages?.map((p) => p.url) ?? []);
  if (images.length === 0) return null;

  // Variant resolver — renderer seam for future paid variants: a not-entitled variant falls back to the free default here.
  const View = Object.hasOwn(VARIANTS, entry.variant) ? VARIANTS[entry.variant] : Default;
  return <View images={images} data={data} t={t} />;
}
