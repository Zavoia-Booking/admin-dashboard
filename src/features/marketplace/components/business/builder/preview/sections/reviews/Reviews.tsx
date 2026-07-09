import type { SectionEntry, ReviewsConfig } from "../../../../../../types";
import { displayFontFor } from "../../../theme";
import { aggregateReviews } from "../../shared/util";
import { Section, Kicker, Placeholder, SectionHead } from "../../shared/primitives";
import type { PreviewData, T } from "../../shared/types";
import { RvSummary } from "./parts/RvSummary";
import { Default } from "./variants/Default";
import { Wall } from "./variants/Wall";
import { Marquee } from "./variants/Marquee";
import { Spotlight } from "./variants/Spotlight";
import { Deck } from "./variants/Deck";
import type { ReviewsVariantProps } from "./types";
import "./reviews.css";

// Rating summary + real per-star distribution bars, then the chosen layout's "voices", mirroring the source
// `SecReviews`. Score + bars are real stats (aggregate rating/count + ratingDistribution). The orchestrator
// owns the section head + the (constant) rating summary; each variant under variants/ renders only its quote
// presentation over shared parts/ (showcase, slide, distribution row, summary).

// Layout registry — add a variant by adding its component file + a catalog entry (sectionCatalog). An
// unentitled/unknown variant falls back to the free default.
const VARIANTS: Record<string, React.FC<ReviewsVariantProps>> = {
  default: Default,
  wall: Wall,
  marquee: Marquee,
  spotlight: Spotlight,
  deck: Deck,
};

// Per-layout quote budget (mirrors the source's per-variant slice): the wall/marquee read best fuller; the
// showcase/spotlight/deck step through a tighter set.
const QUOTE_LIMIT: Record<string, number> = {
  default: 8,
  wall: 9,
  marquee: 12,
  spotlight: 6,
  deck: 6,
};

export function Reviews({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  const cfg = (entry.config ?? {}) as ReviewsConfig;
  const { rating, count } = aggregateReviews(data.locations);
  const variant = Object.hasOwn(VARIANTS, entry.variant) ? entry.variant : "default";
  const quotes = (data.reviews ?? []).filter((q) => q.comment.trim()).slice(0, QUOTE_LIMIT[variant] ?? 8);
  const italic = displayFontFor(data.fontKey).italicOk;
  const heading = cfg.heading?.[data.locale]?.trim() || t("businessPage.builder.preview.reviewsHeading");
  const sublede = cfg.sublede?.[data.locale]?.trim() || t("businessPage.builder.preview.reviewsSublede");

  if (count === 0 && quotes.length === 0) {
    return (
      <Section soft>
        <Kicker no={no}>{t("businessPage.builder.preview.kicker.reviews")}</Kicker>
        <Placeholder>{t("businessPage.builder.preview.testimonialsEmpty")}</Placeholder>
      </Section>
    );
  }

  // Real per-star distribution → pct per row (5 → 1). Hidden when absent / empty / toggled off.
  const dist = data.ratingDistribution;
  const distTotal = dist ? dist["5"] + dist["4"] + dist["3"] + dist["2"] + dist["1"] : 0;
  const showDist = !cfg.hideDistribution && !!dist && distTotal > 0;

  const View = VARIANTS[variant];
  return (
    <Section soft>
      <SectionHead no={no} kicker={t("businessPage.builder.preview.kicker.reviews")} heading={heading} sublede={sublede} stacked />
      {count > 0 && <RvSummary t={t} rating={rating} count={count} dist={dist} distTotal={distTotal} showDist={showDist} />}
      {quotes.length > 0 && <View quotes={quotes} italic={italic} t={t} />}
    </Section>
  );
}
