import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Maximize2, ArrowRight } from "lucide-react";
import type { GalleryVariantProps } from "../types";

/** Carousel — a centre-weighted coverflow with drag/swipe, dots, arrows, and a progress rail; clicking the
 *  active slide opens the shared lightbox, clicking a side slide brings it to centre. */
export function Carousel({ images, onOpen, t }: GalleryVariantProps) {
  const n = images.length;
  const [active, setActive] = useState(0);
  const [offset, setOffset] = useState(0);
  const viewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ on: false, x: 0, lastX: 0, moved: false });

  const recalc = useCallback((idx: number) => {
    const view = viewRef.current;
    const track = trackRef.current;
    const slide = track?.children[idx] as HTMLElement | undefined;
    if (!view || !slide) return;
    setOffset(view.clientWidth / 2 - (slide.offsetLeft + slide.offsetWidth / 2));
  }, []);
  useLayoutEffect(() => recalc(active), [active, n, recalc]);
  useEffect(() => {
    const onResize = () => recalc(active);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, recalc]);

  const go = (i: number) => setActive(Math.max(0, Math.min(n - 1, i)));
  const begin = (x: number) => (drag.current = { on: true, x, lastX: x, moved: false });
  const move = (x: number) => {
    const d = drag.current;
    if (!d.on) return;
    d.lastX = x;
    if (Math.abs(x - d.x) > 6) d.moved = true;
  };
  const end = () => {
    const d = drag.current;
    if (!d.on) return;
    d.on = false;
    const dx = d.lastX - d.x;
    if (Math.abs(dx) > 48) go(active + (dx < 0 ? 1 : -1));
  };

  const num = (x: number) => String(x).padStart(2, "0");
  const progress = n > 1 ? active / (n - 1) : 1;

  return (
    <div className="mc-galcar">
      <div className="mc-galcar-head">
        <div className="mc-galcar-count">
          <span className="mc-galcar-count-n">{num(active + 1)}</span>
          <span className="mc-galcar-count-d">/ {num(n)}</span>
        </div>
        <div className="mc-galcar-rail">
          <span className="mc-galcar-rail-fill" style={{ transform: `scaleX(${Math.max(0.04, progress)})` }} />
        </div>
      </div>
      <div
        className="mc-galcar-view"
        ref={viewRef}
        onMouseDown={(e) => begin(e.clientX)}
        onMouseMove={(e) => move(e.clientX)}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={(e) => begin(e.touches[0].clientX)}
        onTouchMove={(e) => move(e.touches[0].clientX)}
        onTouchEnd={end}
      >
        <div className="mc-galcar-track" ref={trackRef} style={{ transform: `translate3d(${offset}px,0,0)` }}>
          {images.map((g, i) => (
            <figure
              key={i}
              className="mc-galcar-slide"
              data-active={i === active ? "1" : "0"}
              onClick={() => {
                if (drag.current.moved) return;
                if (i !== active) go(i);
                else onOpen(i);
              }}
            >
              <div className="mc-galcar-img" data-gimg={i}>
                <img
                  src={g.src}
                  alt={g.alt}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  onLoad={() => i === active && recalc(active)}
                />
                {i === active && (
                  <span className="mc-galcar-expand">
                    <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.8} /> {t("businessPage.builder.preview.galleryViewFull")}
                  </span>
                )}
              </div>
            </figure>
          ))}
        </div>
      </div>
      <div className="mc-galcar-ctrl">
        <div className="mc-galcar-dots">
          {images.map((_, i) => (
            <button key={i} type="button" className="mc-galcar-dot" data-on={i === active ? "1" : "0"} onClick={() => go(i)} aria-label={`${i + 1}`}>
              <span />
            </button>
          ))}
        </div>
        <div className="mc-galcar-arrows">
          <button
            type="button"
            className="mc-galcar-arr"
            disabled={active === 0}
            onClick={() => go(active - 1)}
            aria-label={t("businessPage.builder.preview.aria.previousImage")}
          >
            <ArrowRight className="h-[18px] w-[18px]" style={{ transform: "rotate(180deg)" }} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className="mc-galcar-arr"
            disabled={active === n - 1}
            onClick={() => go(active + 1)}
            aria-label={t("businessPage.builder.preview.aria.nextImage")}
          >
            <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}
