import type { SectionEntry } from "../../../../../../types";
import { Section } from "../../shared/primitives";
import type { PreviewData, T } from "../../shared/types";
import { Default } from "./variants/Default";
import type { AboutVariantProps } from "./types";

// About — the serif lede + muted body, split on the first blank line. Single editorial layout (About has no
// image of its own), so the orchestrator owns the <Section> wrapper and dispatches to the one variant.

// Layout registry — add a variant by adding its component file + a catalog entry (sectionCatalog). The
// resolver below maps the saved variant to its component, falling back to the default layout.
const VARIANTS: Record<string, React.FC<AboutVariantProps>> = {
  simple: Default,
};

export function About({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  // Variant resolver — renderer seam for future paid variants: a not-entitled variant falls back to the free default here.
  const View = Object.hasOwn(VARIANTS, entry.variant) ? VARIANTS[entry.variant] : Default;
  return (
    <Section>
      <View data={data} t={t} no={no} />
    </Section>
  );
}
