import { DISPLAY, MONO } from "../../../shared/constants";
import { Stars, BookButton } from "../../../shared/primitives";
import { HERO_DELAY } from "../constants";
import { WordRise } from "./WordRise";
import type { HeroModeProps } from "../types";

/** Minimal / no cover — drenched accent field. With no photo the hero floods with the owner's brand
 *  accent (deepened just enough for AA-legible warm-white type) and the type carries the whole
 *  composition. Content sits bottom-left so a cover, once added, slots into the same hero frame. */
export function Drenched({ data, t, parallax, name, eyebrow, eyebrowDot, monogram, rating, count, showRating, ctaLabel, headerRef }: HeroModeProps) {
  return (
    <header
      ref={headerRef}
      className="mc-hero-drench relative isolate flex flex-col justify-end overflow-hidden px-[clamp(20px,5cqw,48px)] pb-[clamp(36px,6cqw,68px)] pt-[clamp(56px,10cqw,104px)]"
      style={{ background: "var(--mc-accent-field)", color: "var(--mc-on-accent)" }}
    >
      {/* Oversized brand monogram as a ~6% letterpress ghost — texture, not decoration. Size + offset live
          in .mc-hero-mono (globals): width-driven on desktop (a giant ghost bled off the top-right corner),
          but on the tall, narrow phone hero it's enlarged and vertically centred so it fills the field
          instead of sitting stuck at the top. */}
      {monogram && (
        <span
          aria-hidden
          className="mc-hero-mono pointer-events-none absolute z-0 select-none whitespace-nowrap"
          style={{ ...DISPLAY, right: "-5%", lineHeight: 0.8, color: "color-mix(in oklch, var(--mc-on-accent) 6%, transparent)", textShadow: "0 2px 0 rgba(255,255,255,0.04), 0 -2px 0 rgba(0,0,0,0.06)" }}
        >
          {monogram}
        </span>
      )}
      {/* Editorial hairline under the masthead zone — only in the full-page preview, where the floating nav
          sits above it. In the scoped one-section card (no nav) it would float orphaned, so it's omitted. */}
      {parallax && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-[clamp(20px,5cqw,48px)] right-[clamp(20px,5cqw,48px)] top-[clamp(88px,15cqw,124px)] z-[1] h-px"
          style={{ background: "color-mix(in oklch, var(--mc-on-accent) 16%, transparent)" }}
        />
      )}
      <div className="relative z-[2] mx-auto w-full max-w-[1320px]">
        {eyebrow && (
          <p className="mc-rev-fade inline-flex items-center gap-[9px] text-[11px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.16em", color: "var(--mc-on-accent)", animationDelay: `${HERO_DELAY.eyebrow}ms` }}>
            {eyebrowDot}
            {eyebrow}
          </p>
        )}
        <WordRise
          text={name}
          base={HERO_DELAY.title}
          step={HERO_DELAY.titleStep}
          className="mt-4 max-w-[15ch] text-balance"
          style={{ ...DISPLAY, fontSize: "clamp(40px,11cqw,84px)", lineHeight: 0.96 }}
        />
        {data.tagline && (
          <p className="mc-rev-up mt-5 max-w-[540px] text-[clamp(14px,2.4cqw,21px)]" style={{ lineHeight: 1.45, color: "var(--mc-on-accent)", animationDelay: `${HERO_DELAY.tagline}ms` }}>
            {data.tagline}
          </p>
        )}
        {/* Baseline rule under the lockup — the second editorial hairline. */}
        <div aria-hidden className="mc-rev-up mt-7 h-px w-16" style={{ background: "color-mix(in oklch, var(--mc-on-accent) 36%, transparent)", animationDelay: `${HERO_DELAY.tagline}ms` }} />
        <div className="mt-6 flex flex-wrap items-center gap-x-[22px] gap-y-3.5">
          {showRating && (
            <div className="mc-rev-up flex items-center gap-2.5" style={{ animationDelay: `${HERO_DELAY.rating}ms` }}>
              <span style={{ ...DISPLAY, fontSize: "clamp(28px,6cqw,42px)", lineHeight: 0.85, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{rating.toFixed(1)}</span>
              <span className="flex flex-col gap-1">
                <Stars value={rating} size={13} color="var(--mc-on-accent)" empty="color-mix(in oklch, var(--mc-on-accent) 32%, transparent)" />
                <span className="text-[11px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.12em", color: "var(--mc-on-accent)" }}>
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
