import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowRight } from "lucide-react";
import { prefersReducedMotion } from "../../../shared/util";
import { useGalleryFan, useGalleryFanSpread } from "../../gallery/parts/useGalleryFan";
import { RvHead } from "../parts/RvHead";
import { RvStackFace } from "../parts/RvStackFace";
import type { ReviewsViewProps } from "../types";
import "./deck.css";

/** Deck — a physical deck of dark testimonial cards you flick through. The shared continuous-position engine
 *  (useGalleryFan: 1:1 drag, velocity flick, eased settle, wheel + arrow-key nav) drives every card's
 *  transform from its live offset (o = i − pos), so Prev/Next slide the whole stack — the front card lifts
 *  away up-left as the next rises from the peek behind it. An invisible sizer locks the deck to the tallest
 *  voice; the stack fans in on first view. Mirrors the source `RvStack`. */
export function Deck({ quotes, heading, kicker, no, italic, businessName, t }: ReviewsViewProps) {
  const n = quotes.length;
  const reduced = prefersReducedMotion();
  const [hover, setHover] = useState(false);
  const [vw, setVw] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1200));
  const deckRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const on = () => setVw(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  const fan = useGalleryFan(n, Math.max(240, vw * 0.34), { reducedMotion: reduced }); // drag distance per card
  const spread = useGalleryFanSpread(deckRef, reduced); // 0→1 fan-out on first view
  // Open on the first voice.
  useEffect(() => {
    fan.goTo(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const active = fan.active;
  const pos = fan.pos;

  // Auto-advance — ping-pongs between the ends; pauses on hover / drag / off-screen / before fan-in, and for
  // a few seconds after any manual nav so a click never compounds with the timer into a double-step.
  const dirRef = useRef(1);
  const holdRef = useRef(0);
  const go = (i: number) => {
    const target = Math.max(0, Math.min(n - 1, i));
    dirRef.current = target >= active ? 1 : -1;
    holdRef.current = performance.now() + 4000;
    fan.goTo(target);
  };
  useEffect(() => {
    if (reduced || hover || fan.dragging || n < 2 || spread < 0.9) return;
    const id = setInterval(() => {
      if (performance.now() < holdRef.current) return;
      let d = dirRef.current;
      let next = fan.active + d;
      if (next > n - 1) {
        d = -1;
        next = n - 2;
      } else if (next < 0) {
        d = 1;
        next = 1;
      }
      dirRef.current = d;
      fan.goTo(next);
    }, 5200);
    return () => clearInterval(id);
    // fan is intentionally omitted: it's a fresh object each render and would reset the timer every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hover, fan.dragging, fan.active, n, reduced, spread]);

  const brand = (businessName || "Studio").trim().charAt(0).toUpperCase() || "S";
  const num = (i: number) => String(i + 1).padStart(2, "0");

  // Per-card transform from its live offset o = i − pos, blended by the fan-in spread. Waiting cards sit
  // lower-right, darker and slightly blurred with depth. The spent card is tossed off the deck's left edge
  // on an upward arc, opaque until it has mostly cleared the frame.
  const faceStyle = (o: number): CSSProperties => {
    const s = spread;
    let tx: number, ty: number, tz: number, rz: number, ry: number, op: number, z: number, blur: number, br: number;
    if (o >= 0) {
      tx = o * 3.0;
      ty = o * 7.5;
      tz = -o * 92;
      rz = o * 2.1;
      ry = -o * 4;
      op = o < 2.2 ? 1 : Math.max(0, 1 - (o - 2.2) / 0.6);
      z = Math.round(100 - o * 10);
      blur = Math.min(o * 1.2, 4);
      br = Math.max(0.55, 1 - o * 0.16);
    } else {
      const p = Math.min(1, -o);
      tx = -p * 118;
      ty = -Math.sin(p * Math.PI) * 9;
      tz = p * 40;
      rz = -p * 11;
      ry = p * 8;
      op = p < 0.72 ? 1 : Math.max(0, 1 - (p - 0.72) / 0.28);
      z = 130;
      blur = 0;
      br = 1;
    }
    const front = o >= 0 && o < 0.002;
    const fl: string[] = [];
    if (blur > 0.06) fl.push(`blur(${blur.toFixed(1)}px)`);
    if (br < 0.995) fl.push(`brightness(${br.toFixed(2)})`);
    return {
      transform: `translate3d(${(tx * s).toFixed(2)}%,${(ty * s).toFixed(2)}%,${(tz * s).toFixed(1)}px) rotateY(${(ry * s).toFixed(2)}deg) rotate(${((-1.4 + rz) * s).toFixed(2)}deg)`,
      opacity: front ? 1 : op,
      filter: fl.length ? fl.join(" ") : "none",
      zIndex: z,
    };
  };

  // Click routing — pointer capture (drag physics) retargets the click to the deck, so remember which card
  // the press started on and act on the deck's click.
  const downRef = useRef(-1);
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const card = (e.target as HTMLElement)?.closest?.(".mc-rvx-live") as HTMLElement | null;
    downRef.current = card ? parseInt(card.dataset.i ?? "-1", 10) : -1;
    fan.stageProps.onPointerDown(e);
  };
  const onClick = () => {
    const i = downRef.current;
    if (i < 0 || fan.moved()) return;
    if (i !== active) go(i);
  };

  return (
    <>
      <RvHead no={no} kicker={kicker} heading={heading} center />
      <div className="mc-rvx" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <div
          className="mc-rvx-deck"
          ref={deckRef}
          data-drag={fan.dragging ? "1" : "0"}
          tabIndex={0}
          role="group"
          aria-label={t("businessPage.builder.preview.reviewsDeckHint")}
          {...fan.stageProps}
          onPointerDown={onDown}
          onClick={onClick}
        >
          <div className="mc-rvx-sizer" aria-hidden>
            {quotes.map((r, i) => (
              <div key={`g${i}`} className="mc-rvx-card">
                <RvStackFace item={r} brand={brand} animateIn={false} italic={italic} t={t} />
              </div>
            ))}
          </div>
          {quotes.map((r, i) => {
            const o = i - pos;
            if (o < -1.15 || o > 3.15) return null;
            return (
              <article key={r.id} className="mc-rvx-card mc-rvx-live" data-i={i} aria-hidden={i !== active} style={faceStyle(o)}>
                <RvStackFace item={r} brand={brand} animateIn={i === active && !reduced} italic={italic} t={t} />
              </article>
            );
          })}
        </div>
        <div className="mc-rvx-foot">
          <span aria-hidden />
          <div className="mc-rvx-pager" role="group" aria-label={t("businessPage.builder.preview.kicker.reviews")}>
            {quotes.map((r, i) => (
              <button
                key={r.id}
                type="button"
                className="mc-rvx-dash"
                data-on={i === active ? "1" : "0"}
                aria-current={i === active ? "true" : undefined}
                aria-label={`${t("businessPage.builder.preview.reviewsVoice", { n: num(i) })} — ${r.customerName}`}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <div className="mc-rvx-arrows">
            <button
              type="button"
              className="mc-rv-arr"
              aria-label={t("businessPage.builder.preview.reviewsPrev")}
              disabled={active === 0}
              onClick={() => go(active - 1)}
            >
              <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.6} style={{ transform: "rotate(180deg)" }} />
            </button>
            <button
              type="button"
              className="mc-rv-arr"
              aria-label={t("businessPage.builder.preview.reviewsNext")}
              disabled={active === n - 1}
              onClick={() => go(active + 1)}
            >
              <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
