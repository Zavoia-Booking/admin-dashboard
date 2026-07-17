import { BookButton } from "../../../shared/primitives";
import { HERO_DELAY } from "../constants";
import { WordRise } from "../parts/WordRise";
import { HeroRate } from "../parts/HeroRate";
import { deriveHeroContent } from "../parts/content";
import type { HeroVariantProps } from "../types";
import "./poster.css";

/** Poster — a giant stacked wordmark centred over a dark vertical light-curtain: an accent bloom rises from
 *  the foot of the frame, raked into fine vertical rays under a deep vignette + film grain. Odd lines are
 *  drawn as an accent-outline ghost. (Design source: HeroPoster.) */
export function Poster(props: HeroVariantProps) {
  const { t } = props;
  const { name, tagline, rating, count, showRating, ctaLabel } = deriveHeroContent(props);
  const words = name.trim().split(/\s+/).filter(Boolean);
  const lines = words.length <= 1 ? [words[0] || name] : [words[0], words.slice(1).join(" ")];

  return (
    <header className="mc-heropo">
      <div className="mc-heropo-bloom" aria-hidden />
      <div className="mc-heropo-rays" aria-hidden />
      <div className="mc-heropo-vignette" aria-hidden />
      <div className="mc-heropo-grain" aria-hidden />
      <div className="mc-heropo-in">
        <h1 className="mc-heropo-title" aria-label={name}>
          {lines.map((ln, i) => (
            <WordRise
              key={i}
              as="span"
              text={ln}
              base={HERO_DELAY.title + i * 90}
              step={58}
              className={"mc-heropo-line" + (i % 2 === 1 ? " is-ghost" : "")}
            />
          ))}
        </h1>
        {tagline && (
          <p className="mc-heropo-tag mc-rev-up" style={{ animationDelay: `${HERO_DELAY.tagline}ms` }}>
            {tagline}
          </p>
        )}
        <div className="mc-heropo-cta mc-rev-up" style={{ animationDelay: `${HERO_DELAY.cta}ms` }}>
          <BookButton label={ctaLabel} tone="paper" size="lg" />
          {showRating && <HeroRate rating={rating} count={count} onImg t={t} />}
        </div>
      </div>
    </header>
  );
}
