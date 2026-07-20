import type { SectionEntry, ReviewsConfig } from "../../../../../types";
import { displayFontFor } from "../../../theme";
import { aggregateReviews } from "../../shared/util";
import { Section, Placeholder } from "../../shared/primitives";
import type { PreviewData, T } from "../../shared/types";
import { Wall } from "./variants/Wall";
import { Showcase } from "./variants/Showcase";
import { Marquee } from "./variants/Marquee";
import { Spotlight } from "./variants/Spotlight";
import { Deck } from "./variants/Deck";
import { RvHead } from "./parts/RvHead";
import { RvSummary } from "./parts/RvSummary";
import type { ReviewsViewProps } from "./types";
import "./base.css";

// Rating summary + real per-star distribution, then the chosen layout's "voices", mirroring the source
// `SecReviews`. Score + bars are real stats (aggregate rating/count + ratingDistribution). The orchestrator
// owns data prep, the empty state and the section wrapper; each variant owns its own head + its own
// rating-summary form + its voices, so no two variants open the same way.

// Layout registry — Wall is the included/free base; the four others are paid catalog variants. Catalog key
// `default` renders the Showcase design (kept as-is to avoid remapping stored layouts). An unentitled/
// unknown variant falls back to the base. Add a variant by adding its component + a catalog entry.
const VARIANTS: Record<string, React.FC<ReviewsViewProps>> = {
  wall: Wall,
  default: Showcase,
  marquee: Marquee,
  spotlight: Spotlight,
  deck: Deck,
};

// Per-layout quote budget (mirrors the source's per-variant slice): the wall/marquee read best fuller; the
// showcase/spotlight/deck step through a tighter set.
const QUOTE_LIMIT: Record<string, number> = {
  wall: 9,
  default: 8,
  marquee: 12,
  spotlight: 6,
  deck: 6,
};

/** Wall is the included base — an unentitled/unknown variant renders it. */
function normalizeReviewsStyle(variant: string): keyof typeof VARIANTS {
  return Object.hasOwn(VARIANTS, variant) ? (variant as keyof typeof VARIANTS) : "wall";
}

export function Reviews({ entry, data, t, no }: { entry: SectionEntry; data: PreviewData; t: T; no: string }) {
  const cfg = (entry.config ?? {}) as ReviewsConfig;
  const { rating, count } = aggregateReviews(data.locations);
  const variant = normalizeReviewsStyle(entry.variant);
  const quotes = (data.reviews ?? []).filter((q) => q.comment.trim()).slice(0, QUOTE_LIMIT[variant] ?? 8);
  const italic = displayFontFor(data.fontKey).italicOk;
  const showHeading = cfg.headingHidden?.[data.locale] !== true;
  const heading = cfg.heading?.[data.locale]?.trim() || t("businessPage.builder.preview.reviewsHeading");
  const kicker = t("businessPage.builder.preview.kicker.reviews");

  // Real per-star distribution → the showcase histogram. Hidden when absent / empty / toggled off.
  const dist = data.ratingDistribution;
  const distTotal = dist ? dist["5"] + dist["4"] + dist["3"] + dist["2"] + dist["1"] : 0;
  const showDist = !cfg.hideDistribution && !!dist && distTotal > 0;

  if (count === 0 && quotes.length === 0) {
    return (
      <Section soft>
        <Placeholder>{t("businessPage.builder.preview.testimonialsEmpty")}</Placeholder>
      </Section>
    );
  }

  const View = VARIANTS[variant];
  return (
    <div className="mc-reviews" data-reviews={variant}>
      <Section soft>
        {!showHeading ? <h2 className="sr-only">{t("businessPage.builder.preview.reviewsHeading")}</h2> : null}
        {quotes.length === 0 ? (
          <>
            <RvHead
              no={no}
              kicker={kicker}
              heading={heading}
              showHeading={showHeading}
            />
            <RvSummary
              t={t}
              rating={rating}
              count={count}
              dist={dist}
              distTotal={distTotal}
              showDist={showDist}
            />
          </>
        ) : (
          <View
            quotes={quotes}
            rating={rating}
            count={count}
            dist={dist}
            distTotal={distTotal}
            showDist={showDist}
            showHeading={showHeading}
            heading={heading}
            kicker={kicker}
            no={no}
            italic={italic}
            businessName={data.businessName}
            t={t}
          />
        )}
      </Section>
    </div>
  );
}
