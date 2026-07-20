import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BookButton } from "../../../shared/primitives";
import { prefersReducedMotion } from "../../../shared/util";
import { HeroRate } from "../parts/HeroRate";
import { deriveHeroContent } from "../parts/content";
import type { HeroVariantProps } from "../types";
import "./tumble.css";

/** Break a name into up to `L` balanced lines (minimise the longest line) via DP, so long names stay a
 *  compact lockup instead of one line that runs off the frame. */
function balance(ws: string[], L: number): string[] {
  const n = ws.length;
  const lineLen = (arr: string[]) => arr.join(" ").length;
  const memo: Record<string, { max: number; cuts: number[] }> = {};
  const solve = (l: number, i: number): { max: number; cuts: number[] } => {
    if (l === 1) return { max: lineLen(ws.slice(i)), cuts: [n] };
    const key = l + ":" + i;
    if (memo[key]) return memo[key];
    let best: { max: number; cuts: number[] } | null = null;
    for (let j = i + 1; j <= n - (l - 1); j++) {
      const head = lineLen(ws.slice(i, j));
      const rest = solve(l - 1, j);
      const mx = Math.max(head, rest.max);
      if (!best || mx < best.max) best = { max: mx, cuts: [j, ...rest.cuts] };
    }
    return (memo[key] = best as { max: number; cuts: number[] });
  };
  const cuts = solve(L, 0).cuts;
  const out: string[] = [];
  let s = 0;
  cuts.forEach((c) => {
    out.push(ws.slice(s, c).join(" "));
    s = c;
  });
  return out;
}

/** Resolve the stacked lockup + fit-to-frame font size from the name and the measured hero width. Per tier:
 *  [width-per-glyph, height-per-line, hard cap px, max lines, target chars/line]. Viewport units become
 *  container-query units (the preview is width-driven); min() takes whichever of width/height/cap binds. */
function computeTumble(name: string, w: number) {
  const words = String(name || "Studio").trim().split(/\s+/).filter(Boolean);
  const total = words.join(" ").length;
  const tier = w <= 640 ? "phone" : w <= 1024 ? "tablet" : "desk";
  const T = { phone: [168, 52, 122, 5, 7], tablet: [150, 54, 200, 4, 9], desk: [138, 58, 232, 3, 14] }[tier];
  const [wCoef, hCoef, capPx, maxLines, perLine] = T;
  const scatterK = tier === "phone" ? 0.5 : tier === "tablet" ? 0.72 : 1;
  const Lwant = words.length <= 1 ? 1 : Math.min(maxLines, Math.max(2, Math.round(total / perLine)));
  const lines = balance(words, Math.min(Lwant, words.length));
  const maxLen = Math.max(...lines.map((l) => l.length), 1);
  const L = lines.length;
  const fontSize = `max(30px, min(${(wCoef / maxLen).toFixed(2)}cqw, ${(hCoef / L).toFixed(2)}cqw, ${capPx}px))`;
  const N = lines.join("").replace(/\s/g, "").length;
  return { lines, fontSize, N, scatterK };
}

/** Tumble — the full business name falls as huge ink glyphs across stacked lines onto warm grained paper,
 *  bounces once and settles scattered. Tap/flick a letter to toss it. At rest (reduced motion) the glyphs
 *  render settled. (Design source: HeroTumble.) */
export function Tumble(props: HeroVariantProps) {
  const { t } = props;
  const { name, tagline, rating, count, showRating, ctaLabel } = deriveHeroContent(props);
  const hasTagline = !!tagline?.trim();
  const headerRef = useRef<HTMLElement>(null);
  const [w, setW] = useState(900);
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () => setW(el.clientWidth || 900);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { lines, fontSize, N, scatterK } = useMemo(() => computeTumble(name, w), [name, w]);

  const stageRef = useRef<HTMLHeadingElement>(null);
  const els = useRef<(HTMLElement | null)[]>([]);
  const simRef = useRef<{ kick: (i: number) => void } | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const rnd = (seed: number) => {
      const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
      return s - Math.floor(s);
    };
    const stageH = () => stage.getBoundingClientRect().height || 700;
    const parts = Array.from({ length: N }).map((_, i) => ({
      v: 0,
      vr: (rnd(i * 5 + 4) - 0.5) * 0.32 * scatterK,
      ease: 0,
      y: -(stageH() * (0.5 + rnd(i * 13 + 1) * 0.42) + 220),
      rot: (rnd(i * 3 + 2) - 0.5) * 30 * scatterK,
      rotSettle: (rnd(i * 7 + 5) - 0.5) * 17 * scatterK,
      sx: (rnd(i * 17 + 2) - 0.5) * 13 * scatterK,
      sy: (rnd(i * 23 + 9) - 0.5) * 11 * scatterK,
      delay: 150 + i * 105 + rnd(i * 17) * 130,
      grounded: false,
    }));
    const noMotion = prefersReducedMotion();
    let raf = 0;
    let last = 0;
    let t0 = 0;
    const paint = (p: (typeof parts)[number], el: HTMLElement) => {
      const tx = p.sx * p.ease;
      const ty = p.y + p.sy * p.ease;
      const sc = 1.05 - 0.05 * p.ease; // settles from a touch oversized → 1 for weight
      el.style.transform = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) rotate(${p.rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
    };
    if (noMotion) {
      parts.forEach((p, i) => {
        p.y = 0;
        p.rot = p.rotSettle;
        p.ease = 1;
        p.grounded = true;
        const el = els.current[i];
        if (el) paint(p, el);
      });
    }
    const step = (ts: number) => {
      raf = 0;
      if (!t0) t0 = ts;
      const dt = Math.min(34, ts - (last || ts));
      last = ts;
      let live = false;
      parts.forEach((p, i) => {
        const el = els.current[i];
        if (!el) return;
        if (!p.grounded && ts - t0 < p.delay) {
          live = true;
          return;
        }
        if (!p.grounded) {
          p.v += 0.0038 * dt; // gentler gravity
          p.v *= 0.995; // soft air drag → smoother terminal glide
          p.y += p.v * dt;
          p.rot += p.vr * dt;
          p.vr *= 0.99; // spin damping
          if (p.y >= 0) {
            p.y = 0;
            if (p.v > 0.42) {
              p.v = -p.v * 0.2;
              p.vr *= 0.5;
            } else {
              p.v = 0;
              p.vr = 0;
              p.grounded = true;
            }
          }
          live = true;
        } else {
          if (Math.abs(p.rotSettle - p.rot) > 0.12) {
            p.rot += (p.rotSettle - p.rot) * Math.min(1, dt * 0.007);
            live = true;
          }
          if (p.ease < 0.999) {
            p.ease += (1 - p.ease) * Math.min(1, dt * 0.005);
            live = true;
          }
        }
        paint(p, el);
      });
      if (live) raf = requestAnimationFrame(step);
    };
    const run = () => {
      last = 0;
      if (!raf) raf = requestAnimationFrame(step);
    };
    if (!noMotion) run();
    simRef.current = {
      kick: (i: number) => {
        if (noMotion) return;
        const p = parts[i];
        if (!p) return;
        p.grounded = false;
        p.delay = 0;
        p.v = -(1.35 + rnd(i * 31 + (performance.now() % 97)) * 0.95);
        p.vr = (rnd(i * 41 + 3 + (performance.now() % 89)) - 0.5) * 0.4;
        run();
      },
    };
    return () => {
      if (raf) cancelAnimationFrame(raf);
      simRef.current = null;
    };
  }, [name, w, N, scatterK]);

  let gi = -1;
  return (
    <header ref={headerRef} className="mc-herotb">
      <div className="mc-herotb-underlay" aria-hidden />
      <div className="mc-herotb-grain" aria-hidden />
      <div className="mc-herotb-vign" aria-hidden />
      <h1 className="mc-herotb-stage" ref={stageRef} style={{ fontSize }} aria-label={name}>
        {lines.map((ln, li) => (
          <span className="mc-herotb-line" key={li}>
            {Array.from(ln).map((ch, ci) => {
              if (ch === " ") return <span key={ci} className="mc-herotb-sp" aria-hidden>{" "}</span>;
              gi += 1;
              const idx = gi;
              return (
                <span
                  key={ci}
                  className="mc-herotb-ch"
                  aria-hidden
                  ref={(el) => {
                    els.current[idx] = el;
                  }}
                  onPointerDown={() => simRef.current?.kick(idx)}
                >
                  {ch}
                </span>
              );
            })}
          </span>
        ))}
      </h1>
      <div className="mc-herotb-side mc-rev-fade" style={{ animationDelay: "200ms" }}>
        {hasTagline && <p className="mc-herotb-tag">— {tagline}</p>}
        <span className="mc-herotb-reg" aria-hidden>®</span>
      </div>
      <div className="mc-herotb-foot mc-rev-up" style={{ animationDelay: "340ms" }}>
        <div className="mc-herotb-cta">
          {hasTagline && <p className="mc-herotb-foottag">— {tagline}</p>}
          <BookButton label={ctaLabel} tone="accent" size="lg" />
          {showRating && <HeroRate rating={rating} count={count} t={t} />}
        </div>
      </div>
    </header>
  );
}
