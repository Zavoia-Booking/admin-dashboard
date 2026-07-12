import type { SectionEntry } from "../../../../../types";
import { localized } from "../../shared/util";
import { Section, SectionHead, Placeholder } from "../../shared/primitives";
import type { PreviewData, T } from "../../shared/types";
import { Default } from "./variants/Default";
import { Chips } from "./variants/Chips";
import { Grid } from "./variants/Grid";
import { Index } from "./variants/Index";
import { Split } from "./variants/Split";
import type { FaqVariantProps } from "./types";
import "./faq.css";

// FAQ — the orchestrator owns the section head, the empty state, and the localized item filtering; each
// layout renders under variants/. The single-open accordion (default) and all-expanded list still share
// one component (branching on `list`); chips/grid/index are their own files.

// Layout registry — add a variant by adding its component file + a catalog entry (sectionCatalog). The
// resolver below maps the saved variant to its component, falling back to the accordion default.
const VARIANTS: Record<string, React.FC<FaqVariantProps>> = {
  accordion: Default,
  list: Default,
  chips: Chips,
  grid: Grid,
  index: Index,
  split: Split,
};

// grid + index + split want the wide (1320px) track; accordion/list/chips (and the fallback) read best narrow (940px).
const WIDE = new Set(["grid", "index", "split"]);
// split renders the kicker + heading inside its own sticky-feel pin column, so the orchestrator yields the head to it.
const OWN_HEAD = new Set(["split"]);

export function Faq({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  const items = data.faq.filter((f) => localized(f.q, data.locale).trim());
  const list = entry.variant === "list";
  const kicker = t("businessPage.builder.preview.kicker.faq");
  const heading = t("businessPage.builder.preview.subhead.faq");

  // Variant resolver — renderer seam for future paid variants: a not-entitled variant falls back to the free default here.
  const View = Object.hasOwn(VARIANTS, entry.variant) ? VARIANTS[entry.variant] : Default;
  // Split owns its head — but only when it actually renders its two-column body. With no items the section
  // falls back to the standard head + placeholder so an empty FAQ never loses its heading.
  const ownHead = OWN_HEAD.has(entry.variant) && items.length > 0;
  return (
    <Section narrow={!WIDE.has(entry.variant)}>
      {!ownHead && <SectionHead no={no} kicker={kicker} heading={heading} />}
      {items.length === 0 ? (
        <Placeholder>{t("businessPage.builder.preview.faqEmpty")}</Placeholder>
      ) : (
        <View
          items={items}
          list={list}
          locale={data.locale}
          email={data.email}
          t={t}
          head={{ no, kicker, heading }}
        />
      )}
    </Section>
  );
}
