import type { SectionEntry, ReviewsConfig } from "../../../../../../types";
import { displayFontFor } from "../../../theme";
import { aggregateReviews } from "../../shared/util";
import { Section, Kicker, Placeholder } from "../../shared/primitives";
import type { PreviewData, T } from "../../shared/types";
import { Default } from "./variants/Default";
import type { ReviewsVariantProps } from "./types";
import "./reviews.css";

// Rating summary + real per-star distribution bars, then an auto-playing quote showcase, mirroring the
// source `SecReviews`. Score + bars are real stats (aggregate rating/count + ratingDistribution); the
// showcase auto-advances with a per-word rise, pausing on hover / off-screen / reduced motion. Each layout
// is its own component under variants/ over shared parts/ (showcase, slide, distribution row).

// Layout registry — add a variant by adding its component file + a catalog entry (sectionCatalog). The
// resolver below maps the saved variant to its component, falling back to the default layout.
const VARIANTS: Record<string, React.FC<ReviewsVariantProps>> = {
  default: Default,
};

export function Reviews({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  const cfg = (entry.config ?? {}) as ReviewsConfig;
  const { rating, count } = aggregateReviews(data.locations);
  const quotes = (data.reviews ?? []).filter((q) => q.comment.trim()).slice(0, 8);
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

  // Variant resolver — renderer seam for future paid variants: a not-entitled variant falls back to the free default here.
  const View = Object.hasOwn(VARIANTS, entry.variant) ? VARIANTS[entry.variant] : Default;
  return (
    <Section soft>
      <View
        no={no}
        t={t}
        heading={heading}
        sublede={sublede}
        rating={rating}
        count={count}
        quotes={quotes}
        italic={italic}
        dist={dist}
        distTotal={distTotal}
        showDist={showDist}
      />
    </Section>
  );
}
