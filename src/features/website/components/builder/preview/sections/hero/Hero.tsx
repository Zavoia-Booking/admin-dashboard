import { Default } from "./variants/Default";
import type { HeroVariantProps } from "./types";
import "./hero.css";

// Hero — photo-forward cinematic cover, cover-plate, or drenched accent field (auto-selected by heroMode
// from the cover photo + cover-layout toggle), over a shared WordRise headline + cover parallax. Each mode
// is its own component under parts/; the section's single catalog layout dispatches through the registry.

// Layout registry — add a variant by adding its component file + a catalog entry (sectionCatalog). The
// resolver below maps the saved variant to its component, falling back to the default layout.
const VARIANTS: Record<string, React.FC<HeroVariantProps>> = {
  default: Default,
};

export function Hero(props: HeroVariantProps) {
  // Variant resolver — renderer seam for future paid variants: a not-entitled variant falls back to the free default here.
  const View = Object.hasOwn(VARIANTS, props.entry.variant) ? VARIANTS[props.entry.variant] : Default;
  return <View {...props} />;
}
