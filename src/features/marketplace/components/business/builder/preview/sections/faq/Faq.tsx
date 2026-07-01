import type { SectionEntry } from "../../../../../../types";
import { localized } from "../../shared/util";
import { Section, SectionHead, Placeholder } from "../../shared/primitives";
import type { PreviewData, T } from "../../shared/types";
import { Default } from "./variants/Default";
import type { FaqVariantProps } from "./types";

// FAQ — an interactive single-open accordion (default) or an all-expanded list. The orchestrator owns the
// section head, the empty state, and the localized item filtering + variant flag; the layout renders under
// variants/ (today one component serves both catalog variants, branching on `list`).

// Layout registry — add a variant by adding its component file + a catalog entry (sectionCatalog). The
// resolver below maps the saved variant to its component, falling back to the default layout.
const VARIANTS: Record<string, React.FC<FaqVariantProps>> = {
  accordion: Default,
  list: Default,
};

export function Faq({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  const items = data.faq.filter((f) => localized(f.q, data.locale).trim());
  const list = entry.variant === "list";

  // Variant resolver — renderer seam for future paid variants: a not-entitled variant falls back to the free default here.
  const View = Object.hasOwn(VARIANTS, entry.variant) ? VARIANTS[entry.variant] : Default;
  return (
    <Section narrow>
      <SectionHead
        no={no}
        kicker={t("businessPage.builder.preview.kicker.faq")}
        heading={t("businessPage.builder.preview.subhead.faq")}
      />
      {items.length === 0 ? (
        <Placeholder>{t("businessPage.builder.preview.faqEmpty")}</Placeholder>
      ) : (
        <View items={items} list={list} locale={data.locale} />
      )}
    </Section>
  );
}
