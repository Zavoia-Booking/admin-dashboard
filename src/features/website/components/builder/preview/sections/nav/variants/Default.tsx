import { type CSSProperties } from "react";
import { cn } from "../../../../../../../../shared/lib/utils";
import { DISPLAY } from "../../../shared/constants";
import { BookButton } from "../../../shared/primitives";
import type { NavVariantProps } from "../types";

// Fraction of the frost scroll by which the warm paper tint + dark text have fully arrived (kept short so
// it never dwells in a muddy, unreadable state). The full scroll distance (FROST_DIST) lives in the orchestrator.
const FROST_TINT_AT = 0.32;

/** Visible sections that earn an anchor link in the nav, mapped to their kicker label key. */
const NAV_LABELS: Record<string, string> = {
  about: "businessPage.builder.preview.kicker.about",
  locations: "businessPage.builder.preview.kicker.locations",
  gallery: "businessPage.builder.preview.kicker.gallery",
  team: "businessPage.builder.preview.kicker.team",
  testimonials: "businessPage.builder.preview.kicker.reviews",
};

/**
 * Default — brand lockup · section links · "Get started" CTA. Over the cinematic hero the nav frosts
 * gradually with `progress` (0 = transparent/white over the hero, 1 = translucent blurred paper bar once the
 * hero clears). With no dark hero it is the solid paper bar from the top. Center links hide on a narrow width.
 */
export function Default({
  data,
  layout,
  t,
  overHero,
  ctaFrost = false,
  progress,
  navRef,
  marginBottom,
  sticky = true,
}: NavVariantProps) {
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const mark = name.trim().charAt(0).toUpperCase() || "•";
  const links = layout
    .filter((s) => s.visible && NAV_LABELS[s.type])
    .map((s) => ({ type: s.type, label: t(NAV_LABELS[s.type]) }));

  // Floats transparently over every photo/accent hero and frosts on scroll. Below the @xl link breakpoint
  // the center links drop away and the bar carries just the brand + the booking CTA (the editorial source
  // has no mobile menu — it stays a single scroll), so nothing here needs an open/closed state.
  const asFloating = overHero;

  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  const pc = (x: number) => `${(x * 100).toFixed(1)}%`;
  // Warm paper tint + dark text arrive fast (front-loaded, done within FROST_TINT_AT) so the bar is legible
  // the moment it frosts — no muddy half-lit dwell. Blur depth ramps gradually over the full scroll.
  const tint = overHero ? 1 - Math.pow(1 - Math.min(1, progress / FROST_TINT_AT), 3) : 1;
  const blurP = overHero ? 1 - (1 - progress) * (1 - progress) : 1;
  const blur = blurP > 0.001 ? `blur(${(18 * blurP).toFixed(2)}px) saturate(${(100 + 50 * blurP).toFixed(0)}%)` : undefined;

  const skin: CSSProperties = asFloating
    ? {
        backgroundColor: `color-mix(in oklch, var(--mc-bg) ${(82 * tint).toFixed(1)}%, transparent)`,
        backdropFilter: blur,
        WebkitBackdropFilter: blur,
        boxShadow: `0 1px 0 color-mix(in oklch, var(--mc-line), transparent ${pc(1 - tint)})`,
      }
    : { backgroundColor: "var(--mc-bg)", borderBottom: "1px solid var(--mc-line)" };

  const fg = asFloating ? `color-mix(in oklch, #fff, var(--mc-fg) ${pc(tint)})` : "var(--mc-fg)";
  const txShadow = asFloating && tint < 1 ? `0 1px 14px rgba(0,0,0,${(0.35 * (1 - tint)).toFixed(3)})` : undefined;
  const markColor = asFloating ? `color-mix(in oklch, #fff, var(--mc-accent) ${pc(tint)})` : "var(--mc-accent)";
  const markBorder = asFloating
    ? `color-mix(in oklch, rgba(255,255,255,0.6), color-mix(in oklch, var(--mc-accent) 48%, var(--mc-line)) ${pc(tint)})`
    : "color-mix(in oklch, var(--mc-accent) 48%, var(--mc-line))";
  const ringColor = asFloating ? `color-mix(in oklch, rgba(255,255,255,0.4), rgba(0,0,0,0.1) ${pc(tint)})` : "rgba(0,0,0,0.1)";
  // Over the drenched field the CTA frosts with everything else: a white pill / ink text at rest (legible
  // on the accent), resolving to the accent pill / warm-white once the bar settles onto paper.
  const ctaStyle: CSSProperties | undefined =
    overHero && ctaFrost
      ? {
          // Settle on the AA-safe deepened accent (warm-white clears ~4.8:1 vs ~4.2:1 on the raw hue).
          background: `color-mix(in oklch, #fff, var(--mc-accent-field) ${pc(tint)})`,
          // Snap the label across the bg's light→dark crossover (≈0.6) rather than crossfading through it,
          // so it never collapses to ~1:1 mid-scroll; the 140ms transition keeps the flip smooth.
          color: tint < 0.6 ? "var(--mc-ink)" : "var(--mc-on-accent)",
          transition: `background-color 140ms ${EASE}, color 140ms ${EASE}`,
        }
      : undefined;
  // Over a hero the links sit at full opacity (so white clears AA on the drenched field / dark cover) and
  // only soften once the bar settles onto paper. The solid paper bar keeps the calm 0.7.
  const linkOpacity = overHero ? 1 - 0.3 * tint : 0.7;
  // Short transition only smooths the per-frame quantization — short enough to still track the scroll.
  const txt = overHero ? `color 140ms ${EASE}, text-shadow 140ms ${EASE}, border-color 140ms ${EASE}, box-shadow 140ms ${EASE}` : undefined;
  const chromeTrans = overHero
    ? `background-color 140ms ${EASE}, backdrop-filter 140ms ${EASE}, -webkit-backdrop-filter 140ms ${EASE}, box-shadow 140ms ${EASE}`
    : undefined;

  return (
    <nav
      ref={navRef}
      data-preview-section="nav"
      className={cn(
        sticky ? "sticky top-0" : "relative",
        // Below the @xl link breakpoint the center links drop away, so the grid loses its center track:
        // brand (1fr) keeps the row and the CTA sits flush right; the third track returns with the links.
        "z-30 grid grid-cols-[1fr_auto] items-center gap-[clamp(16px,4.5cqw,40px)] px-[clamp(18px,6cqw,56px)] py-4 @xl:grid-cols-[1fr_auto_1fr]",
      )}
      style={{ marginBottom, transition: chromeTrans, ...skin }}
    >
      <span className="flex min-w-0 items-center gap-3">
        {data.logo ? (
          <img
            src={data.logo}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-[44px] w-[44px] shrink-0 rounded-full object-cover"
            style={{ boxShadow: `0 0 0 1px ${ringColor}`, transition: txt }}
          />
        ) : (
          <span
            className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full text-[22px] leading-none"
            style={{
              ...DISPLAY,
              color: markColor,
              border: `1px solid ${markBorder}`,
              transition: txt,
            } as CSSProperties}
          >
            {mark}
          </span>
        )}
        <span className="min-w-0 truncate leading-none" style={{ ...DISPLAY, fontSize: "clamp(21px,3.4cqw,27px)", color: fg, textShadow: txShadow, transition: txt }}>
          {name}
        </span>
      </span>

      <div className="hidden items-center gap-[clamp(18px,3cqw,34px)] justify-self-center @xl:flex">
        {links.map((l) => (
          <span
            key={l.type}
            className="whitespace-nowrap text-[11.5px] font-semibold uppercase"
            style={{ letterSpacing: "0.13em", color: fg, opacity: linkOpacity, textShadow: txShadow, transition: txt }}
          >
            {l.label}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-self-end">
        <BookButton label={t("businessPage.builder.preview.getStarted")} tone="accent" size="nav" styleOverride={ctaStyle} />
      </div>
    </nav>
  );
}
