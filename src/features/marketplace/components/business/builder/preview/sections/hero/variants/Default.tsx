import { useEffect, useRef } from "react";
import type { HeroConfig } from "../../../../../../../types";
import { aggregateReviews, heroMode } from "../../../shared/util";
import { HERO_PARALLAX } from "../constants";
import { Cinematic } from "../parts/Cinematic";
import { CoverPlate } from "../parts/CoverPlate";
import { Drenched } from "../parts/Drenched";
import type { HeroVariantProps, HeroModeProps } from "../types";

/** Two-letter brand monogram from the business name (first + last word, or first two letters of one word). */
function monogramOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Default hero — resolves the render mode (cinematic / coverPlate / drenched) from the cover photo +
 *  cover-layout toggle, owns the cover parallax, and dispatches to the matching mode layout under parts/. */
export function Default({ entry, data, t, parallax }: HeroVariantProps) {
  const cfg = (entry.config ?? {}) as HeroConfig;
  const { rating, count } = aggregateReviews(data.locations);
  const locs = data.locations;
  const name = data.businessName || t("businessPage.builder.preview.businessNamePlaceholder");
  const monogram = monogramOf(name);
  const mode = heroMode(cfg, !!data.heroImageUrl);
  const showRating = count > 0 && cfg.showRating !== false;
  // Booking button copy is fixed (not owner-editable); the button always opens the booking flow.
  const ctaLabel = t("businessPage.builder.preview.bookNow");
  // Eyebrow is auto-built from the locations (owner only toggles it on/off): a single location shows
  // its city, multiple show "{n} locations across {place}" (shared city when all in one, else
  // country), falling back to a count.
  let derivedEyebrow = "";
  if (locs.length === 1) {
    derivedEyebrow = locs[0].addressComponents?.city || "";
  } else if (locs.length > 1) {
    const cities = new Set(locs.map((l) => l.addressComponents?.city).filter(Boolean));
    const country = locs.map((l) => l.addressComponents?.country).find(Boolean);
    const place = cities.size === 1 ? [...cities][0] : country;
    derivedEyebrow = place
      ? t("businessPage.builder.preview.hero.locationsAcross", { num: locs.length, place })
      : t("businessPage.builder.preview.locationCount", { count: locs.length });
  }
  const eyebrow = cfg.showEyebrow === false ? "" : derivedEyebrow;

  const headerRef = useRef<HTMLElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);

  // Cover parallax tied to the preview's scroll container (full-page preview only; skipped under
  // reduced-motion / no image / scoped one-section preview).
  useEffect(() => {
    const host = parallaxRef.current;
    const header = headerRef.current;
    if (!parallax || !host || !header || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let scroller: HTMLElement | null = header.parentElement;
    while (scroller) {
      const oy = getComputedStyle(scroller).overflowY;
      if (oy === "auto" || oy === "scroll") break;
      scroller = scroller.parentElement;
    }
    if (!scroller) return;
    const sc = scroller;
    let raf = 0;
    const update = () => {
      raf = 0;
      // Stacked cover-plate (narrow container, ≤720px) drops the image overscan — its photo fills an exact
      // 16/10 box — so any parallax shift would bare an edge. Keep it static there (matches the mockup,
      // which doesn't parallax when stacked); the cinematic cover keeps its overscan at every width.
      if (mode === "coverPlate" && header.getBoundingClientRect().width <= 720) {
        host.style.transform = "";
        return;
      }
      const r = host.getBoundingClientRect();
      const cr = sc.getBoundingClientRect();
      const d = r.top + r.height / 2 - (cr.top + cr.height / 2);
      // Clamp inside the image overscan (top:-14% / height:128%) so an edge can never enter the frame.
      const buffer = header.getBoundingClientRect().height * 0.13;
      const ty = Math.max(-buffer, Math.min(buffer, -d * HERO_PARALLAX));
      host.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    // Recompute on resize too, so toggling the preview between desktop and mobile re-evaluates the stacked
    // guard above (the component doesn't remount on toggle, so a scroll-only listener would go stale).
    const ro = new ResizeObserver(() => {
      if (!raf) raf = requestAnimationFrame(update);
    });
    ro.observe(header);
    update();
    return () => {
      sc.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [data.heroImageUrl, parallax, mode]);

  const eyebrowDot = <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />;

  const modeProps: HeroModeProps = { data, t, parallax, name, eyebrow, eyebrowDot, monogram, rating, count, showRating, ctaLabel, headerRef, parallaxRef };
  if (mode === "cinematic") return <Cinematic {...modeProps} />;
  if (mode === "coverPlate") return <CoverPlate {...modeProps} />;
  return <Drenched {...modeProps} />;
}
