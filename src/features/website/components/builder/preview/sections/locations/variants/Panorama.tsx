import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ArrowRight, Star } from "lucide-react";
import {
  locationArea,
  locationPhoto,
  locationPostalAddress,
} from "../../../shared/contact";
import { LocationBookAction } from "../parts/LocationBookAction";
import { LocationImage } from "../parts/LocationImage";
import type { LocationsVariantProps } from "../types";
import "./panorama.css";

type DragState = {
  x0: number;
  last: number;
  t: number;
  v: number;
  dx: number;
  downIndex: number;
};

/**
 * Panorama — centred full-width sweeps with direct drag, smoothed flick velocity,
 * end resistance and snap settling. Location navigation remains live; booking is visual-only.
 */
export function Panorama({ shown, idx, onSelect, t }: LocationsVariantProps) {
  const viewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const movedRef = useRef(false);
  const activeIndexRef = useRef(idx);
  activeIndexRef.current = idx;
  const [offset, setOffset] = useState(0);
  const [dragDX, setDragDX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const count = shown.length;

  const recalc = useCallback((index: number) => {
    const view = viewRef.current;
    const track = trackRef.current;
    const panel = track?.children[index] as HTMLElement | undefined;
    if (!view || !panel) return;
    setOffset(view.clientWidth / 2 - (panel.offsetLeft + panel.offsetWidth / 2));
  }, []);

  const settleTo = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(count - 1, index));
      activeIndexRef.current = next;
      setDragDX(0);
      if (next === idx) recalc(next);
      else onSelect(next);
    },
    [count, idx, onSelect, recalc],
  );

  useLayoutEffect(() => {
    recalc(idx);
  }, [idx, recalc, shown]);

  useEffect(() => {
    const view = viewRef.current;
    const track = trackRef.current;
    if (!view || !track) return;
    const measure = () => recalc(activeIndexRef.current);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(view);
    const images = Array.from(track.querySelectorAll("img"));
    images.forEach((image) => image.addEventListener("load", measure));
    const frame = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      images.forEach((image) => image.removeEventListener("load", measure));
    };
  }, [recalc, shown]);

  const pitch = () => {
    const track = trackRef.current;
    if (!track?.children.length) return 320;
    if (track.children.length < 2) return (track.children[0] as HTMLElement).offsetWidth;
    return (track.children[1] as HTMLElement).offsetLeft - (track.children[0] as HTMLElement).offsetLeft;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture can fail if the pointer ended before React receives the event.
    }
    const panel = (event.target as Element).closest<HTMLElement>(".mc-locp-panel");
    dragRef.current = {
      x0: event.clientX,
      last: event.clientX,
      t: performance.now(),
      v: 0,
      dx: 0,
      downIndex: panel ? Number(panel.dataset.locationIndex) : -1,
    };
    movedRef.current = false;
    setDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    let dx = event.clientX - drag.x0;
    const active = activeIndexRef.current;
    if ((active === 0 && dx > 0) || (active === count - 1 && dx < 0)) dx *= 0.35;
    if (Math.abs(dx) > 5) movedRef.current = true;
    const now = performance.now();
    const elapsed = Math.max(1, now - drag.t);
    drag.v = 0.6 * drag.v + 0.4 * ((event.clientX - drag.last) / elapsed);
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
      if (drag.downIndex >= 0) settleTo(drag.downIndex);
      return;
    }

    const panelPitch = pitch() || 1;
    let step = -drag.dx / panelPitch;
    if (Math.abs(drag.v) > 0.32) step += -Math.sign(drag.v) * 0.6;
    settleTo(activeIndexRef.current + Math.round(step));
    window.setTimeout(() => {
      movedRef.current = false;
    }, 0);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      settleTo(activeIndexRef.current + (event.key === "ArrowRight" ? 1 : -1));
    }
  };

  const numberFor = (index: number) => String(index + 1).padStart(2, "0");
  const total = String(count).padStart(2, "0");
  const progress = count > 1 ? idx / (count - 1) : 1;

  return (
    <div className="mc-locp">
      <div
        className="mc-locp-view mc-mask-in"
        ref={viewRef}
        data-drag={dragging ? "1" : "0"}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
        onKeyDown={handleKeyDown}
        role="region"
        aria-roledescription="carousel"
        aria-label={t("businessPage.builder.preview.locationsTitle")}
        tabIndex={0}
      >
        <div
          className="mc-locp-track"
          ref={trackRef}
          data-drag={dragging ? "1" : "0"}
          style={{ transform: `translate3d(${offset + dragDX}px, 0, 0)` }}
        >
          {shown.map((location, index) => {
            const photo = locationPhoto(location);
            const area = locationArea(location);
            const address = locationPostalAddress(location);
            const reviews = location.totalReviews ?? 0;
            const rating = reviews > 0 ? Number(location.averageRating ?? 0) : null;
            return (
              <div
                key={location.id}
                className="mc-locp-panel"
                data-location-index={index}
                data-active={index === idx ? "1" : "0"}
                role="group"
                aria-roledescription="slide"
                aria-current={index === idx ? "true" : undefined}
                aria-label={`${numberFor(index)} / ${total}: ${location.name}`}
              >
                {photo ? (
                  <LocationImage
                    src={photo}
                    alt={location.name}
                    draggable={false}
                    className="mc-locp-photo"
                    fallbackLabel={location.name}
                  />
                ) : (
                  <span className="mc-locp-placeholder" aria-hidden="true" />
                )}
                <span className="mc-locp-scrim" aria-hidden="true" />
                <span className="mc-locp-chip">
                  {numberFor(index)} / {total}
                </span>
                <div className="mc-locp-cap">
                  <div className="mc-locp-copy">
                    {area ? <span className="mc-locp-area">{area}</span> : null}
                    <div className="mc-locp-name">{location.name}</div>
                    <div className="mc-locp-meta">
                      {address ? <span>{address}</span> : null}
                      {rating !== null ? (
                        <span className="mc-locp-rating">
                          <Star aria-hidden="true" size={11} fill="currentColor" strokeWidth={1.5} />
                          {rating.toFixed(1)} · {t("businessPage.builder.preview.reviewsCount", { count: reviews })}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {location.allowOnlineBooking ? (
                    <LocationBookAction
                      className="mc-locp-book"
                      label={t("businessPage.builder.preview.locBookHere")}
                      arrowSize={15}
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {count > 1 ? (
        <div className="mc-locp-controls mc-locx-rowin">
          <div className="mc-locp-count" aria-live="polite">
            <span className="mc-locp-count-current">{numberFor(idx)}</span>
            <span className="mc-locp-count-total">/ {total}</span>
          </div>
          <div className="mc-locp-rail" aria-hidden="true">
            <span
              className="mc-locp-rail-fill"
              style={{ transform: `scaleX(${Math.max(0.04, progress)})` }}
            />
          </div>
          <div className="mc-locp-arrows">
            <button
              type="button"
              className="mc-locp-arr"
              aria-label={t("businessPage.builder.preview.locPrevious")}
              disabled={idx === 0}
              onClick={() => settleTo(activeIndexRef.current - 1)}
            >
              <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} className="mc-locp-arrow-back" />
            </button>
            <button
              type="button"
              className="mc-locp-arr"
              aria-label={t("businessPage.builder.preview.locNext")}
              disabled={idx === count - 1}
              onClick={() => settleTo(activeIndexRef.current + 1)}
            >
              <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
