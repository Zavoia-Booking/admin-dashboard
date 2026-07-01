import type { SectionEntry } from "../../../../../../types";
import { localized } from "../../shared/util";
import type { PreviewData, T } from "../../shared/types";
import { Default } from "./variants/Default";
import type { AnnouncementVariantProps } from "./types";

// Announcement — the sticky ribbon pinned above the nav (single "bar" layout). The orchestrator owns the
// localized content prep, the empty/sample resolution, and the hidden-when-empty guard; the one variant
// renders the ribbon. Exported as `AnnouncementBar` (the name the orchestrator/Microsite imports).

// Layout registry — add a variant by adding its component file + a catalog entry (sectionCatalog). The
// resolver below maps the saved variant to its component, falling back to the default layout.
const VARIANTS: Record<string, React.FC<AnnouncementVariantProps>> = {
  default: Default,
};

export function AnnouncementBar({ entry, data, t, sample = false }: { entry: SectionEntry; data: PreviewData; t: T; sample?: boolean }) {
  const realMsg = localized(data.announcement.message, data.locale);
  const cta = data.announcement.cta;
  const realCtaLabel = localized(cta.label, data.locale);
  const isEmpty = !realMsg.trim();

  // Live behaviour: an empty bar isn't shown. In the per-section editor preview we instead render a
  // muted SAMPLE so the owner can see how the bar will look — a suggestion, not their real content.
  if (isEmpty && !sample) return null;

  const msg = isEmpty ? t("businessPage.builder.announcement.sampleMessage") : realMsg;
  const ctaLabel = isEmpty ? t("businessPage.builder.announcement.sampleCta") : realCtaLabel;
  const showCta = isEmpty || (cta.enabled && realCtaLabel.trim().length > 0);
  const showArrow = isEmpty ? true : cta.showArrow;

  // Variant resolver — renderer seam for future paid variants: a not-entitled variant falls back to the free default here.
  const View = Object.hasOwn(VARIANTS, entry.variant) ? VARIANTS[entry.variant] : Default;
  return <View msg={msg} ctaLabel={ctaLabel} showCta={showCta} showArrow={showArrow} isEmpty={isEmpty} />;
}
