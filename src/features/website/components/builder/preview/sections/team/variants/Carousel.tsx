import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ArrowRight } from "lucide-react";
import { TeamCard } from "../parts/TeamCard";
import type { TeamVariantProps } from "../types";
import "./carousel.css";

type DragState = { x0: number; last: number; t: number; v: number; dx: number; downIndex: number };

/** Carousel (paid) — everyone on a centre-stage rail: the focused portrait blooms while its neighbours scale
 *  down and desaturate. 1:1 drag with a velocity flick, endpoint rubber-band, and snap settling; tap a side
 *  card to bring it to centre. Ported from the Gallery carousel; the centre-card "open" is inert here. */
export function Carousel({ members, ratings, nameOf, initialsOf, tintOf, t }: TeamVariantProps) {
  const viewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const movedRef = useRef(false);
  const [active, setActive] = useState(0);
  const [offset, setOffset] = useState(0);
  const [dragDX, setDragDX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const count = members.length;

  const recalc = useCallback((index: number) => {
    const view = viewRef.current;
    const track = trackRef.current;
    const slide = track?.children[index] as HTMLElement | undefined;
    if (!view || !slide) return;
    setOffset(view.clientWidth / 2 - (slide.offsetLeft + slide.offsetWidth / 2));
  }, []);

  const settleTo = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(count - 1, index));
      recalc(next);
      setActive(next);
      setDragDX(0);
    },
    [count, recalc],
  );

  useLayoutEffect(() => {
    const next = Math.max(0, Math.min(count - 1, active));
    if (next !== active) {
      setActive(next);
      return;
    }
    recalc(next);
  }, [active, count, recalc]);

  useEffect(() => {
    const view = viewRef.current;
    const track = trackRef.current;
    if (!view || !track) return;
    const measure = () => recalc(active);
    const observer = new ResizeObserver(measure);
    observer.observe(view);
    const imageNodes = Array.from(track.querySelectorAll("img"));
    imageNodes.forEach((image) => image.addEventListener("load", measure));
    const frame = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      imageNodes.forEach((image) => image.removeEventListener("load", measure));
    };
  }, [active, recalc]);

  const pitch = () => {
    const track = trackRef.current;
    if (!track?.children.length) return 320;
    if (track.children.length < 2) return (track.children[0] as HTMLElement).offsetWidth;
    return (track.children[1] as HTMLElement).offsetLeft - (track.children[0] as HTMLElement).offsetLeft;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button != null && event.button !== 0) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* synthetic/stale pointer ids can throw — the drag still works uncaptured */
    }
    const slide = (event.target as Element).closest<HTMLElement>(".mc-tmr-slide");
    dragRef.current = {
      x0: event.clientX,
      last: event.clientX,
      t: performance.now(),
      v: 0,
      dx: 0,
      downIndex: slide ? Number(slide.dataset.tmi) : -1,
    };
    movedRef.current = false;
    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    let dx = event.clientX - drag.x0;
    if ((active === 0 && dx > 0) || (active === count - 1 && dx < 0)) dx *= 0.35;
    if (Math.abs(dx) > 5) movedRef.current = true;
    const now = performance.now();
    const dt = Math.max(1, now - drag.t);
    drag.v = 0.6 * drag.v + 0.4 * ((event.clientX - drag.last) / dt);
    drag.last = event.clientX;
    drag.t = now;
    drag.dx = dx;
    setDragDX(dx);
  };

  const handlePointerUp = () => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDragging(false);

    if (!movedRef.current) {
      // A stationary tap on a side card brings it to centre; a tap on the centred card is inert in the preview.
      if (drag.downIndex >= 0 && drag.downIndex !== active) settleTo(drag.downIndex);
      return;
    }

    const slidePitch = pitch() || 1;
    let step = -drag.dx / slidePitch;
    if (Math.abs(drag.v) > 0.32) step += -Math.sign(drag.v) * 0.6;
    settleTo(active + Math.round(step));
    window.setTimeout(() => {
      movedRef.current = false;
    }, 0);
  };

  const num = (value: number) => String(value).padStart(2, "0");
  const progress = count > 1 ? active / (count - 1) : 1;

  return (
    <div className="mc-tmr">
      <div className="mc-tmr-head mc-locx-rowin">
        <div className="mc-tmr-count">
          <span className="mc-tmr-count-current">{num(active + 1)}</span>
          <span className="mc-tmr-count-total">/ {num(count)}</span>
        </div>
        <div className="mc-tmr-rail" aria-hidden>
          <span className="mc-tmr-rail-fill" style={{ transform: `scaleX(${Math.max(0.04, progress)})` }} />
        </div>
      </div>

      <div
        className="mc-tmr-view mc-mask-in"
        ref={viewRef}
        data-drag={dragging ? "1" : "0"}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
      >
        <div className="mc-tmr-track" ref={trackRef} data-drag={dragging ? "1" : "0"} style={{ transform: `translate3d(${offset + dragDX}px, 0, 0)` }}>
          {members.map(({ m, locId }, index) => {
            const r = ratings?.[m.id];
            return (
              <figure
                key={`${locId}-${m.id}`}
                className="mc-tmr-slide mc-portrait"
                data-tmi={index}
                data-active={index === active ? "1" : "0"}
                role="button"
                tabIndex={index === active ? 0 : -1}
                aria-label={nameOf(m)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  if (index !== active) settleTo(index);
                }}
              >
                <TeamCard name={nameOf(m)} initials={initialsOf(m)} image={m.profileImage ?? null} rating={r && r.count > 0 ? r.rating : null} tint={tintOf(m)} />
              </figure>
            );
          })}
        </div>
      </div>

      <div className="mc-tmr-ctrl mc-locx-rowin">
        <div className="mc-tmr-dots">
          {members.map(({ m, locId }, index) => (
            <button
              key={`${locId}-${m.id}`}
              type="button"
              className="mc-tmr-dot"
              data-on={index === active ? "1" : "0"}
              aria-label={nameOf(m)}
              onClick={() => settleTo(index)}
            >
              <span />
            </button>
          ))}
        </div>
        <div className="mc-tmr-arrows">
          <button
            type="button"
            className="mc-tmr-arr"
            disabled={active === 0}
            onClick={() => settleTo(active - 1)}
            aria-label={t("businessPage.builder.preview.aria.previousTeamMember")}
          >
            <ArrowRight className="size-[18px] rotate-180" strokeWidth={1.8} />
          </button>
          <span className="mc-tmr-mcount" aria-hidden>
            <b>{num(active + 1)}</b>
            <i>/ {num(count)}</i>
          </span>
          <button
            type="button"
            className="mc-tmr-arr"
            disabled={active === count - 1}
            onClick={() => settleTo(active + 1)}
            aria-label={t("businessPage.builder.preview.aria.nextTeamMember")}
          >
            <ArrowRight className="size-[18px]" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}
