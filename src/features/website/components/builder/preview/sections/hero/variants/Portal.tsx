import { useLayoutEffect, useRef } from "react";
import { BookButton } from "../../../shared/primitives";
import { findScrollParent, prefersReducedMotion } from "../../../shared/util";
import { HERO_DELAY } from "../constants";
import { WordRise } from "../parts/WordRise";
import { deriveHeroContent } from "../parts/content";
import type { HeroVariantProps } from "../types";
import "./portal.css";

const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

type PortalState = {
  media: { transform: string; borderRadius: string; filter: string };
  fit: { transform: string };
  ring: { borderWidth: string };
  ringTop: { borderTopWidth: string };
  img: { transform: string };
  title: { transform: string };
  atmos: { opacity: string };
  veil: { opacity: string };
  scrim: { opacity: string };
};

/** Reveal state at progress `p` (0 = arched portrait, 1 = full-bleed). Pure so it can feed both the
 *  ViewTimeline keyframe sampler and the main-thread fallback from the same geometry. */
function stateAt(p: number, W: number, H: number): PortalState {
  const mob = W <= 520;
  const z = easeOut(clamp(p / 0.74, 0, 1));
  const inv = 1 - z;
  const figH = Math.min(H * (mob ? 0.6 : 0.68), mob ? 460 : 620);
  const figW = figH * 0.75;
  // Frame scale: the arched portrait (figW×figH) growing to the full pin (W×H).
  const sx = figW / W + (1 - figW / W) * z;
  const sy = figH / H + (1 - figH / H) * z;
  const rt = Math.min(figW / 2, 260) * inv;
  const rb = 12 * inv;
  const rtx = (rt / sx).toFixed(1);
  const rty = (rt / sy).toFixed(1);
  const rbx = (rb / sx).toFixed(1);
  const rby = (rb / sy).toFixed(1);
  const s = (sx + sy) / 2;
  const zt = easeOut(clamp(p / 0.82, 0, 1));
  const shrink = mob ? 0.36 : 0.42;

  return {
    media: {
      transform: `scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`,
      // Radii in media's local (pre-scale) space so they render as rt/rb on screen once scaled.
      borderRadius: `${rtx}px ${rtx}px ${rbx}px ${rbx}px / ${rty}px ${rty}px ${rby}px ${rby}px`,
      filter:
        mob || z > 0.92
          ? "none"
          : `drop-shadow(0 ${(44 / sy).toFixed(1)}px ${(90 / s).toFixed(1)}px rgba(0,0,0,${(0.6 * inv).toFixed(2)})) drop-shadow(0 0 ${(60 / s).toFixed(1)}px color-mix(in oklch, var(--mc-accent) ${(26 * inv).toFixed(0)}%, transparent))`,
    },
    fit: { transform: `scale(${(1 / sx).toFixed(4)}, ${(1 / sy).toFixed(4)})` },
    // Border widths compensate the frame scale so they render at 1px / 2px on screen.
    ring: { borderWidth: `${(1 / sy).toFixed(3)}px ${(1 / sx).toFixed(3)}px` },
    ringTop: { borderTopWidth: `${(2 / sy).toFixed(3)}px` },
    img: { transform: `translateY(${(-0.08 * H * z).toFixed(1)}px) scale(${(1.1 - 0.1 * z).toFixed(3)})` },
    title: { transform: `translateY(${(0.19 * H * zt).toFixed(1)}px) scale(${(1 - shrink * zt).toFixed(3)})` },
    atmos: { opacity: inv.toFixed(3) },
    veil: { opacity: (1 - 0.45 * z).toFixed(3) },
    scrim: { opacity: z.toFixed(3) },
  };
}

const TIMELINE_SAMPLES = 48;

/** Portal — a full-frame portrait revealed through an arched clip-path. At rest (scoped preview / static
 *  snapshot / reduced motion) it shows the arched portrait with the wordmark centred across it; in the
 *  scrolling full-page preview the arch opens to full-bleed, the image drifts in parallax, and the wordmark
 *  shrinks down to the foot. The pin is `position: sticky` (compositor-driven, so it doesn't lag the touch
 *  scroll on phones). Where `ViewTimeline` is available, the reveal itself also runs on the compositor via
 *  Web Animations tied to the pin's scroll position; elsewhere it falls back to a scroll-driven rAF paint.
 *  (Design source: HeroPortal.) */
export function Portal(props: HeroVariantProps) {
  const { data, parallax } = props;
  const { name, tagline, ctaLabel } = deriveHeroContent(props);
  const trackRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const atmosRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const ringTopRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  // Layout effect: the resting geometry is applied before first paint, so a (re)mount never flashes full-bleed.
  useLayoutEffect(() => {
    const track = trackRef.current;
    const pin = pinRef.current;
    const media = mediaRef.current;
    const fit = fitRef.current;
    const ring = ringRef.current;
    const ringTop = ringTopRef.current;
    const img = imgRef.current;
    const title = titleRef.current;
    const atmos = atmosRef.current;
    const veil = veilRef.current;
    const scrim = scrimRef.current;
    if (!track || !pin || !media || !fit) return;

    // Write a computed reveal state as inline styles on the real elements.
    const applyState = (state: PortalState) => {
      media.style.transform = state.media.transform;
      media.style.borderRadius = state.media.borderRadius;
      media.style.filter = state.media.filter;
      fit.style.transform = state.fit.transform;
      if (ring) ring.style.borderWidth = state.ring.borderWidth;
      if (ringTop) ringTop.style.borderTopWidth = state.ringTop.borderTopWidth;
      if (img) img.style.transform = state.img.transform;
      if (title) title.style.transform = state.title.transform;
      if (atmos) atmos.style.opacity = state.atmos.opacity;
      if (veil) veil.style.opacity = state.veil.opacity;
      if (scrim) scrim.style.opacity = state.scrim.opacity;
    };
    const clearStyles = () => {
      media.style.transform = "";
      media.style.borderRadius = "";
      media.style.filter = "";
      fit.style.transform = "";
      if (ring) ring.style.borderWidth = "";
      if (ringTop) ringTop.style.borderTopWidth = "";
      if (img) img.style.transform = "";
      if (title) title.style.transform = "";
      if (atmos) atmos.style.opacity = "";
      if (veil) veil.style.opacity = "";
      if (scrim) scrim.style.opacity = "";
    };

    let W = pin.clientWidth || 1;
    let H = pin.clientHeight || 1;
    const setFrame = () => {
      fit.style.width = `${W}px`;
      fit.style.height = `${H}px`;
    };

    const scroller = findScrollParent(track);
    const dynamic = parallax && !!scroller && !prefersReducedMotion();

    if (!dynamic) {
      // Resting arched portrait — the state the scoped card + picker thumbnail show.
      track.classList.remove("is-live");
      pin.style.height = "";
      track.style.height = "";
      setFrame();
      applyState(stateAt(0, W, H));
      const ro = new ResizeObserver(() => {
        W = pin.clientWidth || 1;
        H = pin.clientHeight || 1;
        setFrame();
        applyState(stateAt(0, W, H));
      });
      ro.observe(pin);
      return () => ro.disconnect();
    }

    const sc = scroller;
    track.classList.add("is-live");
    // Scroll room through the pin: a shorter jack on narrow previews, trimmed to where the reveal
    // actually finishes (p = 0.85) so there's no dead scroll once the frame is full-bleed.
    const setSizes = () => {
      H = sc.clientHeight || 1;
      pin.style.height = `${H}px`;
      W = pin.clientWidth || 1;
      const mob = W <= 520;
      const travel = (mob ? 1 : 1.6) * H;
      track.style.height = `${(H + 0.85 * travel).toFixed(1)}px`;
      setFrame();
    };

    // Feature-tested through a boolean so TS doesn't narrow the fallback branch to `never`.
    const hasViewTimeline =
      typeof window !== "undefined" && typeof (window as { ViewTimeline?: unknown }).ViewTimeline === "function";
    if (hasViewTimeline) {
      // Compositor-driven reveal: sample the curve into keyframes and drive them off a ViewTimeline
      // scoped to the track's scroll range, instead of a per-scroll-event rAF paint.
      let animations: Animation[] = [];
      const build = () => {
        animations.forEach((a) => a.cancel());
        setSizes();
        const timeline = new ViewTimeline({ subject: track, axis: "block" });
        const opts: KeyframeAnimationOptions = { timeline, rangeStart: "contain 0%", rangeEnd: "contain 100%", fill: "both" };
        // Split per property: an effect composites only if every property it animates is compositable, so
        // the frame's transform must not share an effect with border-radius (paint) or filter.
        const mediaKf: Keyframe[] = [];
        const mediaRadiusKf: Keyframe[] = [];
        const mediaFilterKf: Keyframe[] = [];
        const fitKf: Keyframe[] = [];
        const ringKf: Keyframe[] = [];
        const ringTopKf: Keyframe[] = [];
        const imgKf: Keyframe[] = [];
        const titleKf: Keyframe[] = [];
        const atmosKf: Keyframe[] = [];
        const veilKf: Keyframe[] = [];
        const scrimKf: Keyframe[] = [];
        for (let i = 0; i <= TIMELINE_SAMPLES; i++) {
          const offset = i / TIMELINE_SAMPLES;
          const st = stateAt(0.85 * offset, W, H);
          mediaKf.push({ transform: st.media.transform, offset, easing: "linear" });
          mediaRadiusKf.push({ borderRadius: st.media.borderRadius, offset, easing: "linear" });
          mediaFilterKf.push({ filter: st.media.filter, offset, easing: "linear" });
          fitKf.push({ transform: st.fit.transform, offset, easing: "linear" });
          ringKf.push({ borderWidth: st.ring.borderWidth, offset, easing: "linear" });
          ringTopKf.push({ borderTopWidth: st.ringTop.borderTopWidth, offset, easing: "linear" });
          imgKf.push({ transform: st.img.transform, offset, easing: "linear" });
          titleKf.push({ transform: st.title.transform, offset, easing: "linear" });
          atmosKf.push({ opacity: st.atmos.opacity, offset, easing: "linear" });
          veilKf.push({ opacity: st.veil.opacity, offset, easing: "linear" });
          scrimKf.push({ opacity: st.scrim.opacity, offset, easing: "linear" });
        }
        animations = [media.animate(mediaKf, opts), media.animate(mediaRadiusKf, opts), fit.animate(fitKf, opts)];
        // Narrow frames never carry the drop-shadow (every sample is "none") — skip the effect entirely.
        if (W > 520) animations.push(media.animate(mediaFilterKf, opts));
        else media.style.filter = "none";
        if (ring) animations.push(ring.animate(ringKf, opts));
        if (ringTop) animations.push(ringTop.animate(ringTopKf, opts));
        if (img) animations.push(img.animate(imgKf, opts));
        if (title) animations.push(title.animate(titleKf, opts));
        if (atmos) animations.push(atmos.animate(atmosKf, opts));
        if (veil) animations.push(veil.animate(veilKf, opts));
        if (scrim) animations.push(scrim.animate(scrimKf, opts));
      };
      build();
      const onResize = () => build();
      window.addEventListener("resize", onResize);
      const ro = new ResizeObserver(onResize);
      ro.observe(sc);
      return () => {
        animations.forEach((a) => a.cancel());
        window.removeEventListener("resize", onResize);
        ro.disconnect();
        clearStyles();
        track.classList.remove("is-live");
      };
    }

    // Fallback (no ViewTimeline: Firefox, older iOS) — main-thread scroll listener + rAF paint.
    let raf = 0;
    const apply = () => {
      raf = 0;
      const scRect = sc.getBoundingClientRect();
      const scale = sc.clientWidth > 0 ? scRect.width / sc.clientWidth : 1;
      const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
      const mob = W <= 520;
      const travel = (mob ? 1 : 1.6) * H;
      const logicalTop = (track.getBoundingClientRect().top - scRect.top) / safeScale;
      const s = clamp(-logicalTop, 0, 0.85 * travel);
      const p = travel > 0 ? s / travel : 0;
      applyState(stateAt(p, W, H));
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
        <div ref={atmosRef} className="mc-heropt-atmos" aria-hidden>
          <div className="mc-heropt-halo" />
          <div className="mc-heropt-spill" />
        </div>
        <div ref={mediaRef} className="mc-heropt-media">
          <div ref={fitRef} className="mc-heropt-fit">
            <div ref={imgRef} className="mc-heropt-imgmove">
              {data.heroImageUrl ? (
                <img src={data.heroImageUrl} alt="" loading={parallax ? "eager" : "lazy"} decoding="async" />
              ) : (
                <div className="mc-hero-cover-empty" style={{ position: "absolute", inset: 0 }} />
              )}
            </div>
            <div ref={veilRef} className="mc-heropt-veil" />
            <div ref={scrimRef} className="mc-heropt-scrim" />
          </div>
          <div ref={ringRef} className="mc-heropt-ring" aria-hidden />
          <div ref={ringTopRef} className="mc-heropt-ring-top" aria-hidden />
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
