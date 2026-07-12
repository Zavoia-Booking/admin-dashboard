import { FaqAccordion } from "../parts/FaqAccordion";
import type { FaqVariantProps } from "../types";

/** Default — the interactive single-open accordion (mirrors the source `SecFAQ`); `list` renders every
 *  answer expanded. Both are the shared `FaqAccordion` part (unnumbered here; split numbers it). */
export function Default({ items, list, locale }: FaqVariantProps) {
  return <FaqAccordion items={items} locale={locale} list={list} />;
}
