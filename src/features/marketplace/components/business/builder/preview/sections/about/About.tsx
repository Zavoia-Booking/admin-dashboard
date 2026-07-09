import type { SectionEntry } from "../../../../../../types";
import { Section } from "../../shared/primitives";
import type { PreviewData, T } from "../../shared/types";
import { Default } from "./variants/Default";
import { Manifesto } from "./variants/Manifesto";
import { Ledger } from "./variants/Ledger";
import { Portrait } from "./variants/Portrait";
import type { AboutVariantProps } from "./types";
import "./about.css";

// About — the serif lede + muted body (split on the first blank line) closed by a band of real, derived
// stat numbers. The orchestrator owns the <Section> wrapper; each layout renders its own kicker + copy +
// stats under variants/ (editorial split = base; manifesto = centred + counter band; ledger = numbered rows).

// Layout registry — add a variant by adding its component file + a catalog entry (sectionCatalog). The
// resolver below maps the saved variant to its component, falling back to the editorial default.
const VARIANTS: Record<string, React.FC<AboutVariantProps>> = {
  simple: Default,
  manifesto: Manifesto,
  portrait: Portrait,
  ledger: Ledger,
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
