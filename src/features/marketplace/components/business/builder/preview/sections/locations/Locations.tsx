import { useState } from "react";
import type { SectionEntry, LocationsConfig } from "../../../../../../types";
import { Section, SectionHead, Placeholder } from "../../shared/primitives";
import type { PreviewData, T } from "../../shared/types";
import { Default } from "./variants/Default";
import type { LocationsVariantProps } from "./types";
import "./locations.css";

// Locations — an editorial location "switcher" (numbered index + compact data card + full-height photo
// plate). The orchestrator owns data prep (filtering hidden locations, the tag dictionaries, heading/sublede),
// the selected-location state, and the empty state; each layout is its own component under variants/ over
// shared parts/ (index, panel, photo, hours, tags, contact rows).

// Layout registry — add a variant by adding its component file + a catalog entry (sectionCatalog). The
// resolver below maps the saved variant to its component, falling back to the default layout.
const VARIANTS: Record<string, React.FC<LocationsVariantProps>> = {
  default: Default,
};

export function Locations({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  const hidden = new Set((entry.config?.hiddenLocationIds as number[] | undefined) ?? []);
  const shown = data.locations.filter((l) => !hidden.has(l.id));
  // Tag dictionaries (label/slug per id) arrive via PreviewData so this section stays a pure render; the
  // host (dashboard) supplies the authenticated fetch's result. Absent → the tag band doesn't render.
  const dictionaries = data.tagDictionaries ?? null;
  const [active, setActive] = useState(0);
  const idx = Math.min(active, Math.max(0, shown.length - 1));
  const loc = shown[idx];

  // Heading + sub-lede are editable per locale; a blank override falls back to the default editorial copy.
  const cfg = entry.config as LocationsConfig | undefined;
  const heading =
    cfg?.heading?.[data.locale]?.trim() ||
    t("businessPage.builder.preview.subhead.locations", { count: shown.length });
  const sublede =
    cfg?.sublede?.[data.locale]?.trim() ||
    t("businessPage.builder.preview.sublede.locations", { count: shown.length });

  // Variant resolver — renderer seam for future paid variants: a not-entitled variant falls back to the free default here.
  const View = Object.hasOwn(VARIANTS, entry.variant) ? VARIANTS[entry.variant] : Default;

  return (
    <Section soft>
      <SectionHead
        no={no}
        stacked
        kicker={t("businessPage.builder.preview.kicker.locations")}
        heading={heading}
        sublede={sublede}
      />
      {shown.length === 0 ? (
        <Placeholder>{t("businessPage.builder.preview.locationsEmpty")}</Placeholder>
      ) : (
        <View shown={shown} idx={idx} loc={loc} onSelect={setActive} dict={dictionaries} t={t} />
      )}
    </Section>
  );
}
