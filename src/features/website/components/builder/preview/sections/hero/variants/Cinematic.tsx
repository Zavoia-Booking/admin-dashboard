import { useRef } from "react";
import { DISPLAY, MONO } from "../../../shared/constants";
import { Stars, BookButton } from "../../../shared/primitives";
import { HERO_DELAY } from "../constants";
import { WordRise } from "../parts/WordRise";
import { deriveHeroContent } from "../parts/content";
import { useCoverParallax } from "../parts/useCoverParallax";
import type { HeroVariantProps } from "../types";
import "./cinematic.css";

/** Cinematic full-bleed cover — the photo-forward premium hero (design source: HeroCinematic). The cover
 *  bleeds the whole frame under a warm charcoal scrim with a bottom-left lockup. */
export function Cinematic(props: HeroVariantProps) {
  const { data, t, parallax } = props;
  const { name, tagline, eyebrow, eyebrowDot, rating, count, showRating, ctaLabel } = deriveHeroContent(props);
  const headerRef = useRef<HTMLElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  useCoverParallax(headerRef, parallaxRef, { enabled: parallax, skipWhenNarrow: false });

  return (
    <header ref={headerRef} className="mc-hero-cine relative isolate flex flex-col justify-end overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div ref={parallaxRef} className="absolute left-0 right-0" style={{ top: "-14%", height: "128%", willChange: "transform" }}>
          {data.heroImageUrl ? (
            <img
              src={data.heroImageUrl}
              alt=""
              loading={parallax ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={parallax ? "high" : "auto"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="mc-hero-cover-empty" />
          )}
        </div>
      </div>
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "linear-gradient(180deg, rgba(20,16,14,0.62) 0%, rgba(20,16,14,0.42) 18%, rgba(20,16,14,0.34) 42%, rgba(20,16,14,0.38) 62%, rgba(20,16,14,0.84) 100%)" }}
      />
      <div className="mx-auto w-full max-w-[1320px] px-[clamp(20px,5cqw,48px)] pb-[clamp(40px,6cqw,72px)] pt-12 text-white">
        {eyebrow && (
          <p className="mc-rev-fade inline-flex items-center gap-[9px] text-[11px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.16em", color: "rgba(255,255,255,0.92)", animationDelay: `${HERO_DELAY.eyebrow}ms` }}>
            {eyebrowDot}
            {eyebrow}
          </p>
        )}
        <WordRise
          text={name}
          base={HERO_DELAY.title}
          step={HERO_DELAY.titleStep}
          className="mt-3 max-w-[14ch] text-balance"
          style={{ ...DISPLAY, fontSize: "clamp(38px,12cqw,96px)", lineHeight: 0.96 }}
        />
        {tagline && (
          <p className="mc-rev-up mt-5 max-w-[540px] text-[clamp(14px,2.4cqw,21px)]" style={{ lineHeight: 1.45, color: "rgba(255,255,255,0.9)", animationDelay: `${HERO_DELAY.tagline}ms` }}>
            {tagline}
          </p>
        )}
        <div className="mt-7 flex flex-wrap items-center gap-x-[22px] gap-y-3.5">
          {showRating && (
            <div className="mc-rev-up flex items-center gap-2.5" style={{ color: "#fff", animationDelay: `${HERO_DELAY.rating}ms` }}>
              <span style={{ ...DISPLAY, fontSize: "clamp(30px,6cqw,44px)", lineHeight: 0.85, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", textShadow: "0 2px 14px rgba(0,0,0,0.4)" }}>
                {rating.toFixed(1)}
              </span>
              <span className="flex flex-col gap-1">
                <Stars value={rating} size={13} color="#fff" empty="rgba(255,255,255,0.34)" />
                <span className="text-[11px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.12em", color: "rgba(255,255,255,0.8)", textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}>
                  {t("businessPage.builder.preview.reviewsCount", { count })}
                </span>
              </span>
            </div>
          )}
          <div className="mc-rev-up" style={{ animationDelay: `${HERO_DELAY.cta}ms` }}>
            <BookButton label={ctaLabel} tone="paper" />
          </div>
        </div>
      </div>
    </header>
  );
}
