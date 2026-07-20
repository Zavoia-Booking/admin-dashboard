import { useEffect, useRef } from "react";
import { BookButton } from "../../../shared/primitives";
import { findScrollParent, prefersReducedMotion } from "../../../shared/util";
import { HERO_DELAY } from "../constants";
import { WordRise } from "../parts/WordRise";
import { deriveHeroContent } from "../parts/content";
import type { HeroVariantProps } from "../types";
import "./portal.css";

const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Portal — a full-frame portrait revealed through an arched clip-path. At rest (scoped preview / reduced
 *  motion) it shows the arched portrait with the wordmark centred across it; in the scrolling full-page
 *  preview the arch opens to full-bleed, the image drifts in parallax, and the wordmark shrinks down to the
 *  foot. The scroll-jack is driven off the preview's own scroll container (never window), preview-scale
 *  aware. (Design source: HeroPortal.) */
export function Portal(props: HeroVariantProps) {
  const { data, parallax } = props;
  const { name, tagline, ctaLabel } = deriveHeroContent(props);
  const trackRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const pin = pinRef.current;
    const media = mediaRef.current;
    const img = imgRef.current;
    const title = titleRef.current;
    if (!track || !pin || !media) return;

    let W = pin.clientWidth || 1;
    let H = pin.clientHeight || 1;
    // Paint the reveal at progress `p` (0 = arched portrait, 1 = full-bleed). All lengths are logical px
    // (offsetWidth/Height), so the clip-path is correct inside the scaled preview.
    const paint = (p: number) => {
      const mob = W <= 520;
      const z = easeOut(clamp(p / 0.74, 0, 1));
      const inv = 1 - z;
      const figH = Math.min(H * (mob ? 0.6 : 0.68), mob ? 460 : 620);
      const figW = figH * 0.75;
      const vIn = ((H - figH) / 2) * inv;
      const hIn = ((W - figW) / 2) * inv;
      const rt = Math.min(figW / 2, 260) * inv;
      const rb = 12 * inv;
      media.style.clipPath = `inset(${vIn.toFixed(1)}px ${hIn.toFixed(1)}px round ${rt.toFixed(1)}px ${rt.toFixed(1)}px ${rb.toFixed(1)}px ${rb.toFixed(1)}px)`;
      media.style.filter =
        mob || z > 0.92
          ? "none"
          : `drop-shadow(0 44px 90px rgba(0,0,0,${(0.6 * inv).toFixed(2)})) drop-shadow(0 0 60px color-mix(in oklch, var(--mc-accent) ${(26 * inv).toFixed(0)}%, transparent))`;
      if (img) img.style.transform = `translateY(${(-0.08 * H * z).toFixed(1)}px) scale(${(1.1 - 0.1 * z).toFixed(3)})`;
      const zt = easeOut(clamp(p / 0.82, 0, 1));
      const shrink = mob ? 0.36 : 0.42;
      if (title) title.style.transform = `translateY(${(0.19 * H * zt).toFixed(1)}px) scale(${(1 - shrink * zt).toFixed(3)})`;
      pin.style.setProperty("--glow", inv.toFixed(3));
      pin.style.setProperty("--ui", (1 - easeOut(clamp(p / 0.3, 0, 1))).toFixed(3));
      pin.style.setProperty("--veil", (1 - 0.45 * z).toFixed(3));
      pin.style.setProperty("--scrim", z.toFixed(3));
    };

    const scroller = findScrollParent(track);
    const dynamic = parallax && !!scroller && !prefersReducedMotion();

    if (!dynamic) {
      // Resting arched portrait — the state the scoped card + picker thumbnail show.
      track.classList.remove("is-live");
      pin.style.transform = "";
      pin.style.height = "";
      paint(0);
      const ro = new ResizeObserver(() => {
        W = pin.clientWidth || 1;
        H = pin.clientHeight || 1;
        paint(0);
      });
      ro.observe(pin);
      return () => ro.disconnect();
    }

    const sc = scroller;
    track.classList.add("is-live");
    let raf = 0;
    const setSizes = () => {
      H = sc.clientHeight || 1;
      pin.style.height = `${H}px`;
      W = pin.clientWidth || 1;
      // Scroll room through the pin: a shorter jack on narrow previews so the reveal isn't a marathon.
      track.style.height = `${(W <= 520 ? 2 : 2.6) * H}px`;
    };
    const apply = () => {
      raf = 0;
      const scRect = sc.getBoundingClientRect();
      const scale = sc.clientWidth > 0 ? scRect.width / sc.clientWidth : 1;
      const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
      const total = track.offsetHeight - H;
      const logicalTop = (track.getBoundingClientRect().top - scRect.top) / safeScale;
      const s = clamp(-logicalTop, 0, total);
      const p = total > 0 ? s / total : 0;
      pin.style.transform = `translateY(${s.toFixed(1)}px)`; // transform-pin (sticky breaks under the scaled scroller)
      paint(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onResize = () => {
      setSizes();
      apply();
    };
    setSizes();
    apply();
    sc.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(sc);
    return () => {
      sc.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [parallax, data.heroImageUrl]);

  return (
    <header ref={trackRef} className="mc-heropt">
      <div ref={pinRef} className="mc-heropt-pin">
        <div className="mc-heropt-atmos" aria-hidden>
          <div className="mc-heropt-halo" />
          <div className="mc-heropt-spill" />
        </div>
        <div ref={mediaRef} className="mc-heropt-media">
          <div ref={imgRef} className="mc-heropt-imgmove">
            {data.heroImageUrl ? (
              <img src={data.heroImageUrl} alt="" loading={parallax ? "eager" : "lazy"} decoding="async" />
            ) : (
              <div className="mc-hero-cover-empty" style={{ position: "absolute", inset: 0 }} />
            )}
          </div>
          <div className="mc-heropt-veil" />
          <div className="mc-heropt-scrim" />
        </div>
        <div className="mc-heropt-cine" aria-hidden>
          <div className="mc-heropt-vignette" />
          <div className="mc-heropt-grain" />
        </div>
        <div className="mc-heropt-titlewrap">
          <div ref={titleRef} className="mc-heropt-titlemove">
            <WordRise text={name} base={150} step={70} className="mc-heropt-title" />
          </div>
        </div>
        <div className="mc-heropt-foot">
          {tagline && (
            <p className="mc-heropt-tag mc-rev-up" style={{ animationDelay: `${HERO_DELAY.tagline}ms` }}>
              {tagline}
            </p>
          )}
          <div className="mc-heropt-row mc-rev-up" style={{ animationDelay: "520ms" }}>
            <BookButton label={ctaLabel} tone="paper" size="lg" />
          </div>
        </div>
      </div>
    </header>
  );
}
