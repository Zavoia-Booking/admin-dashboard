import type { CSSProperties } from "react";
import { X } from "lucide-react";
import type { SectionEntry, AnnouncementConfig } from "../../../../../../types";
import { localized } from "../../shared/util";
import { displayFontFor } from "../../../theme";
import type { PreviewData, T } from "../../shared/types";
import { Default } from "./variants/Default";
import { Split } from "./variants/Split";
import type { AnnouncementInnerProps } from "./types";
import "./announcement.css";

// Announcement — the sticky ribbon pinned above the nav. Two axes: a layout (`bar`/`hairline` share the
// ribbon body; `split` pushes the CTA right) and a tone (neutral/offer/alert, layered via CSS). The
// orchestrator owns the localized content prep, the empty/sample resolution, the hidden-when-empty guard,
// the `.mc-anno` root (tone + layout modifier) and the trailing dismiss affordance; the variant renders the
// body. Exported as `AnnouncementBar` (the name Microsite imports).

// Layout registry — add a variant by adding its component + a catalog entry (sectionCatalog). `hairline`
// reuses the ribbon body; a not-entitled/unknown id falls back to the default (`bar`) body.
const VARIANTS: Record<string, React.FC<AnnouncementInnerProps>> = {
  bar: Default,
  hairline: Default,
  split: Split,
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
  const countdownEnd = isEmpty ? null : (data.announcement.schedule?.end ?? null);

  // Layout from the saved variant (unknown/unentitled → base `bar`). Tone is a separate axis — the CSS is
  // ready for offer/alert; until the owner-facing control lands it stays neutral.
  const variant = Object.hasOwn(VARIANTS, entry.variant) ? entry.variant : "bar";
  const Inner = VARIANTS[variant];
  // Tone is a separate axis (config, not variant) so it composes with any layout; unknown/absent → neutral.
  const rawTone = (entry.config as AnnouncementConfig | undefined)?.tone;
  const tone = rawTone === "offer" || rawTone === "alert" ? rawTone : "neutral";
  // Hairline sets the message in the display face; italic reads well only in the serif personalities.
  const italic = displayFontFor(data.fontKey).italicOk;

  const className = ["mc-anno", `mc-anno--${tone}`, `mc-anno--lay-${variant}`, isEmpty && "opacity-60"]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} style={{ "--mc-anno-italic": italic ? "italic" : "normal" } as CSSProperties} role="region" aria-label="Announcement">
      <Inner msg={msg} ctaLabel={ctaLabel} showCta={showCta} showArrow={showArrow} countdownEnd={countdownEnd} t={t} />
      {/* Decorative in the preview; the live page wires it to dismissal. */}
      <span className="mc-anno-x" aria-hidden>
        <X className="h-3.5 w-3.5" strokeWidth={1.75} />
      </span>
    </div>
  );
}
