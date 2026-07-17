import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ArrowRight } from "lucide-react";
import { GalleryImage } from "../parts/GalleryImage";
import type { GalleryVariantProps } from "../types";
import "./carousel.css";

type DragState = {
  x0: number;
  last: number;
  t: number;
  v: number;
  dx: number;
  downIndex: number;
};

/** Centre-weighted reel with 1:1 drag, velocity flick, endpoint resistance, and snap settling. */
export function Carousel({ images, onOpen, t, lightboxOpen, lightboxIndex }: GalleryVariantProps) {
  const viewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const movedRef = useRef(false);
  const [active, setActive] = useState(0);
  const [offset, setOffset] = useState(0);
  const [dragDX, setDragDX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const count = images.length;

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

  useLayoutEffect(() => {
    if (lightboxOpen && lightboxIndex >= 0 && lightboxIndex !== active) {
      settleTo(lightboxIndex);
    }
  }, [active, lightboxIndex, lightboxOpen, settleTo]);

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
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const slide = (event.target as Element).closest<HTMLElement>(".mc-galcar-slide");
    dragRef.current = {
      x0: event.clientX,
      last: event.clientX,
      t: performance.now(),
      v: 0,
      dx: 0,
      downIndex: slide ? Number(slide.dataset.gimg) : -1,
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
      if (drag.downIndex >= 0) {
        if (drag.downIndex === active) onOpen(drag.downIndex);
        else settleTo(drag.downIndex);
      }
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
    <div className="mc-galcar">
      <div className="mc-galcar-head mc-mask-in">
        <div className="mc-galcar-count">
          <span className="mc-galcar-count-current">{num(active + 1)}</span>
          <span className="mc-galcar-count-total">/ {num(count)}</span>
        </div>
        <div className="mc-galcar-rail" aria-hidden>
          <span className="mc-galcar-rail-fill" style={{ transform: `scaleX(${Math.max(0.04, progress)})` }} />
        </div>
      </div>

      <div
        className="mc-galcar-view"
        ref={viewRef}
        data-drag={dragging ? "1" : "0"}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
      >
        <div
          className="mc-galcar-track"
          ref={trackRef}
          data-drag={dragging ? "1" : "0"}
          style={{ transform: `translate3d(${offset + dragDX}px, 0, 0)` }}
        >
          {images.map((image, index) => (
            <figure
              key={index}
              className="mc-galcar-slide"
              data-gimg={index}
              data-active={index === active ? "1" : "0"}
              role="button"
              tabIndex={index === active ? 0 : -1}
              aria-label={image.alt || t("businessPage.builder.preview.aria.openGalleryImage", { number: index + 1 })}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                if (index === active) onOpen(index);
                else settleTo(index);
              }}
            >
              <div className="mc-galcar-image">
                <GalleryImage
                  src={image.src}
                  alt={image.alt}
                  fallbackLabel={t("businessPage.builder.preview.galleryTitle")}
                  draggable={false}
                />
              </div>
            </figure>
          ))}
        </div>
      </div>

      <div className="mc-galcar-controls mc-mask-in">
        <div className="mc-galcar-dots">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              className="mc-galcar-dot"
              data-on={index === active ? "1" : "0"}
              aria-label={t("businessPage.builder.preview.aria.goToGalleryImage", { number: index + 1 })}
              onClick={() => settleTo(index)}
            >
              <span />
            </button>
          ))}
        </div>
        <div className="mc-gallery-arrows mc-galcar-arrows">
          <button
            type="button"
            className="mc-gallery-arrow"
            disabled={active === 0}
            onClick={() => settleTo(active - 1)}
            aria-label={t("businessPage.builder.preview.aria.previousImage")}
          >
            <ArrowRight className="size-[18px] rotate-180" strokeWidth={1.8} />
          </button>
          <span className="mc-galcar-mobile-count" aria-hidden>
            <b>{num(active + 1)}</b>
            <i>/ {num(count)}</i>
          </span>
          <button
            type="button"
            className="mc-gallery-arrow"
            disabled={active === count - 1}
            onClick={() => settleTo(active + 1)}
            aria-label={t("businessPage.builder.preview.aria.nextImage")}
          >
            <ArrowRight className="size-[18px]" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}
