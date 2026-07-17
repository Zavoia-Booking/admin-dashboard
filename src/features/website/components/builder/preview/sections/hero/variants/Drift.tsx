import { useEffect, useRef } from "react";
import { BookButton } from "../../../shared/primitives";
import { prefersReducedMotion } from "../../../shared/util";
import { HERO_DELAY } from "../constants";
import { WordRise } from "../parts/WordRise";
import { HeroRate } from "../parts/HeroRate";
import { deriveHeroContent } from "../parts/content";
import type { HeroVariantProps } from "../types";
import "./drift.css";

/** Drift — a grainy aurora curtain: luminous accent light rises out of near-black, raked with fine
 *  light-rays under a slow liquid sheen and heavy film grain, behind a hairline corner-tick frame and an
 *  all-caps statement. On a desktop-width surface with a real mouse the blobs are shoved away from the
 *  cursor (hover); a tablet/phone-width surface (or a coarse pointer) self-runs a slow Lissajous wander.
 *  (Design source: HeroDrift.) */
export function Drift(props: HeroVariantProps) {
  const { t } = props;
  const { name, tagline, rating, count, showRating, ctaLabel } = deriveHeroContent(props);
  const driftRef = useRef<HTMLElement>(null);
  const nameLen = name.trim().length;
  const titleSize = nameLen > 22 ? " is-xlong" : nameLen > 14 ? " is-long" : "";

  useEffect(() => {
    const el = driftRef.current;
    if (!el || prefersReducedMotion()) return;
    const pars = Array.from(el.querySelectorAll<HTMLElement>(".mc-herodr-par"));
    if (!pars.length) return;
    // A real mouse (fine pointer + hover) on a desktop-WIDTH surface gets cursor repulsion; a tablet/phone
    // width — or a coarse pointer — self-runs the Lissajous wander. The width read is the hero's LOGICAL
    // width (offsetWidth), not its on-screen size: the preview is transform: scale-ed, so a bounding-rect
    // read would report the shrunk width and wrongly force autonomous on every device.
    const finePtr = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;

    // Tablet/phone (or no hover): each blob wanders a quasi-periodic path — every axis sums two
    // incommensurate sinusoids so the loop never visibly repeats — and its own speed drives a gentle
    // squash-&-stretch, so the field breathes and deforms like liquid rather than sliding as rigid discs.
    const startAutonomous = () => {
      const AMP = [[168, 126], [138, 158], [118, 108]];  // primary sway (x, y) px
      const AMP2 = [[56, 45], [48, 60], [42, 39]];       // secondary sway px
      const PER = [[19, 15], [27, 21], [23, 29]];        // primary periods (s)
      const PER2 = [[8.5, 6.7], [11, 9.3], [7.4, 10.6]]; // secondary periods (s)
      const PH = [[0.0, 1.6], [2.3, 0.7], [4.1, 3.2]];
      const PH2 = [[1.1, 3.4], [0.5, 2.2], [3.7, 1.3]];
      const STRETCH_K = 0.0006; // (px/s) → stretch fraction — the wander is slow, so the gain runs higher
      const STRETCH_MAX = 0.12;
      // Pivot each wrapper on its blob's centre so the stretch scales the blob itself, not the hero.
      pars.forEach((p) => {
        const b = (p.firstElementChild as HTMLElement | null) ?? p;
        p.style.transformOrigin = `${(b.offsetLeft + b.offsetWidth / 2).toFixed(1)}px ${(b.offsetTop + b.offsetHeight / 2).toFixed(1)}px`;
      });
      const prev = pars.map(() => ({ x: 0, y: 0 }));
      const sqz = pars.map(() => ({ s: 0, a: 0 }));
      let rafW = 0;
      let last = 0;
      const tStart = performance.now();
      const wander = (now: number) => {
        let dt = last ? (now - last) / 1000 : 1 / 60;
        const firstFrame = !last;
        last = now;
        if (dt > 0.05) dt = 0.05;
        const ease = Math.min(1, dt * 12);
        const time = (now - tStart) / 1000;
        for (let i = 0; i < pars.length; i++) {
          const a = AMP[i] ?? AMP[AMP.length - 1];
          const a2 = AMP2[i] ?? AMP2[AMP2.length - 1];
          const pr = PER[i] ?? PER[PER.length - 1];
          const pr2 = PER2[i] ?? PER2[PER2.length - 1];
          const ph = PH[i] ?? PH[PH.length - 1];
          const ph2 = PH2[i] ?? PH2[PH2.length - 1];
          const x = Math.sin((time / pr[0]) * 6.2832 + ph[0]) * a[0] + Math.sin((time / pr2[0]) * 6.2832 + ph2[0]) * a2[0];
          const y = Math.cos((time / pr[1]) * 6.2832 + ph[1]) * a[1] + Math.cos((time / pr2[1]) * 6.2832 + ph2[1]) * a2[1];
          if (firstFrame) {
            prev[i].x = x;
            prev[i].y = y;
          }
          const vx = (x - prev[i].x) / dt;
          const vy = (y - prev[i].y) / dt;
          prev[i].x = x;
          prev[i].y = y;
          const speed = Math.hypot(vx, vy);
          sqz[i].s += (Math.min(STRETCH_MAX, speed * STRETCH_K) - sqz[i].s) * ease;
          if (speed > 4) {
            let da = Math.atan2(vy, vx) - sqz[i].a;
            da -= Math.round(da / (Math.PI * 2)) * (Math.PI * 2);
            sqz[i].a += da * ease;
          }
          const s = sqz[i].s;
          const deg = (sqz[i].a * 180) / Math.PI;
          pars[i].style.transform =
            `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) ` +
            `rotate(${deg.toFixed(1)}deg) scale(${(1 + s).toFixed(3)},${(1 - s * 0.65).toFixed(3)}) rotate(${(-deg).toFixed(1)}deg)`;
        }
        rafW = requestAnimationFrame(wander);
      };
      rafW = requestAnimationFrame(wander);
      return () => {
        if (rafW) cancelAnimationFrame(rafW);
        for (const p of pars) {
          p.style.transform = "";
          p.style.transformOrigin = "";
        }
      };
    };

    // Desktop: cursor PARALLAX — every blob tracks the pointer at its own rate, so moving the mouse flows the
    // whole gradient mesh across the field and re-composes light against dark (not a local nudge on one blob).
    // A critically-damped smooth-follow gives the flow weight without overshoot; speed drives a squash-&-
    // stretch so the blobs deform like liquid; a light press keeps a crowded pair from fully overlapping.
    const startPointerPush = () => {
      const FOLLOW = [0.48, 0.22, 0.34]; // per-blob parallax factor toward the pointer — bigger = flows further
      const SMOOTH = [0.34, 0.5, 0.42]; // follow time (s), varied so the mesh re-composes instead of sliding rigidly
      const BLOB_PUSH = 110; // light blob↔blob press so a crowded pair doesn't fully overlap
      const COMPRESS = 320; // px a pair must be squeezed below its rest gap for full mutual press
      const STRETCH_K = 0.0002; // (px/s) → stretch fraction — how much speed deforms a blob
      const STRETCH_MAX = 0.16; // cap the stretch at 16%
      const cur = pars.map(() => ({ x: 0, y: 0 }));
      const tgt = pars.map(() => ({ x: 0, y: 0 }));
      const vel = pars.map(() => ({ x: 0, y: 0 }));
      const sqz = pars.map(() => ({ s: 0, a: 0 })); // smoothed stretch magnitude + angle (rad)
      let homes: { x: number; y: number }[] = [];
      let restGap: number[][] = [];
      let cx = 0; // field centre, logical px — the pointer offset from here drives the parallax
      let cy = 0;
      const measure = () => {
        homes = pars.map((p) => {
          const b = (p.firstElementChild as HTMLElement | null) ?? p;
          return { x: b.offsetLeft + b.offsetWidth / 2, y: b.offsetTop + b.offsetHeight / 2 };
        });
        restGap = homes.map((hi) => homes.map((hj) => Math.hypot(hi.x - hj.x, hi.y - hj.y) || 1));
        cx = el.offsetWidth / 2;
        cy = el.offsetHeight / 2;
        // Pivot each wrapper on its blob's centre so the stretch scales the blob itself, not the hero.
        pars.forEach((p, i) => {
          p.style.transformOrigin = `${homes[i].x.toFixed(1)}px ${homes[i].y.toFixed(1)}px`;
        });
      };
      const smooth = (t: number) => {
        const c = t < 0 ? 0 : t > 1 ? 1 : t;
        return c * c * (3 - 2 * c);
      };
      let mx = 0;
      let my = 0;
      let raf = 0;
      let last = 0;
      const tick = (now: number) => {
        let dt = last ? (now - last) / 1000 : 1 / 60;
        last = now;
        if (dt > 0.05) dt = 0.05; // clamp after a tab stall so the integrator can't explode
        const ease = Math.min(1, dt * 12); // fps-independent smoothing for the stretch readout
        const ox = mx - cx; // pointer offset from the field centre — the whole mesh flows toward it
        const oy = my - cy;
        for (let i = 0; i < pars.length; i++) {
          let tx = ox * FOLLOW[i];
          let ty = oy * FOLLOW[i];
          // Light press: only wakes when the flow squeezes a pair below its resting gap.
          for (let j = 0; j < pars.length; j++) {
            if (j === i) continue;
            const bx = homes[i].x + cur[i].x - (homes[j].x + cur[j].x);
            const by = homes[i].y + cur[i].y - (homes[j].y + cur[j].y);
            const bd = Math.hypot(bx, by) || 1;
            const squeeze = restGap[i][j] - bd;
            if (squeeze > 0) {
              const kb = smooth(squeeze / COMPRESS);
              tx += (bx / bd) * BLOB_PUSH * kb;
              ty += (by / bd) * BLOB_PUSH * kb;
            }
          }
          tgt[i].x = tx;
          tgt[i].y = ty;
        }
        let moving = false;
        for (let i = 0; i < pars.length; i++) {
          // Critically-damped smooth-follow: heavy momentum, zero overshoot.
          const omega = 2 / (SMOOTH[i] ?? SMOOTH[SMOOTH.length - 1]);
          const od = omega * dt;
          const e = 1 / (1 + od + 0.48 * od * od + 0.235 * od * od * od);
          let change = cur[i].x - tgt[i].x;
          let temp = (vel[i].x + omega * change) * dt;
          vel[i].x = (vel[i].x - omega * temp) * e;
          cur[i].x = tgt[i].x + (change + temp) * e;
          change = cur[i].y - tgt[i].y;
          temp = (vel[i].y + omega * change) * dt;
          vel[i].y = (vel[i].y - omega * temp) * e;
          cur[i].y = tgt[i].y + (change + temp) * e;
          // Squash & stretch from speed, eased so it never flickers at rest.
          const speed = Math.hypot(vel[i].x, vel[i].y);
          sqz[i].s += (Math.min(STRETCH_MAX, speed * STRETCH_K) - sqz[i].s) * ease;
          if (speed > 10) {
            let da = Math.atan2(vel[i].y, vel[i].x) - sqz[i].a;
            da -= Math.round(da / (Math.PI * 2)) * (Math.PI * 2);
            sqz[i].a += da * ease;
          }
          const s = sqz[i].s;
          const deg = (sqz[i].a * 180) / Math.PI;
          pars[i].style.transform =
            `translate3d(${cur[i].x.toFixed(1)}px,${cur[i].y.toFixed(1)}px,0) ` +
            `rotate(${deg.toFixed(1)}deg) scale(${(1 + s).toFixed(3)},${(1 - s * 0.65).toFixed(3)}) rotate(${(-deg).toFixed(1)}deg)`;
          if (speed > 1.5 || s > 0.002 || Math.abs(cur[i].x - tgt[i].x) > 0.2 || Math.abs(cur[i].y - tgt[i].y) > 0.2) {
            moving = true;
          }
        }
        if (moving) {
          raf = requestAnimationFrame(tick);
        } else {
          raf = 0;
          last = 0;
        }
      };
      // The preview is transform: scale-ed, so map the pointer from on-screen px into the hero's own logical space.
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const scale = r.width / el.offsetWidth || 1;
        mx = (e.clientX - r.left) / scale;
        my = (e.clientY - r.top) / scale;
        if (!raf) raf = requestAnimationFrame(tick);
      };
      const onLeave = () => {
        mx = cx; // recentre → the field flows back home
        my = cy;
        if (!raf) raf = requestAnimationFrame(tick);
      };
      measure();
      mx = cx;
      my = cy;
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      window.addEventListener("resize", measure);
      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("resize", measure);
        if (raf) cancelAnimationFrame(raf);
        for (const p of pars) {
          p.style.transform = "";
          p.style.transformOrigin = "";
        }
      };
    };

    // Pick the mode from the current logical width, and re-pick when the device toggle resizes the hero
    // across the 1024px line (the effect mounts once; switching desktop⇄tablet/phone does not remount it).
    let mode: "auto" | "push" | "" = "";
    let stop: (() => void) | null = null;
    const decide = () => {
      const next = !finePtr || el.offsetWidth <= 1024 ? "auto" : "push";
      if (next === mode) return;
      stop?.();
      for (const p of pars) p.style.transform = "";
      mode = next;
      stop = next === "auto" ? startAutonomous() : startPointerPush();
    };
    decide();
    const ro = new ResizeObserver(() => decide());
    ro.observe(el);
    return () => {
      ro.disconnect();
      stop?.();
    };
  }, []);

  return (
    <header ref={driftRef} className="mc-herodr">
      <div className="mc-herodr-sky" aria-hidden>
        <div className="mc-herodr-par mc-herodr-par1"><div className="mc-herodr-aurora mc-herodr-a1" /></div>
        <div className="mc-herodr-par mc-herodr-par2"><div className="mc-herodr-aurora mc-herodr-a2" /></div>
        <div className="mc-herodr-par mc-herodr-par3"><div className="mc-herodr-aurora mc-herodr-a3" /></div>
        <div className="mc-herodr-sheen" />
      </div>
      <div className="mc-herodr-rays" aria-hidden />
      <div className="mc-herodr-vign" aria-hidden />
      <div className="mc-herodr-grain" aria-hidden />
      <div className="mc-herodr-frame" aria-hidden />
      <div className="mc-herodr-in">
        <WordRise text={name} base={150} step={70} className={"mc-herodr-title" + titleSize} />
        {tagline && (
          <p className="mc-herodr-tag mc-rev-up" style={{ animationDelay: `${HERO_DELAY.tagline}ms` }}>
            {tagline}
          </p>
        )}
        <div className="mc-herodr-cta mc-rev-up" style={{ animationDelay: "540ms" }}>
          <BookButton label={ctaLabel} tone="accent" size="lg" />
          {showRating && <HeroRate rating={rating} count={count} onImg t={t} />}
        </div>
      </div>
    </header>
  );
}
