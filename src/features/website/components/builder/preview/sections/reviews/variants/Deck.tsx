import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ArrowRight } from "lucide-react";
import { prefersReducedMotion } from "../../../shared/util";
import { useGalleryFanSpread } from "../../gallery/parts/useGalleryFan";
import { RvHead } from "../parts/RvHead";
import { RvStackFace } from "../parts/RvStackFace";
import type { ReviewsViewProps } from "../types";
import "./deck.css";

type DeckDrag = {
  x0: number;
  base: number;
};

type DeckMotionState = {
  pos: number;
  active: number;
  from: number;
  to: number;
  startedAt: number;
  duration: number;
  timer: number;
  drag: DeckDrag | null;
  moved: boolean;
  movedTimer: number;
  downIndex: number;
  direction: 1 | -1;
  holdUntil: number;
};

const easeOutQuart = (value: number) => 1 - (1 - value) ** 4;

/** Deck — a physical deck of dark testimonial cards with deliberately restrained drag physics. The card
 *  follows the pointer continuously, but a gesture can move only one voice in either direction and never
 *  inherits release velocity. This keeps the tactile toss while preventing short flicks from racing through
 *  the stack. An invisible sizer locks the deck to the tallest voice. Mirrors the source `RvStack`. */
export function Deck({ quotes, showHeading, heading, kicker, no, italic, businessName, t }: ReviewsViewProps) {
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

  const step = Math.max(240, vw * 0.46);
  const spread = useGalleryFanSpread(deckRef, reduced); // 0→1 fan-out on first view

  const [motionView, setMotionView] = useState({ pos: 0, active: 0, dragging: false });
  const motionRef = useRef<DeckMotionState>({
    pos: 0,
    active: 0,
    from: 0,
    to: 0,
    startedAt: 0,
    duration: 0,
    timer: 0,
    drag: null,
    moved: false,
    movedTimer: 0,
    downIndex: -1,
    direction: 1,
    holdUntil: 0,
  });

  const requestRender = useCallback(() => {
    const motion = motionRef.current;
    setMotionView({
      pos: motion.pos,
      active: motion.active,
      dragging: motion.drag !== null,
    });
  }, []);

  const stopTween = useCallback(() => {
    const motion = motionRef.current;
    if (motion.timer) window.clearInterval(motion.timer);
    motion.timer = 0;
  }, []);

  const tweenTo = useCallback(
    (target: number) => {
      const motion = motionRef.current;
      motion.from = motion.pos;
      motion.to = target;
      motion.startedAt = performance.now();

      if (reduced) {
        stopTween();
        motion.pos = target;
        requestRender();
        return;
      }

      const distance = Math.abs(target - motion.pos);
      motion.duration = Math.max(560, Math.min(1100, 660 + distance * 240));
      if (motion.timer) return;

      motion.timer = window.setInterval(() => {
        const progress = motion.duration
          ? Math.min(1, (performance.now() - motion.startedAt) / motion.duration)
          : 1;
        motion.pos = motion.from + (motion.to - motion.from) * easeOutQuart(progress);
        requestRender();
        if (progress >= 1) {
          motion.pos = motion.to;
          stopTween();
        }
      }, 1000 / 60);
    },
    [reduced, requestRender, stopTween],
  );

  const goTo = useCallback(
    (index: number, manual = true) => {
      const motion = motionRef.current;
      const target = Math.max(0, Math.min(Math.max(0, n - 1), index));
      motion.direction = target >= motion.active ? 1 : -1;
      motion.active = target;
      if (manual) motion.holdUntil = performance.now() + 5000;
      tweenTo(target);
      requestRender();
    },
    [n, requestRender, tweenTo],
  );

  useEffect(
    () => () => {
      stopTween();
      const motion = motionRef.current;
      if (motion.movedTimer) window.clearTimeout(motion.movedTimer);
    },
    [stopTween],
  );

  const active = Math.min(motionView.active, Math.max(0, n - 1));
  const pos = Math.min(motionView.pos, Math.max(0, n - 1) + 1);

  // Auto-advance — ping-pongs between the ends; pauses on hover / drag / off-screen / before fan-in, and for
  // a few seconds after any manual nav so a click never compounds with the timer into a double-step.
  useEffect(() => {
    if (reduced || hover || n < 2 || spread < 0.9) return;
    const id = window.setInterval(() => {
      const motion = motionRef.current;
      if (motion.drag || performance.now() < motion.holdUntil) return;
      let direction = motion.direction;
      let next = motion.active + direction;
      if (next > n - 1) {
        direction = -1;
        next = n - 2;
      } else if (next < 0) {
        direction = 1;
        next = 1;
      }
      motion.direction = direction;
      goTo(next, false);
    }, 6000);
    return () => window.clearInterval(id);
  }, [goTo, hover, n, reduced, spread]);

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

  // Pointer drag — one-to-one follow with a one-card clamp and rubber-band resistance beyond it. Release
  // chooses previous / next only after crossing 20% of a card; release speed never amplifies the gesture.
  const onDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (n < 1 || event.button !== 0) return;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture can be unavailable in embedded preview contexts; in-bounds dragging still works.
      }
      stopTween();
      const motion = motionRef.current;
      const card = (event.target as HTMLElement)?.closest?.(".mc-rvx-live") as HTMLElement | null;
      motion.downIndex = card ? parseInt(card.dataset.i ?? "-1", 10) : -1;
      motion.drag = { x0: event.clientX, base: motion.active };
      motion.moved = false;
      motion.holdUntil = performance.now() + 5000;
      requestRender();
    },
    [n, requestRender, stopTween],
  );

  const onMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const motion = motionRef.current;
      const drag = motion.drag;
      if (!drag) return;

      const deltaX = event.clientX - drag.x0;
      if (Math.abs(deltaX) > 4) motion.moved = true;
      let fraction = -deltaX / step;
      if (fraction > 1) fraction = 1 + (fraction - 1) * 0.3;
      else if (fraction < -1) fraction = -1 + (fraction + 1) * 0.3;

      let nextPos = drag.base + fraction;
      if (nextPos < 0) nextPos *= 0.32;
      else if (nextPos > n - 1) nextPos = n - 1 + (nextPos - (n - 1)) * 0.32;
      motion.pos = nextPos;
      requestRender();
    },
    [n, requestRender, step],
  );

  const onUp = useCallback(() => {
    const motion = motionRef.current;
    const drag = motion.drag;
    if (!drag) return;
    motion.drag = null;
    const fraction = motion.pos - drag.base;
    const target = fraction > 0.2 ? drag.base + 1 : fraction < -0.2 ? drag.base - 1 : drag.base;
    goTo(target);
    if (motion.movedTimer) window.clearTimeout(motion.movedTimer);
    motion.movedTimer = window.setTimeout(() => {
      motion.moved = false;
      motion.movedTimer = 0;
    }, 0);
  }, [goTo]);

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(motionRef.current.active + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(motionRef.current.active - 1);
      }
    },
    [goTo],
  );

  const onClick = useCallback(() => {
    const motion = motionRef.current;
    if (motion.downIndex < 0 || motion.moved || motion.downIndex === motion.active) return;
    goTo(motion.downIndex);
  }, [goTo]);

  return (
    <>
      <RvHead no={no} kicker={kicker} heading={heading} showHeading={showHeading} center />
      <div className="mc-rvx" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <div
          className="mc-rvx-deck"
          ref={deckRef}
          data-drag={motionView.dragging ? "1" : "0"}
          tabIndex={0}
          role="group"
          aria-label={t("businessPage.builder.preview.reviewsDeckHint")}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onLostPointerCapture={onUp}
          onKeyDown={onKeyDown}
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
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <div className="mc-rvx-arrows">
            <button
              type="button"
              className="mc-rv-arr"
              aria-label={t("businessPage.builder.preview.reviewsPrev")}
              disabled={active === 0}
              onClick={() => goTo(active - 1)}
            >
              <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.6} style={{ transform: "rotate(180deg)" }} />
            </button>
            <button
              type="button"
              className="mc-rv-arr"
              aria-label={t("businessPage.builder.preview.reviewsNext")}
              disabled={active === n - 1}
              onClick={() => goTo(active + 1)}
            >
              <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
