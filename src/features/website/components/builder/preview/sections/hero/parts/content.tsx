import type { HeroConfig } from "../../../../../../types";
import { defaultHeroEyebrow } from "../../../../heroEyebrow";
import { aggregateReviews } from "../../../shared/util";
import type { HeroContent, HeroVariantProps } from "../types";

/** Two-letter brand monogram from the business name (first + last word, or first two letters of one word). */
function monogramOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function deriveHeroContent({ entry, data, t }: HeroVariantProps): HeroContent {
  const cfg = (entry.config ?? {}) as HeroConfig;
  const { rating, count } = aggregateReviews(data.locations);
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const inheritedEyebrow = defaultHeroEyebrow(data.locations, t);
  const eyebrow = cfg.showEyebrow === false
    ? ""
    : cfg.eyebrow?.[data.locale]?.trim() || inheritedEyebrow;

  return {
    name,
    tagline: data.tagline,
    eyebrow,
    eyebrowDot: <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />,
    monogram: monogramOf(name),
    rating,
    count,
    showRating: count > 0 && cfg.showRating !== false,
    // Booking button copy is fixed (not owner-editable); the button always opens the booking flow.
    ctaLabel: t("businessPage.builder.preview.bookNow"),
  };
}
