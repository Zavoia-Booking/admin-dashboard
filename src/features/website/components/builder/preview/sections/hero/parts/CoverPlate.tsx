import { DISPLAY, MONO } from "../../../shared/constants";
import { Stars, BookButton } from "../../../shared/primitives";
import { HERO_DELAY } from "../constants";
import { WordRise } from "./WordRise";
import type { HeroModeProps } from "../types";

/** Cover plate — three layers: the drenched accent FIELD on the left (accent flood + ghost monogram +
 *  masthead hairline, the same treatment as the no-cover hero), the cover PHOTO bleeding full-height on
 *  the right, and a white CARD straddling the seam (the signature overlap). The .mc-plate* layout
 *  (absolute field + photo + the overlapping card + the stack breakpoint) lives in globals.css. */
export function CoverPlate({ data, t, parallax, name, eyebrow, eyebrowDot, monogram, rating, count, showRating, ctaLabel, headerRef, parallaxRef }: HeroModeProps) {
  return (
    <header ref={headerRef} className="mc-plate">
      <div className="mc-plate-field">
        {/* Oversized brand monogram bled off the top-left as a ~7% letterpress ghost — texture, not decoration. */}
        {monogram && (
          <span
            aria-hidden
            className="pointer-events-none absolute select-none whitespace-nowrap"
            style={{ ...DISPLAY, top: "-13%", left: "-7%", fontSize: "50cqw", lineHeight: 0.8, color: "color-mix(in oklch, var(--mc-on-accent) 7%, transparent)", textShadow: "0 2px 0 rgba(255,255,255,0.04), 0 -2px 0 rgba(0,0,0,0.06)" }}
          >
            {monogram}
          </span>
        )}
        {/* Masthead hairline under the floating nav — only in the full-page preview, where the nav sits
            above it (the scoped card has no nav, and the field is hidden once stacked). */}
        {parallax && (
          <div
            aria-hidden
            className="pointer-events-none absolute left-[clamp(22px,3.4cqw,52px)] right-[clamp(16px,3cqw,40px)] top-[clamp(84px,13cqw,116px)] h-px"
            style={{ background: "color-mix(in oklch, var(--mc-on-accent) 18%, transparent)" }}
          />
        )}
      </div>
      <div className="mc-plate-photo">
        <div ref={parallaxRef} className="mc-plate-track">
          <img
            src={data.heroImageUrl ?? undefined}
            alt=""
            loading={parallax ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={parallax ? "high" : "auto"}
          />
        </div>
      </div>
      <div className="mc-plate-card">
        {eyebrow && (
          <p className="mc-rev-fade inline-flex items-center gap-[9px] text-[11px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.16em", color: "var(--mc-muted)", animationDelay: `${HERO_DELAY.eyebrow}ms` }}>
            {eyebrowDot}
            {eyebrow}
          </p>
        )}
        <WordRise
          text={name}
          base={HERO_DELAY.title}
          step={HERO_DELAY.titleStep}
          className="mt-4 max-w-[13ch] text-balance"
          style={{ ...DISPLAY, fontSize: "clamp(30px,4.4cqw,52px)", lineHeight: 1 }}
        />
        {data.tagline && (
          <p className="mc-rev-up mt-4 max-w-[38ch] text-[clamp(14px,1.7cqw,17px)]" style={{ lineHeight: 1.5, color: "var(--mc-muted)", animationDelay: `${HERO_DELAY.tagline}ms` }}>
            {data.tagline}
          </p>
        )}
        {/* Baseline rule under the lockup. */}
        <div aria-hidden className="mc-rev-up mt-7 h-px w-[60px]" style={{ background: "var(--mc-line)", animationDelay: `${HERO_DELAY.tagline}ms` }} />
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3.5">
          {showRating && (
            <div className="mc-rev-up flex items-center gap-2.5" style={{ animationDelay: `${HERO_DELAY.rating}ms` }}>
              <span style={{ ...DISPLAY, fontSize: "clamp(26px,3.8cqw,38px)", lineHeight: 0.85, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{rating.toFixed(1)}</span>
              <span className="flex flex-col gap-1">
                <Stars value={rating} size={13} />
                <span className="text-[11px] font-semibold uppercase" style={{ ...MONO, letterSpacing: "0.12em", color: "var(--mc-muted)" }}>
                  {t("businessPage.builder.preview.reviewsCount", { count })}
                </span>
              </span>
            </div>
          )}
          <div className="mc-rev-up" style={{ animationDelay: `${HERO_DELAY.cta}ms` }}>
            <BookButton label={ctaLabel} tone="accent" />
          </div>
        </div>
      </div>
    </header>
  );
}
